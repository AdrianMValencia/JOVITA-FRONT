import { Component, OnInit, Type, HostListener } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';

import { NgbModalOptions, NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { User } from 'src/app/modulos/Seguridad/models/User';
import { Productos } from 'src/app/modulos/almacen/productos/model/productos';
import { ProductosService } from 'src/app/modulos/almacen/productos/service/Productos.service';
import { ComprobantesService } from 'src/app/modulos/comprobantes/comprobantes.service';
import { ClientesService } from 'src/app/modulos/mantenimientos/clientes/Service/clientes.service';
import { ModalClientesComponent } from 'src/app/modulos/mantenimientos/clientes/ModalClientes/ModalClientes.component';
import { Clientes } from 'src/app/modulos/mantenimientos/clientes/Model/clientes';
import { Monedas } from 'src/app/modulos/mantenimientos/monedas/model/monedas';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { SeriesTickets } from 'src/app/modulos/mantenimientos/seriestickets/models/seriesTickets';
import { NumeracionticketsService } from 'src/app/modulos/mantenimientos/numeraciontickets/service/numeraciontickets.service';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

import { ModalItemsConsultarComponent } from '../modalItemsConsultar/modalItemsConsultar.component';
import { ModalRecibosItemsComponent } from '../modalRecibosItems/modalRecibosItems.component';
import { ModalRecibosMedioPagosComponent } from '../modalRecibosMedioPagos/modalRecibosMedioPagos.component';
import { ModalRecibosPDFComponent } from '../modalRecibosPDF/modalRecibosPDF.component';
import { ModalconvertirkilosComponent } from '../modalconvertirkilos/modalconvertirkilos.component';
import { Recibos } from '../model/recibos';
import { RecibosDetalles } from '../model/recibosDetalles';
import { RecibosService } from '../service/recibos.service';
import {
  asignarMontosDetalle,
  distribuirTotalLineaEnSubtotalIgv,
  recalcularTotalesCabeceraDesdeDetalles
} from '../utils/recibos-afectacion-igv.util';
import { usaFacturacionElectronicaPos } from '../utils/ventas-punto-venta.util';
declare var $: any;
declare var document: any;

// Modals
const MODALS: { [name: string]: Type<any> } = {
  clientes: ModalClientesComponent,
  items: ModalRecibosItemsComponent,
  medioPago: ModalRecibosMedioPagosComponent,
  kilos: ModalconvertirkilosComponent,
  consultar: ModalItemsConsultarComponent
};

@Component({
  selector: 'app-modalRecibos',
  templateUrl: './modalRecibos.component.html',
  providers: [ RecibosService, ProductosService, ClientesService, NumeracionticketsService] ,
})
export class ModalRecibosComponent implements OnInit {

  /** Tiendas 1–3: cabecera SUNAT/eFact; tienda 4 y demás: solo ticket POS clásico. */
  usaFacturacionElectronica = false;
  displayedColumns: string[] = [];
  dataSource: MatTableDataSource<RecibosDetalles> = new MatTableDataSource<RecibosDetalles>();
  items: RecibosDetalles = new RecibosDetalles(0, '', '', '', 1, '', 0.18, '', 1);
  opcion: number = 1;
  detalles: RecibosDetalles[] = [];
  indexEliminar: number = 0;

  recibos: Recibos = new Recibos(0, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', true, '', '');
  productos: Productos = new Productos(0, '', '0', '', '0', '', '', '', '', '', '', true, 1, '', '', false);
  productosLista: Productos[] = [];
  clientes: Clientes = new Clientes();
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = JSON.parse(this.puntoVentaStorage);

  // Progress Bar
  progressBar: boolean | any;

  // FormGroup
  formGroup: FormGroup | any;
  selectedRowIndex: any;
  cantidad: any = 0.000;

  //Combos
  cboMonedas: Monedas[] = [];
  cboClientes: Clientes[] = [];
  cboSeries: SeriesTickets[] = [];
  cboVendedores: User[] = [];

  tiposComprobante: { id: number; codigo: string; documento: string }[] = [];
  tiposDocumento: { codigo: string; tipo: string }[] = [];
  seriesList: any[] = [];
  private buscandoCodigoBarra: boolean = false;
  private codigoBarraTimeout: any;
  private emisionManualMenorCinco: boolean = false;
  private defaultTipoComprobante: string = 'BOLETA DE VENTA';
  private defaultTipoDocumento: string = '-';
  /** Evita que respuestas async de series de otra tienda/tipo pisen la selección actual. */
  private serieCpeLoadSeq = 0;
  /** Evita que un correlativo de otra tienda/serie pise el valor actual. */
  private numeracionCpeLoadSeq = 0;

  NgbModalOptions: NgbModalOptions = {
    size: 'lg',
    centered: true,
    scrollable: true,
    keyboard: false,
    backdrop: 'static',
    windowClass: 'modal-holder'
  };

  isModalOpen: boolean = false;

  constructor(
    public recibosService: RecibosService,
    private productosService: ProductosService,
    private comprobantesService: ComprobantesService,
    private clientesService: ClientesService,
    private numeracionticketsService: NumeracionticketsService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    private _modalService: NgbModal
  ) {
    this.usaFacturacionElectronica = usaFacturacionElectronicaPos(this.puntoVentas?.nombre);
    this.displayedColumns = this.usaFacturacionElectronica
      ? ['codigo', 'descripcion', 'afectacion', 'subtotal', 'cantidad', 'total', 'existencia', 'acciones']
      : ['codigo', 'descripcion', 'subtotal', 'cantidad', 'total', 'existencia', 'acciones'];
    this.new_Modal();
  }

  new_Modal() {
    this.emisionManualMenorCinco = false;
    const fe = this.usaFacturacionElectronica;
    this.formGroup = this.fb.group({
      id: 0,
      idPuntoVenta: [this.puntoVentas.id, [Validators.required]],
      puntoventa: [this.puntoVentas.nombre, [Validators.required]],
      tipoComprobante: ['', fe ? [Validators.required] : []],
      serieComprobante: ['', fe ? [Validators.required] : []],
      numeroComprobante: ['', fe ? [Validators.required, Validators.pattern(/^\d+$/)] : []],
      /** Ticket interno POS (tbl_recibos / numeración tickets); distinto del CPE SUNAT. */
      serieTicketPos: ['', fe ? [Validators.required] : []],
      numeroTicketPos: ['', fe ? [Validators.required, Validators.pattern(/^\d+$/)] : []],
      idSeriesTicketsTicketPos: [null as number | null],
      fechaEmision: [ this.funcionesService.generarFechaLocal(new Date()), [Validators.required]],
      tipoDocumento: ['', fe ? [Validators.required] : []],
      numeroDocumento: ['00000000', fe ? [Validators.required] : []],
      cliente: ['CLIENTES VARIOS', fe ? [Validators.required] : []],
      porcentajeDesc: ['', [Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      montoDesc: ['', [Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      totalGravada: ['', [Validators.required, Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      totalIgv: ['', [Validators.required, Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      otrosCargo: ['', [Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      total: ['', [Validators.required, Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      emitirEfact: [false],
      pagado: '',
      vuelto: '',
      status: [true]
    });

    if (fe) {
      this.aplicarReglaEmisionPorTotal();
    }
  }

  get getModal() { return this.formGroup.controls; }

  ngOnInit() {
    this.refrescarContextoPuntoVenta();
    this.funcionesService.hideLoading();
    $("#codigoBarra").focus();

    if (this.usaFacturacionElectronica) {
      this.inicializarCabeceraPorDefecto();
    }

    document.addEventListener("keydown", (event: any) =>{
      // if (event.code === "F4")
      // {
        // if (!this.isModalOpen) {
          // El modal ya está abierto, no hacemos nada
          // event.preventDefault();
          // this.emitirRecibos();
          // return;
        // }
      // }
      if (event.code === "F7")
      {
          event.preventDefault();
          this.agregarItem();
      }
      if (event.code === "F6")
      {
          event.preventDefault();
          this.calcularMayoreo();
      }
    });
  }

  /** Lee el punto de venta activo (tras cambio de tienda con reload o al entrar a la pantalla). */
  private refrescarContextoPuntoVenta(): void {
    const raw = localStorage.getItem('puntosVenta');
    if (raw) {
      this.puntoVentas = JSON.parse(raw);
      this.puntoVentaStorage = raw;
    }
    this.usaFacturacionElectronica = usaFacturacionElectronicaPos(this.puntoVentas?.nombre);
    this.serieCpeLoadSeq++;
    this.numeracionCpeLoadSeq++;
    if (this.formGroup) {
      this.formGroup.patchValue({
        idPuntoVenta: this.puntoVentas.id,
        puntoventa: this.puntoVentas.nombre
      });
    }
  }

  cargarCabeceraComprobante(): void {
    this.cargarTiposComprobante();
    this.cargarTiposDocumento();
  }

  /**
   * Serie y correlativo del ticket de caja (numeración tickets), no del CPE SUNAT.
   * Usa `numeroActual` como último correlativo emitido y propone `numeroActual + 1`.
   */
  cargarTicketPosDesdeNumeracionTickets(): void {
    this.numeracionticketsService.obtenerNumeracionTickets(this.puntoVentas.id).subscribe({
      next: (nt) => {
        const numeraciones: any[] = Array.isArray(nt?.numeracionTickets) ? nt.numeracionTickets : [];
        const activas = numeraciones.filter(
          (n) => n?.status === 1 || n?.status === '1' || n?.status === true
        );
        const row = activas[0] || numeraciones[0];
        if (!row) {
          this.formGroup.patchValue({
            serieTicketPos: '',
            numeroTicketPos: '',
            idSeriesTicketsTicketPos: null
          });
          this.funcionesService.showWarning(
            'No hay numeración de tickets POS para este punto de venta. Configúrela en Mantenimiento → Numeración tickets.'
          );
          return;
        }
        const serieStr =
          row?.series?.serie != null
            ? String(row.series.serie).trim()
            : '';
        const ultimo = parseInt(String(row?.numeroActual ?? '').replace(/\D/g, ''), 10);
        const siguiente =
          Number.isFinite(ultimo) && ultimo >= 0 ? String(ultimo + 1) : '1';
        const idSt = row?.idSeriesTickets != null ? Number(row.idSeriesTickets) : null;
        this.formGroup.patchValue({
          serieTicketPos: serieStr,
          numeroTicketPos: siguiente,
          idSeriesTicketsTicketPos: Number.isFinite(idSt as number) ? idSt : null
        });
      },
      error: () => {
        this.formGroup.patchValue({
          serieTicketPos: '',
          numeroTicketPos: '',
          idSeriesTicketsTicketPos: null
        });
        this.funcionesService.showWarning('No se pudo cargar la numeración del ticket POS.');
      }
    });
  }

  refrescarTicketPos(): void {
    this.cargarTicketPosDesdeNumeracionTickets();
  }

  /** Reinicia el formulario tras cobrar y deja cabecera en BOLETA + VARIOS. */
  private resetFormularioDespuesCobro(): void {
    this.detalles = [];
    this.dataSource = new MatTableDataSource<RecibosDetalles>(this.detalles);
    this.productosLista = [];
    this.isModalOpen = false;
    this.emisionManualMenorCinco = false;

    this.formGroup.patchValue({
      id: 0,
      porcentajeDesc: '',
      montoDesc: '0.00',
      totalGravada: '0.00',
      totalIgv: '0.00',
      otrosCargo: '',
      total: '0.00',
      pagado: '',
      vuelto: '',
      emitirEfact: false,
      status: true
    });

    if (this.usaFacturacionElectronica) {
      this.restablecerCabeceraPorDefecto();
    }

    setTimeout(() => {
      $("#codigoBarra").focus();
    }, 0);
  }

  /** Tras cobrar con eFact: muestra el PDF y resetea el formulario al cerrar el comprobante. */
  private abrirPdfComprobanteYResetear(response: Record<string, unknown>): void {
    const modalRef = this._modalService.open(ModalRecibosPDFComponent, this.NgbModalOptions);
    const guardado = (response['recibos'] as Record<string, unknown>) || {};
    const merged: Record<string, unknown> = { ...guardado };
    if (response['efact_ticket'] != null && merged['efact_ticket'] == null) {
      merged['efact_ticket'] = response['efact_ticket'];
    }
    if (response['ticket'] != null && merged['ticket'] == null) {
      merged['ticket'] = response['ticket'];
    }
    if (response['ticket_ose'] != null && merged['ticket_ose'] == null) {
      merged['ticket_ose'] = response['ticket_ose'];
    }
    if (response['comprobante_emitido'] != null && merged['comprobante_emitido'] == null) {
      merged['comprobante_emitido'] = response['comprobante_emitido'];
    }
    modalRef.componentInstance.fromParent = {
      recibos: merged,
      preferirComprobanteEfact: true
    };

    const alCerrarPdf = () => this.resetFormularioDespuesCobro();
    modalRef.result.then(alCerrarPdf, alCerrarPdf);
  }

  /** Restaura cabecera SUNAT/eFact a BOLETA DE VENTA y VARIOS - VENTAS MENORES. */
  private restablecerCabeceraPorDefecto(): void {
    this.sincronizarCabeceraConTiendaActual();
  }

  /**
   * Carga siempre los valores por defecto de cabecera (BOLETA/BE01/VARIOS, ticket POS y correlativo CPE).
   */
  private inicializarCabeceraPorDefecto(): void {
    this.sincronizarCabeceraConTiendaActual();
  }

  /**
   * Aplica defaults de cabecera según la tienda activa: BOLETA + serie CPE de la tienda + VARIOS.
   */
  private sincronizarCabeceraConTiendaActual(): void {
    this.defaultTipoComprobante = 'BOLETA DE VENTA';
    this.defaultTipoDocumento = '-';
    this.formGroup.patchValue({
      fechaEmision: this.funcionesService.generarFechaLocal(new Date()),
      idPuntoVenta: this.puntoVentas.id,
      puntoventa: this.puntoVentas.nombre
    });

    if (this.tiposComprobante.length > 0) {
      this.aplicarDefaultsLocalesCabecera();
    } else {
      this.cargarCabeceraComprobante();
    }
    this.cargarTicketPosDesdeNumeracionTickets();
  }

  /** Refresca correlativos al volver a la ventana (sincronización entre equipos/ventanas). */
  @HostListener('window:focus')
  onWindowFocus(): void {
    if (!this.usaFacturacionElectronica || this.isModalOpen) {
      return;
    }
    this.cargarTicketPosDesdeNumeracionTickets();
    const serie = this.formGroup.get('serieComprobante')?.value;
    if (serie) {
      this.resolverNumeracionRecibos(false);
    }
  }

  /**
   * Aplica defaults con datos ya cargados (si existen) para evitar que los selects queden vacíos
   * mientras llegan respuestas de backend.
   */
  private aplicarDefaultsLocalesCabecera(): void {
    const preferido = this.defaultTipoComprobante || 'BOLETA DE VENTA';
    const tipoPreferido = this.tiposComprobante.find((t: any) =>
      (t.documento || '').toString().trim().toUpperCase() === preferido.toUpperCase()
    );
    const boleta = this.tiposComprobante.find((t: any) =>
      (t.documento || '').toString().trim().toUpperCase() === 'BOLETA DE VENTA'
    );
    const tipoDefault =
      tipoPreferido?.documento ||
      boleta?.documento ||
      this.tiposComprobante[0]?.documento ||
      preferido;
    this.formGroup.patchValue({ tipoComprobante: tipoDefault });
    this.defaultTipoComprobante = tipoDefault;
    this.onTipoComprobanteChange();

    const docPreferido = this.tiposDocumento.find((d: any) => d.codigo === this.defaultTipoDocumento);
    const varios = this.tiposDocumento.find((d: any) => d.codigo === '-');
    const tipoDocDefault = docPreferido?.codigo || varios?.codigo || this.tiposDocumento[0]?.codigo || '-';
    this.formGroup.patchValue({
      tipoDocumento: tipoDocDefault,
      numeroDocumento: '00000000',
      cliente: 'CLIENTES VARIOS'
    });
    this.defaultTipoDocumento = tipoDocDefault;
  }

  cargarTiposComprobante(): void {
    this.comprobantesService.getTipos().subscribe((resp: any) => {
      const tipos = Array.isArray(resp) ? resp : (resp?.tipos || []);
      this.tiposComprobante = tipos;

      const preferido = this.tiposComprobante.find((t: any) =>
        (t.documento || '').toString().trim().toUpperCase() === this.defaultTipoComprobante.toUpperCase()
      );
      const boleta = this.tiposComprobante.find((t: any) =>
        (t.documento || '').toString().trim().toUpperCase() === 'BOLETA DE VENTA'
      );

      if (preferido) {
        this.formGroup.patchValue({ tipoComprobante: preferido.documento });
        this.defaultTipoComprobante = preferido.documento;
        this.onTipoComprobanteChange();
      } else if (boleta) {
        this.formGroup.patchValue({ tipoComprobante: boleta.documento });
        this.defaultTipoComprobante = boleta.documento;
        this.onTipoComprobanteChange();
      } else if (this.tiposComprobante.length > 0) {
        this.formGroup.patchValue({ tipoComprobante: this.tiposComprobante[0].documento });
        this.defaultTipoComprobante = this.tiposComprobante[0].documento;
        this.onTipoComprobanteChange();
      }
    }, () => {
      if (this.tiposComprobante.length > 0) {
        this.aplicarDefaultsLocalesCabecera();
      }
    });
  }

  cargarTiposDocumento(): void {
    this.comprobantesService.getTiposDocumento().subscribe((resp: any) => {
      const rawTipos = Array.isArray(resp) ? resp : (resp?.tipos || []);
      this.tiposDocumento = rawTipos.map((item: any) => ({
        codigo: item.codigo,
        tipo: item.tipo || item.descripcion
      }));

      const tipoComprobante = this.formGroup.get('tipoComprobante')?.value;
      if (tipoComprobante) {
        this.aplicarTipoDocumentoSegunComprobante(tipoComprobante);
        return;
      }

      // Default: VARIOS - VENTAS MENORES A S/.700.00 Y OTROS
      const preferido = this.tiposDocumento.find((d: any) => d.codigo === this.defaultTipoDocumento);
      const varios = this.tiposDocumento.find((d: any) => d.codigo === '-');
      if (preferido) {
        this.formGroup.patchValue({
          tipoDocumento: preferido.codigo,
          numeroDocumento: '00000000',
          cliente: 'CLIENTES VARIOS'
        });
        this.defaultTipoDocumento = preferido.codigo;
      } else if (varios) {
        this.formGroup.patchValue({
          tipoDocumento: varios.codigo,
          numeroDocumento: '00000000',
          cliente: 'CLIENTES VARIOS'
        });
        this.defaultTipoDocumento = varios.codigo;
      } else if (this.tiposDocumento.length > 0) {
        this.formGroup.patchValue({
          tipoDocumento: this.tiposDocumento[0].codigo,
          numeroDocumento: '00000000',
          cliente: 'CLIENTES VARIOS'
        });
        this.defaultTipoDocumento = this.tiposDocumento[0].codigo;
      }
    }, () => {
      // Mantener combos previos para no dejar selects en blanco ante fallos transitorios.
      if (this.tiposDocumento.length > 0) {
        this.aplicarDefaultsLocalesCabecera();
      }
    });
  }

  onTipoComprobanteChange(): void {
    const tipo = this.formGroup.get('tipoComprobante')?.value;
    const idPunto = this.puntoVentas?.id;
    const loadSeq = ++this.serieCpeLoadSeq;

    this.seriesList = [];
    this.formGroup.patchValue({ serieComprobante: '', numeroComprobante: '' });

    if (!tipo) {
      return;
    }

    this.aplicarTipoDocumentoSegunComprobante(tipo);

    this.comprobantesService.obtenerSeries(idPunto).subscribe((resp: any) => {
      if (loadSeq !== this.serieCpeLoadSeq) {
        return;
      }
      if (this.formGroup.get('tipoComprobante')?.value !== tipo) {
        return;
      }

      const rawSeries = resp?.series || [];
      this.seriesList = this.filtrarSeriesCpe(rawSeries);

      const serieCpe = this.resolverSerieCpeParaTipo(tipo, this.seriesList);
      if (serieCpe) {
        this.formGroup.patchValue({ serieComprobante: serieCpe });
      } else {
        this.formGroup.patchValue({ serieComprobante: '' });
      }

      this.onSerieComprobanteChange();
    }, () => {
      if (loadSeq !== this.serieCpeLoadSeq) {
        return;
      }
      this.seriesList = [];
      this.formGroup.patchValue({ serieComprobante: '', numeroComprobante: '' });
    });
  }

  /** Solo series CPE SUNAT (BE/FE), nunca tickets POS (TJxx). */
  private filtrarSeriesCpe(seriesList: any[]): any[] {
    return (seriesList || []).filter((s) => {
      const code = this.normalizarCodigoSerie(s);
      return code.startsWith('BE') || code.startsWith('FE');
    });
  }

  private normalizarCodigoSerie(s: any): string {
    if (s == null) {
      return '';
    }
    if (typeof s === 'string') {
      return s.trim().toUpperCase();
    }
    return String(s?.serie ?? '').trim().toUpperCase();
  }

  private valorSerieDesdeItem(s: any): string {
    if (s == null) {
      return '';
    }
    if (typeof s === 'string') {
      return s.trim();
    }
    return String(s?.serie ?? '').trim();
  }

  /**
   * Serie CPE SUNAT (BE01/BE02, FE01/FE02), nunca la serie del ticket POS (TJxx).
   * JOVITA 1 y entorno prueba usan BE01/FE01; otras tiendas pueden usar BE02/FE02, etc.
   */
  private resolverSerieCpeParaTipo(tipo: string, seriesList: any[]): string {
    const tLower = (tipo || '').toString().toLowerCase();
    const esFactura = tLower.includes('factura');
    const prefijosPreferidos = esFactura ? ['FE01', 'FE02', 'FE03'] : ['BE01', 'BE02', 'BE03'];
    const prefijoCpe = esFactura ? 'FE' : 'BE';
    const prefijoLetra = esFactura ? 'F' : 'B';

    const candidatas = (seriesList || [])
      .map((s) => ({ raw: s, code: this.normalizarCodigoSerie(s) }))
      .filter((x) => x.code.length > 0 && !x.code.startsWith('TJ') && x.code.startsWith(prefijoLetra));

    for (const pref of prefijosPreferidos) {
      const found = candidatas.find((x) => x.code === pref);
      if (found) {
        return this.valorSerieDesdeItem(found.raw) || found.code;
      }
    }

    const delPatron = candidatas.filter((x) => x.code.startsWith(prefijoCpe));
    if (delPatron.length > 0) {
      return this.valorSerieDesdeItem(delPatron[0].raw) || delPatron[0].code;
    }

    return candidatas[0] ? (this.valorSerieDesdeItem(candidatas[0].raw) || candidatas[0].code) : '';
  }

  /** Al cambiar comprobante: Boleta → VARIOS; Factura → RUC. */
  private aplicarTipoDocumentoSegunComprobante(tipo: string): void {
    const tLower = (tipo || '').toString().toLowerCase();
    const esFactura = tLower.includes('factura');
    const esBoleta = tLower.includes('boleta');

    if (!esFactura && !esBoleta) {
      return;
    }

    if (esFactura) {
      const ruc = this.tiposDocumento.find((d: any) => String(d.codigo) === '6');
      if (ruc) {
        this.formGroup.patchValue({
          tipoDocumento: ruc.codigo,
          numeroDocumento: '',
          cliente: ''
        });
        this.defaultTipoDocumento = ruc.codigo;
      }
      return;
    }

    const varios = this.tiposDocumento.find((d: any) => String(d.codigo) === '-');
    if (varios) {
      this.formGroup.patchValue({
        tipoDocumento: varios.codigo,
        numeroDocumento: '00000000',
        cliente: 'CLIENTES VARIOS'
      });
      this.defaultTipoDocumento = varios.codigo;
    }
  }

  onTipoDocumentoChange(): void {
    const tipoDocumento = this.formGroup.get('tipoDocumento')?.value;

    // Limpiar dependientes al cambiar el tipo de documento
    this.formGroup.patchValue({
      numeroDocumento: '',
      cliente: ''
    });

    // Default especial para "VARIOS - VENTAS MENORES A S/.700.00 Y OTROS"
    if (tipoDocumento === '-') {
      this.formGroup.patchValue({
        numeroDocumento: '00000000',
        cliente: 'CLIENTES VARIOS'
      });
    }
  }

  consultarDocumento(): void {
    const tipoDoc = this.formGroup.get('tipoDocumento')?.value;
    const numeroDocumento = (this.formGroup.get('numeroDocumento')?.value || '').toString().trim();

    if (!tipoDoc) {
      this.funcionesService.showError('Seleccione primero el tipo de documento');
      return;
    }

    // Para "VARIOS" no aplica consulta SUNAT
    if (tipoDoc === '-') {
      this.formGroup.patchValue({
        numeroDocumento: '00000000',
        cliente: 'CLIENTES VARIOS'
      });
      return;
    }

    if (!numeroDocumento) {
      return;
    }

    if (tipoDoc === '1' && numeroDocumento.length !== 8) {
      this.funcionesService.showError('El DNI debe tener 8 dígitos');
      return;
    }

    if (tipoDoc === '6' && numeroDocumento.length !== 11) {
      this.funcionesService.showError('El RUC debe tener 11 dígitos');
      return;
    }

    if ((tipoDoc === '1' || tipoDoc === '6') && !/^[0-9]+$/.test(numeroDocumento)) {
      this.funcionesService.showError('El número de documento debe contener solo dígitos');
      return;
    }

    this.clientesService.consultasSUNAT(numeroDocumento, this.puntoVentas?.id).subscribe((resp: any) => {
      if (resp && resp.status === 200 && resp.clientes) {
        const cliente = resp.clientes;
        this.formGroup.patchValue({
          cliente: cliente.nombre || cliente.razonsocial || cliente.razonSocial || ''
        });
      } else {
        this.formGroup.patchValue({ cliente: '' });
        this.funcionesService.showInfo('No se encontró información para el documento ingresado');
      }
    }, () => {
      this.formGroup.patchValue({ cliente: '' });
      this.funcionesService.showError('No se pudo consultar el documento');
    });
  }

  onSerieComprobanteChange(esRefrescoManual: boolean = false): void {
    const serie = this.formGroup.get('serieComprobante')?.value;
    const tipoComprobante = this.formGroup.get('tipoComprobante')?.value;
    if (!serie) {
      this.formGroup.patchValue({ numeroComprobante: '' });
      return;
    }
    this.defaultTipoComprobante = tipoComprobante || this.defaultTipoComprobante;

    this.resolverNumeracionRecibos(false, () => {
      if (esRefrescoManual) {
        const numero = this.formGroup.get('numeroComprobante')?.value || '';
        this.funcionesService.showInfo(`Correlativo actualizado: ${numero}`);
      }
    });
  }

  private resolverNumeracionRecibos(mostrarMensajeSiFalla: boolean, onSuccess?: () => void): void {
    const serie = this.formGroup.get('serieComprobante')?.value;
    const tipoComprobante = this.formGroup.get('tipoComprobante')?.value;
    const idPuntoVenta = Number(this.puntoVentas?.id ?? this.formGroup.get('idPuntoVenta')?.value ?? 0);
    const loadSeq = ++this.numeracionCpeLoadSeq;

    if (!serie) {
      this.formGroup.patchValue({ numeroComprobante: '' });
      if (mostrarMensajeSiFalla) {
        this.funcionesService.showWarning('Seleccione una serie para obtener el correlativo.');
      }
      return;
    }

    if (!idPuntoVenta) {
      this.formGroup.patchValue({ numeroComprobante: '' });
      if (mostrarMensajeSiFalla) {
        this.funcionesService.showWarning('No se identificó el punto de venta para el correlativo CPE.');
      }
      return;
    }

    this.recibosService
      .obtenerSiguienteNumeracion({
        idPuntoVenta,
        tipoComprobante,
        serieComprobante: serie,
        series: serie
      })
      .subscribe(
        (nr) => {
          if (loadSeq !== this.numeracionCpeLoadSeq) {
            return;
          }
          if (this.formGroup.get('serieComprobante')?.value !== serie) {
            return;
          }
          const idPuntoActual = Number(this.puntoVentas?.id ?? this.formGroup.get('idPuntoVenta')?.value ?? 0);
          if (idPuntoActual !== idPuntoVenta) {
            return;
          }

          const sig = nr?.siguiente;
          const numero = sig !== undefined && sig !== null && sig !== '' ? String(sig) : '';
          this.formGroup.patchValue({ numeroComprobante: numero });
          this.defaultTipoComprobante = tipoComprobante || this.defaultTipoComprobante;
          if (!numero && mostrarMensajeSiFalla) {
            this.funcionesService.showWarning('No se pudo obtener el correlativo desde recibos/numeracion.');
          }
          if (numero && onSuccess) {
            onSuccess();
          }
        },
        () => {
          if (loadSeq !== this.numeracionCpeLoadSeq) {
            return;
          }
          if (this.formGroup.get('serieComprobante')?.value !== serie) {
            return;
          }
          const idPuntoActual = Number(this.puntoVentas?.id ?? this.formGroup.get('idPuntoVenta')?.value ?? 0);
          if (idPuntoActual !== idPuntoVenta) {
            return;
          }

          // fallback legacy para no bloquear el flujo
          this.comprobantesService.getNumeracion(serie, idPuntoVenta).subscribe(
            (nr: any) => {
              if (loadSeq !== this.numeracionCpeLoadSeq) {
                return;
              }
              if (this.formGroup.get('serieComprobante')?.value !== serie) {
                return;
              }
              const idPuntoActualFb = Number(this.puntoVentas?.id ?? this.formGroup.get('idPuntoVenta')?.value ?? 0);
              if (idPuntoActualFb !== idPuntoVenta) {
                return;
              }

              const sig = nr?.siguiente;
              const numero = sig !== undefined && sig !== null && sig !== '' ? String(sig) : '';
              this.formGroup.patchValue({ numeroComprobante: numero });
              if (!numero && mostrarMensajeSiFalla) {
                this.funcionesService.showWarning('No se pudo resolver el correlativo para la serie seleccionada.');
              }
              if (numero && onSuccess) {
                onSuccess();
              }
            },
            () => {
              if (loadSeq !== this.numeracionCpeLoadSeq) {
                return;
              }
              this.formGroup.patchValue({ numeroComprobante: '' });
              if (mostrarMensajeSiFalla) {
                this.funcionesService.showWarning(
                  'No se pudo obtener el correlativo automático. Verifique tipo/serie e intente nuevamente.'
                );
              }
            }
          );
        }
      );
  }

  cargarProductos(){
    if (this.productosLista.length > 0) {
      return;
    }

    this.funcionesService.showLoading();
    this.productosService.cargarProductosVentas(this.puntoVentas.id).subscribe(response => {
      this.productosLista = response.productos;
      this.funcionesService.hideLoading();
    }, () => {
      this.funcionesService.hideLoading();
    });
  }

  private registrarProductoEnCache(producto: Productos): void {
    if (!producto || !producto.id) {
      return;
    }

    const existe = this.productosLista.find((p: Productos) => parseInt(p.id, 10) === parseInt(producto.id, 10));
    if (!existe) {
      this.productosLista.push(producto);
    }
  }

  /**
   * Enfoca la cantidad de la fila. No actuar si el clic viene de un control (select, input, botón),
   * porque el focus forzado cierra el desplegable del select IGV.
   */
  highlight(row: any, event?: MouseEvent) {
    const target = event?.target as HTMLElement | undefined;
    if (target?.closest('select, input, button, textarea, a, label')) {
      return;
    }
    const codigoBarra = typeof row === 'string' ? row : row?.codigoBarra;
    if (!codigoBarra) {
      return;
    }
    this.selectedRowIndex = codigoBarra;
    $("#cantidad-" + codigoBarra).focus();
  }

  private obtenerTotalVentaActual(): number {
    const total = parseFloat(this.formGroup?.get('total')?.value || '0');
    return isNaN(total) ? 0 : total;
  }

  private aplicarReglaEmisionPorTotal(): void {
    if (!this.usaFacturacionElectronica || !this.formGroup) {
      return;
    }

    const total = this.obtenerTotalVentaActual();
    const debeEmitir = total >= 5;

    this.emisionManualMenorCinco = false;
    this.formGroup.patchValue({ emitirEfact: debeEmitir }, { emitEvent: false });
  }

  onEmitirEfactChange(event: any): void {
    if (!this.usaFacturacionElectronica) {
      return;
    }
    const checked = !!event?.checked;
    const total = this.obtenerTotalVentaActual();

    if (total < 5) {
      this.emisionManualMenorCinco = false;
      this.formGroup.patchValue({ emitirEfact: false }, { emitEvent: false });
      if (checked) {
        this.funcionesService.showInfo('Las ventas menores a S/ 5 no generan comprobante electrónico SUNAT.');
      }
      return;
    }

    this.formGroup.patchValue({ emitirEfact: checked }, { emitEvent: false });
  }

  private productoPorDetalle(detalle: RecibosDetalles): Productos | undefined {
    return this.productosLista.find(
      (p) =>
        parseInt(String(p.id), 10) === parseInt(String(detalle.idProducto), 10) &&
        parseInt(String(p.idPuntoVenta), 10) === this.puntoVentas.id
    );
  }

  private refrescarTotalesCabecera(): void {
    const pctRaw = this.formGroup.get('porcentajeDesc')?.value;
    const pct =
      pctRaw !== '' && pctRaw != null && String(pctRaw) !== '0'
        ? parseFloat(String(pctRaw))
        : NaN;
    const opciones = !isNaN(pct) && pct ? { porcentajeDescGlobal: pct } : undefined;
    const t = recalcularTotalesCabeceraDesdeDetalles(
      this.detalles,
      (d) => this.productoPorDetalle(d),
      opciones
    );
    this.formGroup.get('totalGravada').setValue(t.totalGravada);
    this.formGroup.get('totalIgv').setValue(t.totalIgv);
    this.formGroup.get('total').setValue(t.total);
    if (t.montoDesc !== undefined) {
      this.formGroup.get('montoDesc').setValue(t.montoDesc);
    } else if (!opciones) {
      this.formGroup.get('montoDesc').setValue('0.00');
    }
  }

  onCodigoAfectacionLineaChange(detalle: RecibosDetalles, codigo: string): void {
    detalle.codigoAfectacionIgv = codigo;
    const qty =
      parseFloat(String($('#cantidad-' + detalle.codigoBarra).val() ?? detalle.cantidad)) || 0;
    const precio = parseFloat(String(detalle.precio ?? 0)) || 0;
    asignarMontosDetalle(detalle, qty, precio, this.productoPorDetalle(detalle));
    this.refrescarTotalesCabecera();
    this.aplicarReglaEmisionPorTotal();
  }

  calcular(detalle:RecibosDetalles){
    let productosLista: Productos[] = this.productosLista;
    productosLista = productosLista.filter(x => x.codigoBarra === detalle.codigoBarra && parseInt(x.idPuntoVenta) === this.puntoVentas.id);
    let productos: Productos = productosLista[0];
    let stockActual: any = parseFloat(productos.stockActual) - parseFloat($("#cantidad-" + detalle.codigoBarra).val());

    if(parseFloat(stockActual) > 0 && parseFloat(stockActual) <= parseFloat(productos.stockAlerta)){
      this.funcionesService.showError('El producto ' + productos.nombre + ' se esta quedando sin stock. Stock Actual: ' + productos.stockActual);
    }

    if(parseFloat(stockActual) < 0){
      this.funcionesService.showError('El producto ' + productos.nombre + ' se quedaria sin stock.');
      $("#cantidad-" + productos.codigoBarra).val(1);
    }

    const qty = parseFloat($("#cantidad-" + detalle.codigoBarra).val()) || 0;
    const precioUnit = parseFloat(String(productos.precio)) || 0;
    this.detalles.forEach(element => {
      if(element.idProducto === productos.id){
        asignarMontosDetalle(element, qty, precioUnit, productos);
        element.existencia = parseFloat(productos.stockActual) - qty;
      }
    });

    this.refrescarTotalesCabecera();
    this.aplicarReglaEmisionPorTotal();
  }

  onKeydown(event: any, indice: number) {
    if (event.key === 'ArrowDown') {
      this.dataSource.filteredData.forEach((element, index) => {
        if (indice === index) {
          this.reducir(element);
        }
      });
    }
    if (event.key === 'ArrowUp') {
      this.dataSource.filteredData.forEach((element, index) => {
        if (indice === index) {
          this.aumentar(element);
        }
      });
    }
    if (event.key === 'Delete') {
      this.eliminarItem(indice);
    }
  }

  openModal(name: string) {

    const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
    const obj: any = new Object();

    switch (name) {
      case 'clientes':
        obj['opcion'] = 1;
        obj['clientes'] = this.clientes;
        modalRef.componentInstance.fromParent = obj;
      break;
      case 'items':
        obj['opcion'] = this.opcion;
        obj['items'] = this.items;
        modalRef.componentInstance.fromParent = obj;
      break;
      case 'medioPago':
        obj['recibos'] = this.recibos;
        obj['opcion'] = 1;
        modalRef.componentInstance.fromParent = obj;
      break;
      case 'kilos':
        obj['productos'] = this.productos;
        modalRef.componentInstance.fromParent = obj;
      break;
      case 'consultar':
        obj['productos'] = this.productos;
        modalRef.componentInstance.fromParent = obj;
      break;
    }

    modalRef.result.then(async (result) => {

      switch (result.modal) {
        case 'items':

          if (result.value === 'loadAgain') {

            this.productos = result.productos;
            this.registrarProductoEnCache(result.productos);
            if(result.productos.nombreUm.toUpperCase().includes('KILOGRAMO')){
              this.openModal('kilos');
            }else{

              setTimeout(() => {
                this.highlight(result.items.codigoBarra);
              }, 1000);

              if(parseInt(result.opcion) === 1){
                let contador: number = 0;
                if(this.detalles.length > 0){
                  this.detalles.forEach(element => {
                    if(element.idProducto === result.items.idProducto){
                      contador += 1;
                      const cant = parseFloat(String(element.cantidad)) + parseFloat(String(result.items.cantidad));
                      element.cantidad = cant.toFixed(2);
                      const prod =
                        this.productoPorDetalle(element) || (result.productos as Productos);
                      asignarMontosDetalle(element, cant, parseFloat(String(element.precio)), prod);
                    }
                  });

                  if (contador === 0) {
                    this.detalles.push(result.items);
                  }
                }else{
                  this.detalles.push(result.items);
                }
              }

              if(parseInt(result.opcion) === 3){
                this.detalles.splice(this.indexEliminar, 1);
              }

              this.dataSource = new MatTableDataSource<RecibosDetalles>(this.detalles);

              this.refrescarTotalesCabecera();
              this.aplicarReglaEmisionPorTotal();
            }
          }
          break;
        case 'medioPago':
          if (result.value === 'showPdf') {
            this.abrirPdfComprobanteYResetear(result.response || {});
          } else if (result.value === 'loadAgain') {
            this.resetFormularioDespuesCobro();
          }
          break;
        case 'kilos':

        if (result.value === 'loadAgain') {
          let productos = result.productos;
          let cantidad = result.cantidad;
          let precio = result.precio;

          this.registrarProductoEnCache(productos);



          if(parseFloat(productos.stockActual) <= 0){
            this.funcionesService.showError('El producto ' + productos.nombre + ' no tiene Stock');
            $("#codigoBarra").val('');
              $("#codigoBarra").focus();
          }else{

            if(parseFloat(productos.stockActual) > 0 && parseFloat(productos.stockActual) <= parseFloat(productos.stockAlerta)){
              this.funcionesService.showError('El producto ' + productos.nombre + ' se esta quedando sin stock. Stock Actual: ' + productos.stockActual);
              $("#codigoBarra").val('');
              $("#codigoBarra").focus();
            }else{

              if((productos.stockActual - parseFloat(cantidad)) <= 0){
                this.funcionesService.showError('El producto ' + productos.nombre + ' se quedaria sin Stock');
                $("#codigoBarra").val('');
                $("#codigoBarra").focus();
              }else{
                let detalles: RecibosDetalles[] = [];
                detalles = this.detalles.filter(x => parseInt(x.idProducto) === parseInt(productos.id));

                if(detalles.length === 0){
                  const row: RecibosDetalles = {
                    idRecibo: 0,
                    idProducto: productos.id,
                    codigoBarra: productos.codigoBarra,
                    nombre: productos.nombre,
                    detalle: '',
                    precio: productos.precio,
                    cantidad: parseFloat(cantidad).toFixed(2),
                    porcentajeDesc: 0.00,
                    totalDesc: 0.00,
                    existencia: parseFloat(String(productos.stockActual)) - parseFloat(cantidad)
                  } as RecibosDetalles;
                  distribuirTotalLineaEnSubtotalIgv(row, parseFloat(precio), productos);
                  this.detalles.push(row);
                }else{

                  this.detalles.forEach(element => {
                    if(element.idProducto === productos.id){
                      element.cantidad =( parseFloat(cantidad) + parseFloat(String(element.cantidad))).toFixed(2);
                      distribuirTotalLineaEnSubtotalIgv(element, parseFloat(precio), productos);
                      element.existencia = element.existencia - parseFloat(cantidad)
                    }
                  });
                }

                $("#codigoBarra").val('');
                this.selectedRowIndex = productos.codigoBarra;
                this.dataSource = new MatTableDataSource<RecibosDetalles>(this.detalles);

                this.refrescarTotalesCabecera();
                this.aplicarReglaEmisionPorTotal();
              }
            }
          }
        }
        break;
      }
    }, (reason) => {
      this.isModalOpen = false;
    });
  }

  agregarItem(){
    this.opcion = 1;
    this.openModal('items');
  }

  consultarItem(){
    this.opcion = 1;
    this.openModal('consultar');
  }

  eliminarItem(index: number){

    this.funcionesService.showLoading();
    this.progressBar = true;

    this.funcionesService.mensajeConfirmar('', '¿Desea eliminar este registro?', (result: any) => {
      if (result.isConfirmed) {
        this.detalles.splice(index, 1);

       this.dataSource = new MatTableDataSource<RecibosDetalles>(this.detalles);

       this.refrescarTotalesCabecera();
      this.aplicarReglaEmisionPorTotal();

        this.funcionesService.hideLoading();
        this.progressBar = false;
      }
    });

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  viewDetail(element: any, index: number) {
    this.opcion = 2;
    this.items = element;
    this.indexEliminar = index;
    this.openModal('items');
  }

  calcularTotales(target: any){
    let value = target.value;
    this.funcionesService.showLoading();
    this.progressBar = true;

    if(value !== '' && value !== '0'){
      this.formGroup.patchValue({ porcentajeDesc: value });
    }else{
      this.formGroup.patchValue({ porcentajeDesc: '', montoDesc: '0.00' });
    }

    this.refrescarTotalesCabecera();
    this.aplicarReglaEmisionPorTotal();

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  onEnter(event: any){
    const codigoBarra = (event.value || '').toString().trim();
    if (codigoBarra === '') {
      return;
    }

    if (this.codigoBarraTimeout) {
      clearTimeout(this.codigoBarraTimeout);
    }

    this.codigoBarraTimeout = setTimeout(() => {
      if (this.buscandoCodigoBarra) {
        return;
      }

      this.buscandoCodigoBarra = true;
      this.productosService.obtenerProductosCodigoBarra(codigoBarra, this.puntoVentas.id).subscribe((response: any) => {
        this.buscandoCodigoBarra = false;
        const productos: Productos = response?.productos;

        if (!productos || !productos.id) {
          return;
        }

        this.productos = productos;
        this.registrarProductoEnCache(productos);

        if(productos.nombreUm.toUpperCase().includes('KILOGRAMO')){
          this.openModal('kilos');
        }else{
          if(parseFloat(productos.stockActual) > 0 && parseFloat(productos.stockActual) <= parseFloat(productos.stockAlerta)){
            this.funcionesService.showError('El producto ' + productos.nombre + ' se esta quedando sin stock. Stock Actual: ' + productos.stockActual);
            $("#codigoBarra").val('');
            $("#codigoBarra").focus();
          }

          if(parseFloat(productos.stockActual) <= 0){
            this.funcionesService.showError('El producto ' + productos.nombre + ' no tiene stock');
            $("#codigoBarra").val('');
            $("#codigoBarra").focus();
          }else{

            let detalles: RecibosDetalles[] = [];
            detalles = this.detalles.filter(x => parseInt(x.idProducto) === parseInt(productos.id));
            this.selectedRowIndex = productos.codigoBarra;

            if(detalles.length === 0){
              const row: RecibosDetalles = {
                idRecibo: 0,
                idProducto: productos.id,
                codigoBarra: productos.codigoBarra,
                nombre: productos.nombre,
                detalle: '',
                precio: productos.precio,
                cantidad: '1.00',
                porcentajeDesc: 0.00,
                totalDesc: 0.00,
                existencia: parseFloat(String(productos.stockActual)) - 1
              } as RecibosDetalles;
              asignarMontosDetalle(row, 1, parseFloat(String(productos.precio)), productos);
              this.detalles.push(row);
            }else{

              this.detalles.forEach(element => {
                if(element.idProducto === productos.id){
                  if((parseFloat(String(productos.stockActual)) - parseFloat(String(element.cantidad))) <= 0){
                    this.funcionesService.showError('No puede seguir agregando debido a que la existencia seria negativo');
                  }else{
                    const cant = 1 + parseFloat(String(element.cantidad));
                    element.cantidad = cant.toFixed(2);
                    asignarMontosDetalle(element, cant, parseFloat(String(productos.precio)), productos);
                    element.existencia = (parseFloat(String(productos.stockActual)) - parseFloat(String(element.cantidad))).toFixed(2);
                  }
                }
              });
            }

            this.dataSource = new MatTableDataSource<RecibosDetalles>(this.detalles);
            $("#codigoBarra").focus();
            $("#codigoBarra").val('');

            this.refrescarTotalesCabecera();
            this.aplicarReglaEmisionPorTotal();
          }
        }

      }, () => {
        this.buscandoCodigoBarra = false;
      });
    }, 180);
  }

  emitirRecibos(){
    if(this.formGroup.invalid){
      this.funcionesService.swalError('Información incorrecta o incompleta');
    }else{
      const continuarCobro = () => {
        this.funcionesService.showLoading();
        this.progressBar = true;

        if(this.detalles.length === 0){
          this.funcionesService.showError('Ingrese un item como minimo');
          this.funcionesService.hideLoading();
          this.progressBar = false;

        }else{

          this.detalles.forEach(element => {
            element.precio = parseFloat(String(element.precio));
            const q = parseFloat(String($("#cantidad-" + element.codigoBarra).val())).toFixed(2);
            element.cantidad = q;
            asignarMontosDetalle(
              element,
              parseFloat(q),
              parseFloat(String(element.precio)),
              this.productoPorDetalle(element)
            );
          });

          let vfbModal = this.formGroup.value;
          this.recibos.id = vfbModal.id;
          this.recibos = vfbModal;
          this.recibos.idPuntoVenta = vfbModal.idPuntoVenta;
          this.recibos.fechaEmision = vfbModal.fechaEmision;
          this.recibos.totalGravada = this.formGroup.get("totalGravada").value;
          this.recibos.totalIgv = this.formGroup.get("totalIgv").value;
          this.recibos.total = this.formGroup.get("total").value;
          this.recibos.pagado = this.formGroup.get("pagado").value;
          this.recibos.vuelto = this.formGroup.get("vuelto").value;
          this.recibos.detalles = this.detalles;

          if (this.usaFacturacionElectronica) {
            this.recibos.documento = vfbModal.tipoDocumento;
            this.recibos.razonSocial = vfbModal.cliente;
            this.recibos.series = vfbModal.serieTicketPos;
            this.recibos.numeracion = vfbModal.numeroTicketPos;
            const emitir = !!this.formGroup.get('emitirEfact')?.value && this.obtenerTotalVentaActual() >= 5;
            this.recibos.emitirEfact = emitir;
            if (emitir) {
              this.recibos.serieComprobanteEfact = vfbModal.serieComprobante;
              this.recibos.numeroComprobanteEfact = vfbModal.numeroComprobante;
              const rPayload: any = this.recibos;
              rPayload.serie_comprobante_efact = vfbModal.serieComprobante;
              rPayload.numero_comprobante_efact = vfbModal.numeroComprobante;
            } else {
              this.recibos.serieComprobanteEfact = '';
              this.recibos.numeroComprobanteEfact = '';
              const rPayload: any = this.recibos;
              rPayload.serie_comprobante_efact = '';
              rPayload.numero_comprobante_efact = '';
            }
          } else {
            this.recibos.emitirEfact = false;
          }

          this.isModalOpen = true;
          this.openModal('medioPago');
          this.funcionesService.hideLoading();
          this.progressBar = false;
        }
      };

      if (this.usaFacturacionElectronica) {
        this.resolverNumeracionRecibos(true, () => continuarCobro());
      } else {
        continuarCobro();
      }
    }
  }

  aumentar(detalle: RecibosDetalles){

    if((detalle.existencia - 1) < 0){
      this.funcionesService.showError('El producto se quedaria sin Stock.');
    }else{

      $("#cantidad-" + detalle.codigoBarra).val((parseFloat($("#cantidad-" + detalle.codigoBarra).val()) + 1).toFixed(2));
      const qty = parseFloat($("#cantidad-" + detalle.codigoBarra).val()) || 0;
      const prod = this.productoPorDetalle(detalle);
      asignarMontosDetalle(detalle, qty, parseFloat(String(detalle.precio)), prod);
      detalle.existencia = detalle.existencia  - 1;

      this.refrescarTotalesCabecera();
      this.aplicarReglaEmisionPorTotal();
    }
  }

  reducir(detalle: RecibosDetalles){
    if($("#cantidad-" + detalle.codigoBarra).val() > 1){
      $("#cantidad-" + detalle.codigoBarra).val((parseFloat($("#cantidad-" + detalle.codigoBarra).val()) - 1).toFixed(2));

      const qty = parseFloat($("#cantidad-" + detalle.codigoBarra).val()) || 0;
      const prod = this.productoPorDetalle(detalle);
      asignarMontosDetalle(detalle, qty, parseFloat(String(detalle.precio)), prod);
      detalle.existencia = detalle.existencia  + 1;

      this.refrescarTotalesCabecera();
      this.aplicarReglaEmisionPorTotal();
    }
  }

  calcularMayoreo(){
    if(parseFloat(this.productos.precioMayor) === 0){
      this.funcionesService.showInfo('Este producto no tiene precio mayoreo');
      return;
    }

    const cantidadInput = parseFloat($("#cantidad-" + this.productos.codigoBarra).val() || '0');

    this.detalles.forEach(element => {
      if(parseInt(element.idProducto, 10) === parseInt(this.productos.id, 10)){
        const prod = this.productosLista.find(p => parseInt(p.id) === parseInt(element.idProducto));
        // use precioMayor field because registro lo guarda ahí
        let precioMayor = prod ? parseFloat(prod.precioMayor) : parseFloat(this.productos.precioMayor);
        if (isNaN(precioMayor)) {
          console.warn('precioMayor NaN for element', element, 'prod', prod);
          precioMayor = 0;
        }
        element.precio = precioMayor;

        const nombreUm = prod ? prod.nombreUm : this.productos.nombreUm;
        const stockActual = prod ? prod.stockActual : this.productos.stockActual;

        if(nombreUm.trim().toLowerCase().includes('kilogramo')){
          element.cantidad = ((parseFloat(element.total) / parseFloat(element.precio)) || 0).toFixed(3);
          element.existencia = ((parseFloat(stockActual) - parseFloat(element.cantidad)) || 0).toString();
          distribuirTotalLineaEnSubtotalIgv(element, parseFloat(String(element.total)), prod || this.productos);
        }else{
          asignarMontosDetalle(
            element,
            cantidadInput,
            parseFloat(String(element.precio)),
            prod || this.productos
          );
        }
      }
    });

    $("#codigoBarra").val('');
    this.dataSource = new MatTableDataSource<RecibosDetalles>(this.detalles);

    this.refrescarTotalesCabecera();
    this.aplicarReglaEmisionPorTotal();
  }

  carlcularMinimo(){
    if(parseFloat(this.productos.precioMinimo) === 0){
      this.funcionesService.showInfo('Este producto no tiene precio mínimo');
      return;
    }

    // grab quantity once to avoid multiple DOM accesses
    const cantidadInput = parseFloat($("#cantidad-" + this.productos.codigoBarra).val() || '0');

    // perform all model mutations inside a timeout so Angular's change
    // detector won't complain about ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.detalles.forEach(element => {
        if(parseInt(element.idProducto, 10) === parseInt(this.productos.id, 10)){
          // obtain the corresponding product from the loaded list in case
          // this.productos no longer refers to the row being updated
          const prod = this.productosLista.find(p => parseInt(p.id) === parseInt(element.idProducto));
          let precioOferta = prod ? parseFloat(prod.precioMinimo) : parseFloat(this.productos.precioMinimo);
          if (isNaN(precioOferta)) {
            console.warn('precioOferta NaN for element', element, 'prod', prod, 'productosLista length', this.productosLista.length);
            precioOferta = 0;
          }
          element.precio = precioOferta;

          const nombreUm = prod ? prod.nombreUm : this.productos.nombreUm;
          const stockActual = prod ? prod.stockActual : this.productos.stockActual;

          if(nombreUm.trim().toLowerCase().includes('kilogramo')){
            element.cantidad = ((parseFloat(element.total) / parseFloat(element.precio)) || 0).toFixed(3);
            element.existencia = ((parseFloat(stockActual) - parseFloat(element.cantidad)) || 0).toString();
            distribuirTotalLineaEnSubtotalIgv(element, parseFloat(String(element.total)), prod || this.productos);
          }else{
            asignarMontosDetalle(
              element,
              cantidadInput,
              parseFloat(String(element.precio)),
              prod || this.productos
            );
          }
        }
      });

      $("#codigoBarra").val('');
      this.dataSource = new MatTableDataSource<RecibosDetalles>(this.detalles);

      this.refrescarTotalesCabecera();
      this.aplicarReglaEmisionPorTotal();
    });
  }

  calcularMaximo(){
    // retrieve a numeric version of the current quantity once
    const cantidadInput = parseFloat($("#cantidad-" + this.productos.codigoBarra).val() || '0');

    if(parseFloat(this.productos.precioMaximo) === 0){
      this.funcionesService.showInfo('Este producto no tiene precio máximo');
      return;
    }

    this.detalles.forEach(element => {
      if(parseInt(element.idProducto, 10) === parseInt(this.productos.id, 10)){
        const prod = this.productosLista.find(p => parseInt(p.id, 10) === parseInt(element.idProducto, 10));
        // prefer the value from productosLista in case this.productos is stale
        let precioMax = prod ? parseFloat(prod.precioMaximo) : parseFloat(this.productos.precioMaximo);
        if(isNaN(precioMax)){
          console.warn('precioMaximo NaN for element', element, 'prod', prod);
          precioMax = 0;
        }

        element.precio = precioMax;

        const nombreUm = prod ? prod.nombreUm : this.productos.nombreUm;
        const stockActual = prod ? prod.stockActual : this.productos.stockActual;

        if(nombreUm.trim().toLowerCase().includes('kilogramo')){
          element.cantidad = ((parseFloat(element.total) / precioMax) || 0).toFixed(3);
          element.existencia = ((parseFloat(stockActual) - parseFloat(element.cantidad)) || 0).toString();
          distribuirTotalLineaEnSubtotalIgv(element, parseFloat(String(element.total)), prod || this.productos);
        }else{
          asignarMontosDetalle(element, cantidadInput, precioMax, prod || this.productos);
        }
      }
    });

    $("#codigoBarra").val('');
    this.dataSource = new MatTableDataSource<RecibosDetalles>(this.detalles);

    this.refrescarTotalesCabecera();
    this.aplicarReglaEmisionPorTotal();
  }
}
