import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import {
  ComprobanteItem,
  ComprobantesService,
  EfactFilter,
  EfactLoteItem,
  EfactLoteRequest,
  EfactLoteResultado
} from 'src/app/modulos/comprobantes/comprobantes.service';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import Swal from 'sweetalert2';
import { concatMap, from } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import {
  textoComprobanteSunatRecibo,
  textoNumeracionTicketRecibo
} from 'src/app/modulos/ventas/recibos/utils/recibo-listado-ui.util';
import { resolverTicketEfactDesdeItem } from '../utils/efact-ticket-resolver.util';
import { generarPdfTicketDesdeUblXml } from '../utils/efact-representacion-ticket-pdf.util';
import { ModoListaEfact } from '../utils/efact-lista.util';

interface Comprobante extends ComprobanteItem {}

@Component({
  selector: 'app-lista-comprobantes',
  templateUrl: './lista-comprobantes.component.html',
  styleUrls: ['./lista-comprobantes.component.css']
})
export class ListaComprobantesComponent implements OnInit {
  /** emitidos: CPE + ticket POS; pendientes: solo ticket POS, emisión masiva. */
  modo: ModoListaEfact = 'emitidos';

  readonly columnasEmitidos = ['origen','tipo','fecha','numero','ticketPos','ticket','cliente','total','estadoOse','estadoSunat','resultado','acciones'];
  readonly columnasPendientes = ['select','origen','tipo','fecha','numero','ticketPos','ticket','cliente','total','estadoOse','estadoSunat','resultado','acciones'];
  /** Tamaño máximo de ítems por POST a sincronizar-estados (evita saturar la OSE). */
  readonly syncLoteMax = 25;

  filterForm: FormGroup;
  lista: Comprobante[] = [];
  MainDS: MatTableDataSource<Comprobante> = new MatTableDataSource<Comprobante>();
  displayedColumns: string[] = [];
  total = 0;
  page = 1;
  pageSize = 15;
  loading = false;
  syncing = false;
  nota = '';
  seleccionados: Record<string, boolean> = {};

  get esModoEmitidos(): boolean {
    return this.modo === 'emitidos';
  }

  get esModoPendientes(): boolean {
    return this.modo === 'pendientes';
  }

  get tituloPantalla(): string {
    return this.esModoEmitidos
      ? 'Comprobantes emitidos (CPE SUNAT + ticket POS)'
      : 'Tickets pendientes de emisión eFact';
  }

  constructor(
    private fb: FormBuilder,
    private service: ComprobantesService,
    private funcionesService: FuncionesService,
    private route: ActivatedRoute
  ) {
    const modoRuta = this.route.snapshot.data['modo'] as ModoListaEfact | undefined;
    this.modo = modoRuta === 'pendientes' ? 'pendientes' : 'emitidos';
    this.displayedColumns = this.esModoEmitidos ? [...this.columnasEmitidos] : [...this.columnasPendientes];
    this.nota = this.esModoPendientes
      ? 'Seleccione uno o más tickets; la emisión masiva genera un solo número de comprobante SUNAT para todos.'
      : 'Solo comprobantes ya emitidos con número CPE SUNAT y ticket POS.';

    this.filterForm = this.fb.group({
      idPuntoVenta: [''],
      fechaDesde: [''],
      fechaHasta: [''],
      cliente: [''],
      estado: [this.esModoEmitidos ? 'emitido' : 'pendiente'],
      origen: ['todos']
    });
  }

  ngOnInit() {
    this.loadComprobantes();
  }

  loadComprobantes() {
    const f = this.filterForm.value;
    const filters: EfactFilter = {
      idPuntoVenta: f.idPuntoVenta ? Number(f.idPuntoVenta) : undefined,
      fechaDesde: f.fechaDesde || undefined,
      fechaHasta: f.fechaHasta || undefined,
      cliente: f.cliente || undefined,
      modoListado: this.esModoEmitidos ? 'emitidos' : 'pendientes',
      estado: f.estado || (this.esModoEmitidos ? 'emitido' : 'pendiente'),
      origen: f.origen || 'todos',
      page: this.page,
      pageSize: this.pageSize
    };

    this.loading = true;
    this.service.listEfactEmisiones(filters).subscribe(page => {
      const raw = Array.isArray(page?.items) ? page.items : [];
      const normalizados = raw.map((row: any) => this.normalizarItemEfact(row));
      const items = this.filtrarSegunReglaPantalla(normalizados as Comprobante[]);
      this.lista = items;
      this.MainDS = new MatTableDataSource<Comprobante>(items);
      // Si el backend mezcló estados, reflejar el total real visible.
      this.total = items.length;
      this.nota = page?.nota || this.nota;
      if (this.esModoPendientes) {
        this.pruneSeleccionNoValidos();
      }
      this.loading = false;
    }, err => {
      this.loading = false;
      this.lista = [];
      this.MainDS = new MatTableDataSource<Comprobante>([]);
      this.total = 0;
      this.funcionesService.showError('No se pudo cargar el listado de emisiones eFact.');
      console.error('Error cargando emisiones eFact', err);
    });
  }

  onSearch() {
    this.page = 1;
    this.loadComprobantes();
  }

  onClear() {
    this.filterForm.reset({
      idPuntoVenta: '',
      fechaDesde: '',
      fechaHasta: '',
      cliente: '',
      estado: this.esModoEmitidos ? 'emitido' : 'pendiente',
      origen: 'todos'
    });
    this.page = 1;
    this.pageSize = 15;
    this.seleccionados = {};
    this.loadComprobantes();
  }

  onPageChange(event: PageEvent) {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadComprobantes();
  }

  /**
   * Sincroniza estados OSE/SUNAT vía backend (CDR por ticket). Si hay filas seleccionadas, solo esas;
   * si no, toda la página actual. Varios lotes si hay más de syncLoteMax ítems.
   */
  sincronizarEstadosPortal(): void {
    const items = this.obtenerItemsParaSincronizar();
    if (!items.length) {
      this.funcionesService.showWarning('No hay filas para sincronizar en esta página.');
      return;
    }

    const lotes = this.chunk(items, this.syncLoteMax);
    const todosResultados: unknown[] = [];
    this.syncing = true;
    this.funcionesService.showLoading();

    from(lotes)
      .pipe(
        concatMap((lote) =>
          this.service
            .sincronizarEstadosEfact({
              items: lote,
              limite: this.syncLoteMax
            })
            .pipe(
              tap((resp) => {
                const arr = resp?.resultados;
                if (Array.isArray(arr)) {
                  todosResultados.push(...arr);
                }
              })
            )
        ),
        finalize(() => {
          this.syncing = false;
          this.funcionesService.hideLoading();
        })
      )
      .subscribe({
        error: (err) => {
          console.error('sincronizar-estados', err);
          this.funcionesService.showError('No se pudo sincronizar estados eFact con la OSE.');
        },
        complete: () => {
          this.funcionesService.showSuccess('Sincronización eFact completada. Actualizando listado…');
          this.mostrarToastsResultadosSincronizacion(todosResultados);
          this.loadComprobantes();
        }
      });
  }

  /**
   * Toasts opcionales: ítems de resultados[] con nota, error, motivo o mensaje (p. ej. CDR no disponible).
   */
  private mostrarToastsResultadosSincronizacion(resultados: unknown[]): void {
    const lineas = this.recolectarLineasAvisosSincronizacion(resultados);
    if (!lineas.length) {
      return;
    }
    this.funcionesService.showSincronizacionEfactDetalle(lineas);
  }

  private recolectarLineasAvisosSincronizacion(resultados: unknown[]): string[] {
    const out: string[] = [];
    for (const raw of resultados) {
      if (!raw || typeof raw !== 'object') {
        continue;
      }
      const o = raw as Record<string, unknown>;
      const origen = o['origen'];
      const id = o['id'];
      const prefix =
        origen != null && id != null ? `${String(origen)} #${String(id)}: ` : '';

      const errVal = o['error'];
      const notaVal = o['nota'];
      const motivoVal = o['motivo'];
      const mensajeVal = o['mensaje'];

      const errores: string[] = [];
      const notas: string[] = [];
      if (typeof errVal === 'string' && errVal.trim()) {
        errores.push(errVal.trim());
      }
      if (typeof notaVal === 'string' && notaVal.trim()) {
        notas.push(notaVal.trim());
      }
      if (typeof motivoVal === 'string' && motivoVal.trim()) {
        notas.push(motivoVal.trim());
      }
      if (typeof mensajeVal === 'string' && mensajeVal.trim()) {
        notas.push(mensajeVal.trim());
      }

      if (!errores.length && !notas.length) {
        continue;
      }
      const cuerpo = [...errores, ...notas].join(' — ');
      out.push(`${prefix}${cuerpo}`);
    }
    return out;
  }

  /** Quita checks de filas que ya no son seleccionables tras recargar. */
  private pruneSeleccionNoValidos(): void {
    const next: Record<string, boolean> = {};
    for (const k of Object.keys(this.seleccionados)) {
      if (!this.seleccionados[k]) {
        continue;
      }
      const row = this.lista.find((r) => this.getRowKey(r) === k);
      if (row && this.canSelect(row)) {
        next[k] = true;
      }
    }
    this.seleccionados = next;
  }

  /** Seleccionados con check; si ninguno, todas las filas visibles (página actual). */
  private obtenerItemsParaSincronizar(): EfactLoteItem[] {
    const keysSel = Object.keys(this.seleccionados).filter((k) => this.seleccionados[k]);
    const filas =
      keysSel.length > 0
        ? this.lista.filter((row) => keysSel.includes(this.getRowKey(row)))
        : this.lista;
    return filas.map((row) => {
      const t = this.getEfactTicket(row);
      const item: EfactLoteItem = {
        origen: (row.origen || 'comprobante') as 'recibo' | 'comprobante',
        id: row.id
      };
      if (t) {
        item.efact_ticket = t;
        item.ticket = t;
      }
      return item;
    });
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      out.push(arr.slice(i, i + size));
    }
    return out;
  }

  getRowKey(element: Comprobante): string {
    return `${element.origen || 'comprobante'}-${element.id}`;
  }

  /**
   * GET /api/efact/emisiones: efact_ticket, efact_estado, estado_ose, estado_sunat,
   * pendiente_emision, puede_descargar, cpe_cerrado_sunat_ose (siempre viene efact_ticket en JSON, puede ser null).
   */
  private normalizarItemEfact(raw: any): Comprobante {
    const efact_estado =
      raw?.efact_estado ??
      raw?.efactEstado ??
      '';
    const estado_ose =
      raw?.estado_ose ??
      raw?.estadoOse ??
      raw?.efact_estado_ose ??
      raw?.efactEstadoOse ??
      '';
    const estado_sunat =
      raw?.estado_sunat ??
      raw?.estadoSunat ??
      raw?.efact_estado_sunat ??
      raw?.efactEstadoSunat ??
      '';
    const ticketRaw =
      resolverTicketEfactDesdeItem(raw) ??
      raw?.efact_ticket ??
      raw?.efactTicket ??
      null;
    const tipo =
      raw?.tipo ??
      raw?.tipoComprobante ??
      raw?.tipo_documento ??
      raw?.tipoDocumento ??
      '';
    const seleccionable = raw?.seleccionable;
    const puedeDescargarRaw = raw?.puede_descargar ?? raw?.puedeDescargar;
    const pendienteRaw = raw?.pendiente_emision ?? raw?.pendienteEmision;
    const pendiente = this.coerceBool(pendienteRaw) ?? pendienteRaw;
    const puedeDescargar = this.coerceBool(puedeDescargarRaw) ?? puedeDescargarRaw;
    const cpeRaw = raw?.cpe_cerrado_sunat_ose ?? raw?.cpeCerradoSunatOse;
    const cpeCerrado = this.coerceBool(cpeRaw) ?? cpeRaw;

    const ticketNorm = this.normalizarTicketDesdeApi(ticketRaw);

    return {
      ...raw,
      tipo,
      efact_estado: efact_estado ? String(efact_estado) : undefined,
      estado_ose: estado_ose ? String(estado_ose) : undefined,
      estado_sunat: estado_sunat ? String(estado_sunat) : undefined,
      efact_ticket: ticketNorm,
      pendiente_emision: pendiente,
      cpe_cerrado_sunat_ose: cpeCerrado,
      seleccionable,
      puede_descargar: puedeDescargar
    };
  }

  /** null si no hay ticket útil; el API siempre envía la clave efact_ticket (puede ser null). */
  private normalizarTicketDesdeApi(ticketRaw: any): string | null {
    if (ticketRaw === undefined || ticketRaw === null) {
      return null;
    }
    const s = String(ticketRaw).trim();
    if (!s) {
      return null;
    }
    const lower = s.toLowerCase();
    if (lower === 'null' || lower === 'undefined') {
      return null;
    }
    return s;
  }

  /** Texto en tabla: muestra el ticket o — si es null/vacío (la clave siempre existe en el API). */
  textoTicketColumna(el: Comprobante): string {
    const t = this.normalizarTicketDesdeApi(el.efact_ticket ?? (el as any).efactTicket);
    return t || '—';
  }

  /** Ticket POS: ticket_pos.texto, enumeracion_ticket, series/numeracion o serie_ticket/numero_ticket. */
  textoEnumeracionTicketPos(el: Comprobante): string {
    return textoNumeracionTicketRecibo(el as unknown as Record<string, unknown>);
  }

  /** Guard-rail UI: separa emitidos/pendientes aunque backend devuelva mezcla. */
  private filtrarSegunReglaPantalla(items: Comprobante[]): Comprobante[] {
    if (this.esModoPendientes) {
      return items.filter((el) => !this.esEmitidoParaPantalla(el));
    }
    return items.filter((el) => this.esEmitidoParaPantalla(el));
  }

  private esEmitidoParaPantalla(el: Comprobante): boolean {
    const tieneTicketPos = this.textoEnumeracionTicketPos(el) !== '—';
    const tieneCpe = this.textoCpeSunatLista(el) !== '—';
    if (tieneTicketPos && tieneCpe) {
      return true;
    }
    // Fallback por estados cuando el backend aún no propaga CPE en columnas.
    return this.estadoIndicaEmitido(el);
  }

  private estadoIndicaEmitido(el: Comprobante): boolean {
    const txt = this.normalizarTextoEstado(
      `${this.textoEstadoOse(el)} ${this.textoEstadoSunat(el)} ${(el.efact_estado || '')}`
    );
    if (!txt || txt === '—') {
      return false;
    }
    if (txt.includes('RECHAZ') || txt.includes('ERROR')) {
      return false;
    }
    return (
      txt.includes('VALIDADO') ||
      txt.includes('ACEPT') ||
      txt.includes('ENVIADO') ||
      txt.includes('PROCESADO') ||
      txt.includes('AUTORIZ')
    );
  }

  /** CPE SUNAT: cpe_sunat, comprobante_emitido, comprobante_electronico; fallback serie+numero del ítem. */
  textoCpeSunatLista(el: Comprobante): string {
    const u = textoComprobanteSunatRecibo(el as unknown as Record<string, unknown>);
    if (u !== '—') {
      return u;
    }
    const serieEfact = (el as any).efact_comprobante_serie ?? (el as any).efactComprobanteSerie;
    const numeroEfact = (el as any).efact_comprobante_numero ?? (el as any).efactComprobanteNumero;
    const se = serieEfact != null ? String(serieEfact).trim() : '';
    const ne = numeroEfact != null ? String(numeroEfact).trim() : '';
    if (se && ne) {
      return `${se}-${ne}`;
    }
    // Importante: NO usar el fallback genérico serie/numero porque en recibos
    // suele ser la numeración del ticket POS, no el CPE SUNAT.
    return '—';
  }

  /** Normaliza booleanos que a veces vienen como 0/1 o string desde PHP/JSON. */
  private coerceBool(v: any): boolean | undefined {
    if (v === true || v === 1 || v === '1') {
      return true;
    }
    if (v === false || v === 0 || v === '0') {
      return false;
    }
    if (typeof v === 'string') {
      const t = v.trim().toLowerCase();
      if (t === 'true' || t === '1') {
        return true;
      }
      if (t === 'false' || t === '0') {
        return false;
      }
    }
    return undefined;
  }

  /**
   * Fila que ya no debe ir a emisión masiva (SUNAT/OSE cerrados o pendiente_emision explícito false).
   * Evita que `seleccionable: true` incorrecto del API deje el check activo.
   */
  private estaCerradoEmisionMasiva(el: Comprobante): boolean {
    if (this.coerceBool(el.cpe_cerrado_sunat_ose) === true) {
      return true;
    }
    if (this.coerceBool(el.pendiente_emision) === false) {
      return true;
    }

    const sunRaw = (el.estado_sunat || '').toString();
    if (this.sunatIndicaDocumentoCerrado(sunRaw)) {
      return true;
    }

    const fus = this.textoFusionCierreEfact(el);
    if (!fus) {
      return false;
    }
    if (fus.includes('RECHAZ')) {
      return false;
    }

    const tieneValidado = fus.includes('VALIDADO') || fus.includes('VALIDAD');
    const tieneAceptacion =
      fus.includes('ACEPT') ||
      fus.includes('APROB') ||
      fus.includes('AUTORIZ') ||
      (fus.includes('SUNAT') && (fus.includes('OK') || fus.includes('CORRECT')));

    if (tieneValidado && tieneAceptacion) {
      return true;
    }

    if (tieneAceptacion && (fus.includes('OSE') || fus.includes('EFACT') || fus.includes('E-FACT'))) {
      return true;
    }

    return false;
  }

  /** Une todos los textos de estado que suelen mandar API/backend para detectar cierre OSE+SUNAT. */
  private textoFusionCierreEfact(el: Comprobante): string {
    const raw = el as any;
    const partes: Array<string | undefined | null> = [
      el.estado_ose,
      el.estado_sunat,
      el.efact_estado,
      raw.estado,
      raw.estado_comprobante,
      raw.sunat_estado,
      raw.sunatEstado,
      raw.ose_estado,
      raw.oseEstado,
      raw.descripcion_estado,
      raw.mensaje_estado
    ];
    const joined = partes
      .filter((v) => v != null && String(v).trim() !== '' && String(v).trim() !== '—')
      .map((v) => String(v))
      .join(' ');
    return this.normalizarTextoEstado(joined);
  }

  private normalizarTextoEstado(s: string): string {
    return s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
  }

  private sunatIndicaDocumentoCerrado(sunat: string): boolean {
    const u = this.normalizarTextoEstado(sunat.trim());
    if (!u || u === '—') {
      return false;
    }
    if (u.includes('RECHAZ')) {
      return false;
    }
    return (
      u.includes('ACEPT') ||
      u.includes('PROCESADO') ||
      u.includes('APROB') ||
      u.includes('AUTORIZ')
    );
  }

  /** Texto mostrado en columna OSE (columna explícita o, si falta, texto canónico). */
  textoEstadoOse(el: Comprobante): string {
    const o = (el.estado_ose || '').toString().trim();
    if (o) {
      return o;
    }
    const e = (el.efact_estado || '').toString().trim();
    return e || '—';
  }

  textoEstadoSunat(el: Comprobante): string {
    const s = (el.estado_sunat || '').toString().trim();
    return s || '—';
  }

  /**
   * Clases Bootstrap para badge según texto de estado (ACEPTADO/ACEPTADA, VALIDADO, OBSERVADO, PROCESADO, ENVIADO…).
   */
  badgeClaseEfact(estado: string | undefined): string {
    const s = (estado || '').toUpperCase();
    if (!s || s === '—') {
      return 'badge bg-secondary';
    }
    if (s.includes('ERROR') || s.includes('RECHAZ')) {
      return 'badge bg-danger';
    }
    if (s.includes('OBSERV')) {
      return 'badge bg-warning text-dark';
    }
    if (s.includes('ACEPT') || s.includes('VALIDADO')) {
      return 'badge bg-success';
    }
    if (s.includes('PROCESADO') || s.includes('ENVIADO')) {
      return 'badge bg-primary';
    }
    if (s.includes('NO_ENVI') || s.includes('PENDIENTE')) {
      return 'badge bg-secondary';
    }
    return 'badge bg-secondary';
  }

  hasSeleccionablesOnPage(): boolean {
    return this.lista.some(item => this.canSelect(item));
  }

  canSelect(element: Comprobante): boolean {
    if (this.esModoEmitidos) {
      return false;
    }
    const seleccionable = this.coerceBool((element as any).seleccionable);
    const pendiente = this.coerceBool((element as any).pendiente_emision);
    if (seleccionable === true) {
      return true;
    }
    if (pendiente === true) {
      return true;
    }
    return false;
  }

  /**
   * Fila con dato real en Estado OSE o Estado SUNAT (ya volcada a eFact / seguimiento),
   * excluyendo placeholders tipo pendiente o en proceso.
   */
  private tieneEstadoOseOSunatInformado(el: Comprobante): boolean {
    const ose = this.textoEstadoOse(el);
    const sunat = this.textoEstadoSunat(el);
    return (
      !this.esEstadoEfactPlaceholderVisible(ose) || !this.esEstadoEfactPlaceholderVisible(sunat)
    );
  }

  private esEstadoEfactPlaceholderVisible(texto: string): boolean {
    const t = (texto || '').trim();
    if (!t || t === '—') {
      return true;
    }
    const u = this.normalizarTextoEstado(t);
    return (
      u.includes('PENDIENTE') ||
      u.includes('NO_ENVI') ||
      u.includes('EN PROCESO') ||
      u.includes('PROCESANDO') ||
      u.includes('ESPERA') ||
      u.includes('BORRADOR')
    );
  }

  getEfactTicket(element: ComprobanteItem): string | null {
    return this.normalizarTicketDesdeApi(resolverTicketEfactDesdeItem(element));
  }

  puedeDescargarEfact(element: Comprobante): boolean {
    const id = Number(element?.id);
    if (!id || id < 1) {
      return false;
    }
    if (this.getEfactTicket(element)) {
      return true;
    }
    if (this.coerceBool(element.puede_descargar) === true) {
      return true;
    }
    if (this.estaCerradoEmisionMasiva(element)) {
      return true;
    }
    const origen = (element.origen || 'comprobante').toString().toLowerCase();
    return origen === 'recibo' || origen === 'comprobante';
  }

  isSelected(element: Comprobante): boolean {
    return !!this.seleccionados[this.getRowKey(element)];
  }

  toggleSelection(element: Comprobante, checked: boolean) {
    const key = this.getRowKey(element);
    if (checked) {
      this.seleccionados[key] = true;
    } else {
      delete this.seleccionados[key];
    }
  }

  isAllPageSelected(): boolean {
    const seleccionables = this.lista.filter(item => this.canSelect(item));
    if (seleccionables.length === 0) {
      return false;
    }
    return seleccionables.every(item => this.isSelected(item));
  }

  hasPageSelection(): boolean {
    return this.lista.some(item => this.canSelect(item) && this.isSelected(item));
  }

  togglePageSelection(checked: boolean) {
    this.lista
      .filter(item => this.canSelect(item))
      .forEach(item => this.toggleSelection(item, checked));
  }

  get selectedCount(): number {
    return Object.keys(this.seleccionados).length;
  }

  emitirSeleccionados() {
    if (this.esModoEmitidos) {
      return;
    }
    const items: EfactLoteItem[] = this.lista
      .filter(item => this.canSelect(item) && this.isSelected(item))
      .map(item => {
        const t = this.getEfactTicket(item);
        const row: EfactLoteItem = {
          origen: (item.origen || 'comprobante') as 'recibo' | 'comprobante',
          id: item.id
        };
        if (t) {
          row.efact_ticket = t;
          row.ticket = t;
        }
        return row;
      });

    if (items.length === 0) {
      this.funcionesService.showWarning('Seleccione al menos un pendiente para emitir.');
      return;
    }

    const plural = items.length === 1 ? '1 ticket' : `${items.length} tickets`;
    const htmlAgrupado =
      items.length > 1
        ? `Se emitirá <b>un solo comprobante SUNAT</b> agrupando ${plural}.`
        : `Se enviará <b>${plural}</b> a eFact.`;

    Swal.fire({
      title: 'Emitir seleccionados',
      html: `${htmlAgrupado}<br><br>¿También reintentar los que ya fueron emitidos?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Emitir pendientes',
      cancelButtonText: 'Cancelar',
      showDenyButton: true,
      denyButtonText: 'Emitir y reintentar'
    }).then(result => {
      if (result.isConfirmed) {
        this.emitirLote(items, false);
      } else if (result.isDenied) {
        this.emitirLote(items, true);
      }
    });
  }

  private emitirLote(items: EfactLoteItem[], reintentar: boolean) {
    const cantidadItems = items.length;
    const payload: EfactLoteRequest = { items, reintentar };
    if (this.esModoPendientes && cantidadItems > 1) {
      payload.agrupar_en_un_comprobante = true;
      payload.un_solo_comprobante = true;
    }
    this.loading = true;
    this.service.emitirLoteEfact(payload).subscribe(resp => {
      this.loading = false;
      this.aplicarResultadoLote(resp?.resultados || [], resp);
      const errores = Number(resp?.resumen?.errores || 0);
      if (errores > 0) {
        this.funcionesService.showWarning(`Lote procesado con ${errores} error(es).`);
      } else {
        this.funcionesService.showSuccess(this.resumenLoteEmitido(resp, cantidadItems));
      }
      this.seleccionados = {};
      this.loadComprobantes();
    }, err => {
      this.loading = false;
      this.funcionesService.showError('No se pudo completar la emisión masiva.');
      console.error('Error en emision-lote', err);
    });
  }

  private resumenLoteEmitido(resp: any, cantidadItems: number): string {
    const agrupado = resp?.comprobante_agrupado;
    const tickets = Array.isArray(resp?.tickets_agrupados) ? resp.tickets_agrupados.length : 0;
    const cpe = agrupado?.comprobante ||
      ((agrupado?.serie && agrupado?.numero) ? `${agrupado.serie}-${agrupado.numero}` : '');
    if (cpe) {
      const n = tickets || cantidadItems;
      return `Lote agrupado emitido: ${cpe} para ${n} ticket(s).`;
    }
    return 'Lote enviado correctamente a eFact.';
  }

  private aplicarResultadoLote(resultados: EfactLoteResultado[], resp?: any) {
    const ticketsAgrupados: string[] = Array.isArray(resp?.tickets_agrupados)
      ? resp.tickets_agrupados
          .filter((t: any) => t && t.id != null)
          .map((t: any) => `${t.origen || 'comprobante'}-${t.id}`)
      : [];
    const setAgrupados = new Set<string>(ticketsAgrupados);
    const agrupadoRaw = resp?.comprobante_agrupado;
    const comprobanteAgrupado = agrupadoRaw?.comprobante ||
      ((agrupadoRaw?.serie && agrupadoRaw?.numero) ? `${agrupadoRaw.serie}-${agrupadoRaw.numero}` : '');

    const map = new Map<string, EfactLoteResultado>();
    resultados.forEach(r => map.set(`${r.origen}-${r.id}`, r));

    this.lista = this.lista.map(item => {
      const key = this.getRowKey(item);
      const r = map.get(key);
      if (!r) {
        return item;
      }
      return {
        ...item,
        efact_ticket: r.efact_ticket || item.efact_ticket,
        resultadoLote: {
          ok: r.ok,
          omitido: !!r.omitido,
          error: r.error || null,
          motivo: r.motivo,
          agrupado: setAgrupados.has(key),
          comprobanteAgrupado: setAgrupados.has(key) ? comprobanteAgrupado : undefined
        }
      };
    });
    this.MainDS = new MatTableDataSource<Comprobante>(this.lista);
  }

  esResultadoAgrupado(element: Comprobante): boolean {
    return !!element?.resultadoLote?.agrupado;
  }

  verCdr(element: ComprobanteItem) {
    if (!this.puedeDescargarEfact(element as Comprobante)) {
      this.funcionesService.showWarning('No hay archivos eFact disponibles para este registro.');
      return;
    }
    const ticket = this.getEfactTicket(element);
    const origen = (element.origen || 'comprobante') as 'recibo' | 'comprobante';
    const req = ticket
      ? this.service.descargarEfactPorQuery('cdr', { origen, id: element.id, ticket })
      : this.service.descargarEfactPorQuery('cdr', { origen, id: element.id });
    req.subscribe(
      (blob) =>
        this._descargarBlobConChequeoJson(blob, `cdr_${ticket || origen + '_' + element.id}.xml`),
      (err) => {
        if (ticket) {
          this.service.descargarCdrPorTicket(ticket).subscribe(
            (blob2) =>
              this._descargarBlobConChequeoJson(blob2, `cdr_${ticket || origen + '_' + element.id}.xml`),
            () => this.manejarErrorDescarga(err, 'No se pudo descargar el CDR.')
          );
        } else {
          this.manejarErrorDescarga(err, 'No se pudo descargar el CDR.');
        }
      }
    );
  }

  descargarXml(element: ComprobanteItem) {
    if (!this.puedeDescargarEfact(element as Comprobante)) {
      this.funcionesService.showWarning('No hay archivos eFact disponibles para este registro.');
      return;
    }
    const ticket = this.getEfactTicket(element);
    const origen = (element.origen || 'comprobante') as 'recibo' | 'comprobante';
    const req = ticket
      ? this.service.descargarEfactPorQuery('xml', { origen, id: element.id, ticket })
      : this.service.descargarEfactPorQuery('xml', { origen, id: element.id });

    req.subscribe(
      (blob) =>
        this._descargarBlobConChequeoJson(blob, `xml_${ticket || origen + '_' + element.id}.xml`),
      (err) => {
        if (ticket) {
          this.service.descargarXmlPorTicket(ticket).subscribe(
            (blob2) =>
              this._descargarBlobConChequeoJson(blob2, `xml_${ticket || origen + '_' + element.id}.xml`),
            () => {
              if (origen === 'comprobante') {
                this.descargarXmlLegacyComprobante(element);
              } else {
                this.manejarErrorDescarga(err, 'No se pudo descargar el XML.');
              }
            }
          );
        } else if (origen === 'comprobante') {
          this.descargarXmlLegacyComprobante(element);
        } else {
          this.manejarErrorDescarga(err, 'No se pudo descargar el XML.');
        }
      }
    );
  }

  descargarPdf(element: ComprobanteItem) {
    if (!this.puedeDescargarEfact(element as Comprobante)) {
      this.funcionesService.showWarning('No hay archivos eFact disponibles para este registro.');
      return;
    }
    const ticket = this.getEfactTicket(element);
    const origen = (element.origen || 'comprobante') as 'recibo' | 'comprobante';
    const nombreTicket = `ticket_${ticket || origen + '_' + element.id}.pdf`;
    const nombrePdf = `pdf_${ticket || origen + '_' + element.id}.pdf`;

    const abrirA4 = (blob: Blob) => this._descargarBlobConChequeoJson(blob, nombrePdf);

    const pdfApiA4 = (errRecibo?: HttpErrorResponse) => {
      if (ticket) {
        this.service.descargarEfactPorQuery('pdf', { origen, id: element.id, ticket }).subscribe(
          (blob) => abrirA4(blob),
          (errPdf) => {
            this.service.descargarPdfPorTicket(ticket).subscribe(
              (blob2) => abrirA4(blob2),
              () => {
                if (origen === 'comprobante') {
                  this.descargarPdfLegacyComprobante(element);
                } else {
                  this.manejarErrorDescarga(
                    errRecibo ?? errPdf,
                    'No se pudo descargar el PDF eFact (código 1033 suele indicar desajuste entre recibo y datos OSE; use ticket en query o corrija el backend).'
                  );
                }
              }
            );
          }
        );
        return;
      }
      this.service.descargarEfactPorQuery('pdf', { origen, id: element.id }).subscribe(
        (blob) => abrirA4(blob),
        (err) => {
          if (origen === 'comprobante') {
            this.descargarPdfLegacyComprobante(element);
          } else {
            this.manejarErrorDescarga(err, 'No se pudo descargar el PDF.');
          }
        }
      );
    };

    const intentarXmlBlob = (xmlBlob: Blob | null, siguiente: () => void) => {
      if (!xmlBlob || xmlBlob.size < 200) {
        siguiente();
        return;
      }
      void xmlBlob
        .text()
        .then((xmlText) =>
          this.descargarTicketPdfSiInvoiceXml(xmlText, nombreTicket).then((ok) => {
            if (!ok) {
              siguiente();
            }
          })
        )
        .catch(() => siguiente());
    };

    const despuesXmlEfactFallido = (err: HttpErrorResponse) => {
      if (ticket) {
        this.service.descargarXmlPorTicket(ticket).subscribe(
          (xml2) =>
            intentarXmlBlob(xml2, () => {
              if (origen === 'comprobante') {
                this.intentarTicketDesdeXmlLegacyComprobante(element, nombreTicket, () => pdfApiA4(err));
              } else {
                pdfApiA4(err);
              }
            }),
          () => {
            if (origen === 'comprobante') {
              this.intentarTicketDesdeXmlLegacyComprobante(element, nombreTicket, () => pdfApiA4(err));
            } else {
              pdfApiA4(err);
            }
          }
        );
      } else if (origen === 'comprobante') {
        this.intentarTicketDesdeXmlLegacyComprobante(element, nombreTicket, () => pdfApiA4(err));
      } else {
        pdfApiA4(err);
      }
    };

    const xmlEfactReq = ticket
      ? this.service.descargarEfactPorQuery('xml', { origen, id: element.id, ticket })
      : this.service.descargarEfactPorQuery('xml', { origen, id: element.id });

    xmlEfactReq.subscribe(
      (xmlBlob) => {
        intentarXmlBlob(xmlBlob, () => {
          if (ticket) {
            this.service.descargarXmlPorTicket(ticket).subscribe(
              (xml2) =>
                intentarXmlBlob(xml2, () => {
                  if (origen === 'comprobante') {
                    this.intentarTicketDesdeXmlLegacyComprobante(element, nombreTicket, () => pdfApiA4());
                  } else {
                    pdfApiA4();
                  }
                }),
              () => {
                if (origen === 'comprobante') {
                  this.intentarTicketDesdeXmlLegacyComprobante(element, nombreTicket, () => pdfApiA4());
                } else {
                  pdfApiA4();
                }
              }
            );
          } else if (origen === 'comprobante') {
            this.intentarTicketDesdeXmlLegacyComprobante(element, nombreTicket, () => pdfApiA4());
          } else {
            pdfApiA4();
          }
        });
      },
      (err) => {
        if (err instanceof HttpErrorResponse) {
          despuesXmlEfactFallido(err);
        } else {
          despuesXmlEfactFallido(new HttpErrorResponse({ status: 0, statusText: String(err) }));
        }
      }
    );
  }

  /** Genera y descarga PDF ticket (~72 mm) si el texto es UBL Invoice válido. */
  private descargarTicketPdfSiInvoiceXml(xmlText: string, nombreTicket: string): Promise<boolean> {
    const t = xmlText.trim();
    if (t.startsWith('{') || !t.includes('<Invoice')) {
      return Promise.resolve(false);
    }
    return generarPdfTicketDesdeUblXml(xmlText)
      .then((ticketPdf) => {
        if (ticketPdf && ticketPdf.size > 400) {
          this._descargarBlobConChequeoJson(ticketPdf, nombreTicket);
          return true;
        }
        return false;
      })
      .catch(() => false);
  }

  private decodificarXmlBase64Legacy(b64: string): string | null {
    try {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i) & 0xff;
      }
      return new TextDecoder('utf-8').decode(bytes);
    } catch {
      return null;
    }
  }

  /** XML comprobante módulo legacy (base64) → ticket PDF si aplica. */
  private intentarTicketDesdeXmlLegacyComprobante(
    element: ComprobanteItem,
    nombreTicket: string,
    onNoTicket: () => void
  ): void {
    this.service.obtenerXml(element.id).subscribe(
      (res) => {
        const b64 = (res as any)?.xml_base64;
        if (!b64 || typeof b64 !== 'string') {
          onNoTicket();
          return;
        }
        const xmlText = this.decodificarXmlBase64Legacy(b64);
        if (!xmlText) {
          onNoTicket();
          return;
        }
        void this.descargarTicketPdfSiInvoiceXml(xmlText, nombreTicket).then((ok) => {
          if (!ok) {
            onNoTicket();
          }
        });
      },
      () => onNoTicket()
    );
  }

  private descargarXmlLegacyComprobante(element: ComprobanteItem): void {
    this.service.obtenerXml(element.id).subscribe(
      (res) => {
        if (!(res as any).xml_base64) {
          this.funcionesService.showWarning('El XML aún no está disponible.');
          return;
        }
        const blob = this._base64ToBlob((res as any).xml_base64, 'application/xml');
        this._descargar(blob, `comprobante_${element.id}.xml`);
      },
      () => this.funcionesService.showError('No se pudo obtener el XML.')
    );
  }

  private descargarPdfLegacyComprobante(element: ComprobanteItem): void {
    this.service.obtenerPdf(element.id).subscribe(
      (res) => {
        if (!(res as any).pdf_base64) {
          this.funcionesService.showWarning('El PDF aún no está disponible.');
          return;
        }
        const blob = this._base64ToBlob((res as any).pdf_base64, 'application/pdf');
        this._descargar(blob, `comprobante_${element.id}.pdf`);
      },
      () => this.funcionesService.showError('No se pudo obtener el PDF.')
    );
  }

  private _base64ToBlob(base64: string, type: string): Blob {
    const byteChars = atob(base64);
    const byteNums = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNums[i] = byteChars.charCodeAt(i);
    }
    return new Blob([new Uint8Array(byteNums)], { type });
  }

  private manejarErrorDescarga(err: unknown, fallback: string): void {
    if (err instanceof HttpErrorResponse) {
      const status = err.status;
      const body = err.error;
      if (body instanceof Blob) {
        void body.text().then(text => {
          try {
            const j = JSON.parse(text) as Record<string, unknown>;
            const raw = String(j['mensaje'] ?? j['message'] ?? j['error'] ?? fallback);
            const human = this.humanizarMensajeDescargaEfact(status, raw, fallback);
            const extra = this.textoExtraErrorEfact404(j);
            this.funcionesService.showError(extra ? `${human} ${extra}` : human);
          } catch {
            this.funcionesService.showError(fallback);
          }
        });
        return;
      }
      if (body && typeof body === 'object') {
        const o = body as Record<string, unknown>;
        const raw = String(o['mensaje'] ?? o['message'] ?? o['error'] ?? '');
        if (raw) {
          const human = this.humanizarMensajeDescargaEfact(status, raw, fallback);
          const extra = this.textoExtraErrorEfact404(o);
          this.funcionesService.showError(extra ? `${human} ${extra}` : human);
          return;
        }
      }
    }
    this.funcionesService.showError(fallback);
  }

  /**
   * 404 con mensaje de ticket inexistente en BD: aclarar que no es fallo OSE hasta tener ticket.
   */
  private humanizarMensajeDescargaEfact(status: number, mensajeServidor: string, fallback: string): string {
    const m = (mensajeServidor || '').toLowerCase();
    if (
      status === 404 &&
      (m.includes('no se encontró ticket') ||
        m.includes('no se encontro ticket') ||
        m.includes('no hay ticket') ||
        m.includes('sin ticket') ||
        m.includes('ticket no'))
    ) {
      return (
        'No hay ticket registrado en base de datos para este documento. ' +
        'Esto no indica un fallo de la OSE hasta que exista un ticket de envío. ' +
        'Si tiene el UUID devuelto por POST /v1/document, puede llamar al API con ?ticket=… en CDR/XML/PDF.'
      );
    }
    return mensajeServidor || fallback;
  }

  /** Backend 404 en descargas: opcionalmente envía `detalle`, `ejemplo`, `origen_solicitado`, `id_solicitado`. */
  private textoExtraErrorEfact404(j: Record<string, unknown>): string {
    const detalle = j['detalle'];
    const ejemplo = j['ejemplo'];
    const parts: string[] = [];
    if (typeof detalle === 'string' && detalle.trim()) {
      parts.push(detalle.trim());
    }
    if (typeof ejemplo === 'string' && ejemplo.trim()) {
      parts.push(`Ejemplo: ${ejemplo.trim()}`);
    }
    return parts.length ? parts.join(' ') : '';
  }

  private esMensajeSinTicketEnBd(msg: string): boolean {
    const m = (msg || '').toLowerCase();
    return (
      m.includes('no se encontró ticket') ||
      m.includes('no se encontro ticket') ||
      m.includes('no hay ticket') ||
      m.includes('sin ticket') ||
      m.includes('ticket no')
    );
  }

  /**
   * Si el servidor devuelve JSON de error con responseType blob, evita guardar un .xml corrupto.
   */
  private _descargarBlobConChequeoJson(blob: Blob, nombre: string): void {
    const ct = (blob.type || '').toLowerCase();
    if (ct.includes('json')) {
      void this._leerBlobComoJsonError(blob);
      return;
    }
    if (blob.size < 400) {
      void this._leerBlobComoJsonError(blob, () => this._descargar(blob, nombre));
      return;
    }
    this._descargar(blob, nombre);
  }

  private async _leerBlobComoJsonError(blob: Blob, siNoEsJson?: () => void): Promise<void> {
    try {
      const text = await blob.text();
      const trimmed = text.trim();
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        siNoEsJson?.();
        return;
      }
      const j = JSON.parse(text) as Record<string, unknown>;
      const st = j['status'];
      const statusNum = typeof st === 'number' ? st : 0;
      const msg =
        j['mensaje'] ?? j['message'] ?? j['error'] ?? (statusNum >= 400 ? 'Error en la descarga' : null);
      if (msg) {
        const s = String(msg);
        const extra = this.textoExtraErrorEfact404(j);
        if (this.esMensajeSinTicketEnBd(s)) {
          const base =
            'No hay ticket registrado en base de datos para este documento. ' +
            'Esto no indica un fallo de la OSE hasta que exista un ticket de envío.';
          this.funcionesService.showError(extra ? `${base} ${extra}` : base);
        } else {
          this.funcionesService.showError(extra ? `${s} ${extra}` : s);
        }
        return;
      }
    } catch {
      siNoEsJson?.();
      return;
    }
    siNoEsJson?.();
  }

  private _descargar(blob: Blob, nombre: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nombre; a.click();
    URL.revokeObjectURL(url);
  }
}
