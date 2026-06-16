import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { saveAs } from 'file-saver';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { PuntosventaService } from '../../mantenimientos/puntosventa/service/puntosventa.service';
import { ProductosService } from '../../almacen/productos/service/Productos.service';
import {
  ContabilidadService,
  KardexGeneralCabeceraFila,
  InventarioValorizadoPaginacion,
  KardexGeneralConsultaParams,
  KardexGeneralDetalleFila,
  KardexGeneralProducto,
  KardexGeneralResponse
} from '../contabilidad.service';
import { formatExcelSerialDate } from '../utils/excel-serial-date.util';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import {
  idPuntoVentaDesdeStorage,
  periodoMesActual
} from '../utils/contabilidad-filtros-defaults.util';

export interface KardexTablaFila {
  idProducto?: number;
  movimiento?: string;
  [key: string]: string | number | undefined;
}

@Component({
  selector: 'app-kardex-general',
  templateUrl: './kardex-general.component.html',
  styleUrls: ['./kardex-general.component.css'],
  providers: [PuntosventaService]
})
export class KardexGeneralComponent implements OnInit {
  readonly perPageOpciones = [25, 50, 100, 250, 500];

  fg: FormGroup;
  puntosVenta: PuntosVenta[] = [];
  loading = false;
  descargandoExcel = false;
  buscandoProducto = false;

  productoNombre = '';
  idProductoResuelto: number | null = null;
  productoResueltoPorBuscar = false;

  respuesta: KardexGeneralResponse | null = null;
  paginacion: InventarioValorizadoPaginacion | null = null;
  productoSeleccionado: KardexGeneralProducto | null = null;
  idProductoDetalle: number | null = null;

  pageActual = 1;
  perPage = 100;

  cabecerasCabecera: string[] = [];
  keysCabecera: string[] = [];
  displayedColumnsCabecera: string[] = [];
  cabeceraDS = new MatTableDataSource<KardexTablaFila>([]);

  cabecerasDetalle: string[] = [];
  keysDetalle: string[] = [];
  displayedColumnsDetalle: string[] = [];
  detalleDS = new MatTableDataSource<KardexTablaFila>([]);

  constructor(
    private fb: FormBuilder,
    private contabilidad: ContabilidadService,
    private puntosventaService: PuntosventaService,
    private productosService: ProductosService,
    public funciones: FuncionesService
  ) {
    const { fechaInicio, fechaFin } = periodoMesActual();
    this.fg = this.fb.group({
      fechaInicio: [fechaInicio, Validators.required],
      fechaFin: [fechaFin, Validators.required],
      idPuntoVenta: ['', Validators.required],
      codigo: [''],
      nombre: [''],
      codigoBarra: [''],
      incluirSaldoInicial: [true]
    });
  }

  ngOnInit(): void {
    this.fg.patchValue({ idPuntoVenta: idPuntoVentaDesdeStorage() });

    this.puntosventaService.cargarPuntosVenta().subscribe({
      next: (data: any) => {
        this.puntosVenta = data?.puntosVenta || [];
      },
      error: () => {
        this.puntosVenta = [];
      }
    });
  }

  get paginatorLength(): number {
    return this.paginacion?.total_productos ?? 0;
  }

  get paginatorPageIndex(): number {
    return Math.max(0, (this.paginacion?.page ?? this.pageActual) - 1);
  }

  onFiltroProductoChange(): void {
    this.idProductoResuelto = null;
    this.productoNombre = '';
    this.productoResueltoPorBuscar = false;
  }

  onPuntoVentaChange(): void {
    this.onFiltroProductoChange();
  }

  onCodigoBarraKeyup(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.resolverProducto();
    }
  }

  resolverProducto(): void {
    const codigo = String(this.fg.get('codigoBarra')?.value || '').trim();
    const idPv = Number(this.fg.get('idPuntoVenta')?.value);
    if (!codigo) {
      this.funciones.showWarning('Indique el código de barras (exacto) para buscar el producto.');
      return;
    }
    if (!idPv || idPv <= 0) {
      this.funciones.showWarning('Seleccione el punto de venta.');
      return;
    }
    this.buscandoProducto = true;
    this.productoResueltoPorBuscar = false;

    this.productosService.obtenerProductosCodigoBarra(codigo, idPv).subscribe({
      next: (res: any) => {
        this.buscandoProducto = false;
        const prod = res?.productos ?? res?.producto ?? res;
        const id = prod?.id != null ? Number(prod.id) : null;
        if (!id || id <= 0) {
          this.funciones.showWarning('Producto no encontrado en el punto de venta seleccionado.');
          return;
        }
        this.idProductoResuelto = id;
        this.productoResueltoPorBuscar = true;
        this.productoNombre = prod?.nombre ? String(prod.nombre) : '';
        if (prod?.codigoBarra) {
          this.fg.get('codigoBarra')?.setValue(String(prod.codigoBarra));
        }
      },
      error: (err) => {
        this.buscandoProducto = false;
        const msg =
          err?.error?.mensaje ||
          err?.error?.message ||
          'No se encontró el producto con ese código de barras.';
        this.funciones.showError(String(msg));
      }
    });
  }

  refrescarFiltros(): void {
    const { fechaInicio, fechaFin } = periodoMesActual();
    this.fg.reset({
      fechaInicio,
      fechaFin,
      idPuntoVenta: idPuntoVentaDesdeStorage(),
      codigo: '',
      nombre: '',
      codigoBarra: '',
      incluirSaldoInicial: true
    });
    this.onFiltroProductoChange();
    this.pageActual = 1;
    this.perPage = 100;
    this.idProductoDetalle = null;
    this.limpiarResultados();
  }

  consultar(): void {
    if (!this.validarFormulario()) {
      return;
    }
    this.pageActual = 1;
    this.idProductoDetalle = null;
    this.productoSeleccionado = null;
    this.cargarConsulta(true);
  }

  onPaginatorChange(event: PageEvent): void {
    this.pageActual = event.pageIndex + 1;
    this.perPage = Math.min(500, event.pageSize);
    this.cargarConsulta(false);
  }

  seleccionarFilaCabecera(row: KardexTablaFila): void {
    const id = row.idProducto;
    if (!id || id <= 0) {
      return;
    }
    this.idProductoDetalle = id;
    this.cargarConsulta(false);
  }

  esFilaCabeceraSeleccionada(row: KardexTablaFila): boolean {
    return row.idProducto != null && row.idProducto === this.idProductoDetalle;
  }

  descargarExcel(): void {
    if (!this.validarFormulario()) {
      return;
    }
    const p = this.buildParamsConsulta(false);
    this.descargandoExcel = true;
    const nombreDefecto = this.nombreExcelDefecto(p);

    this.contabilidad.descargarExcelKardexGeneral(p).subscribe({
      next: (resp) => {
        this.descargandoExcel = false;
        const blob = resp.body;
        if (!blob || blob.size === 0) {
          this.funciones.showError('El servidor no devolvió un archivo Excel.');
          return;
        }
        let nombre = nombreDefecto;
        const cd = resp.headers.get('Content-Disposition');
        if (cd) {
          const m = /filename\*=UTF-8''([^;\n]+)|filename="([^"]+)"|filename=([^;\n]+)/i.exec(cd);
          const raw = (m?.[1] || m?.[2] || m?.[3] || '').trim();
          if (raw) {
            try {
              nombre = decodeURIComponent(raw);
            } catch {
              nombre = raw;
            }
          }
        }
        saveAs(blob, nombre);
        this.funciones.showSuccess('Descarga de Excel iniciada.');
      },
      error: (err: HttpErrorResponse) => {
        this.descargandoExcel = false;
        void this.mostrarErrorDescargaExcel(err);
      }
    });
  }

  etiquetaColumnaCabecera(key: string): string {
    const idx = this.keysCabecera.indexOf(key);
    if (idx >= 0 && this.cabecerasCabecera[idx]) {
      return this.cabecerasCabecera[idx];
    }
    return key;
  }

  etiquetaColumnaDetalle(key: string): string {
    const idx = this.keysDetalle.indexOf(key);
    if (idx >= 0 && this.cabecerasDetalle[idx]) {
      return this.cabecerasDetalle[idx];
    }
    return key;
  }

  claseFilaDetalle(movimiento: string | undefined): string {
    const t = String(movimiento || '').toUpperCase();
    if (t === 'SALDO INICIAL') {
      return 'fila-saldo-inicial';
    }
    if (t.startsWith('AJUSTE')) {
      return 'fila-ajuste';
    }
    return '';
  }

  private cargarConsulta(limpiarTodo: boolean): void {
    const p = this.buildParamsConsulta(true);
    if (ContabilidadService.aplicaPaginacionKardex(p)) {
      p.page = this.pageActual;
      p.perPage = this.perPage;
    }

    if (limpiarTodo) {
      this.limpiarResultados();
    }

    this.loading = true;
    this.contabilidad.obtenerKardexGeneral(p).subscribe({
      next: (res) => {
        this.loading = false;
        this.procesarRespuesta(res);
      },
      error: (err) => {
        this.loading = false;
        this.mostrarErrorHttp(err);
      }
    });
  }

  private limpiarResultados(): void {
    this.respuesta = null;
    this.paginacion = null;
    this.productoSeleccionado = null;
    this.cabeceraDS.data = [];
    this.detalleDS.data = [];
    this.cabecerasCabecera = [];
    this.cabecerasDetalle = [];
    this.keysCabecera = [];
    this.keysDetalle = [];
    this.displayedColumnsCabecera = [];
    this.displayedColumnsDetalle = [];
  }

  private procesarRespuesta(res: KardexGeneralResponse): void {
    this.respuesta = res;
    this.paginacion = res.paginacion ?? null;
    this.productoSeleccionado = res.producto_seleccionado ?? null;

    if (res.paginacion?.page) {
      this.pageActual = res.paginacion.page;
    }
    if (res.paginacion?.per_page) {
      this.perPage = Math.min(500, res.paginacion.per_page);
    }

    if (this.productoSeleccionado?.id) {
      this.idProductoDetalle = Number(this.productoSeleccionado.id);
    }

    this.armarTablaCabecera(res);
    this.armarTablaDetalle(res);
  }

  private armarTablaCabecera(res: KardexGeneralResponse): void {
    const heads = res.cabeceras_cabecera?.length
      ? res.cabeceras_cabecera
      : this.cabecerasDesdeFilas(res.cabecera);
    this.cabecerasCabecera = heads;
    this.keysCabecera = heads.map((_, i) => 'k' + i);
    this.displayedColumnsCabecera = this.keysCabecera;

    const filas = res.cabecera || [];
    this.cabeceraDS.data = filas.map((f) => this.mapFilaCabecera(f, heads));
  }

  private armarTablaDetalle(res: KardexGeneralResponse): void {
    const filas = res.detalle || [];
    if (!filas.length) {
      this.detalleDS.data = [];
      this.cabecerasDetalle = [];
      this.keysDetalle = [];
      this.displayedColumnsDetalle = [];
      return;
    }

    const heads = res.cabeceras_detalle?.length
      ? res.cabeceras_detalle
      : this.cabecerasDesdeFilasDetalle(filas);
    this.cabecerasDetalle = heads;
    this.keysDetalle = heads.map((_, i) => 'd' + i);
    this.displayedColumnsDetalle = this.keysDetalle;

    this.detalleDS.data = filas.map((f) => this.mapFilaDetalle(f, heads));
  }

  private mapFilaCabecera(f: KardexGeneralCabeceraFila, heads: string[]): KardexTablaFila {
    const row: KardexTablaFila = {
      idProducto: f.producto?.id != null ? Number(f.producto.id) : undefined
    };
    heads.forEach((h, i) => {
      row['k' + i] = this.formatearCelda(h, i, this.valorColumna(f.columnas, h, i));
    });
    return row;
  }

  private mapFilaDetalle(f: KardexGeneralDetalleFila, heads: string[]): KardexTablaFila {
    const row: KardexTablaFila = {};
    heads.forEach((h, i) => {
      row['d' + i] = this.formatearCelda(h, i, this.valorColumna(f.columnas, h, i));
    });
    const idxMov = heads.findIndex((h) => String(h).toUpperCase() === 'MOVIMIENTO');
    if (idxMov >= 0) {
      row.movimiento = String(row['d' + idxMov] ?? '');
    }
    return row;
  }

  private cabecerasDesdeFilas(filas?: KardexGeneralCabeceraFila[]): string[] {
    const f0 = filas?.[0];
    if (f0?.columnas && typeof f0.columnas === 'object') {
      return Object.keys(f0.columnas);
    }
    return [];
  }

  private cabecerasDesdeFilasDetalle(filas: KardexGeneralDetalleFila[]): string[] {
    const f0 = filas[0];
    if (f0?.columnas && typeof f0.columnas === 'object') {
      return Object.keys(f0.columnas);
    }
    return [];
  }

  private valorColumna(
    cols: Record<string, string | number | null> | undefined,
    cabecera: string,
    indice: number
  ): unknown {
    if (!cols || typeof cols !== 'object') {
      return null;
    }
    const cab = String(cabecera || '').trim().toUpperCase();
    const key = Object.keys(cols).find((k) => k.trim().toUpperCase() === cab);
    if (key) {
      return cols[key];
    }
    const keys = Object.keys(cols);
    if (indice >= 0 && indice < keys.length) {
      return cols[keys[indice]];
    }
    return null;
  }

  private formatearCelda(cabecera: string, indice: number, valor: unknown): string {
    if (valor == null) {
      return '';
    }
    const cab = String(cabecera || '').toUpperCase();
    const esFecha = cab.includes('FECHA') || indice === 0;
    if (esFecha && typeof valor === 'number') {
      return formatExcelSerialDate(valor);
    }
    if (typeof valor === 'number') {
      return Number.isInteger(valor) ? String(valor) : valor.toFixed(5).replace(/\.?0+$/, '');
    }
    return String(valor);
  }

  private validarFormulario(): boolean {
    if (this.fg.get('fechaInicio')?.invalid || this.fg.get('fechaFin')?.invalid) {
      this.funciones.showWarning('Indique fecha de inicio y fecha fin.');
      return false;
    }
    const idPv = Number(this.fg.get('idPuntoVenta')?.value);
    if (!idPv || idPv <= 0) {
      this.funciones.showWarning('Seleccione el punto de venta.');
      return false;
    }
    return true;
  }

  private buildParamsConsulta(incluirDetalle: boolean): KardexGeneralConsultaParams {
    const v = this.fg.value;
    const idPv = Number(v.idPuntoVenta);
    const base: KardexGeneralConsultaParams = {
      fechaInicio: v.fechaInicio,
      fechaFin: v.fechaFin,
      idPuntoVenta: idPv,
      idProducto: null,
      codigoBarra: null,
      codigo: null,
      nombre: null,
      incluirSaldoInicial: v.incluirSaldoInicial !== false
    };

    if (incluirDetalle && this.idProductoDetalle != null && this.idProductoDetalle > 0) {
      return { ...base, idProducto: this.idProductoDetalle };
    }

    const codigo = String(v.codigo || '').trim();
    const nombre = String(v.nombre || '').trim();
    if (codigo || nombre) {
      return { ...base, codigo: codigo || null, nombre: nombre || null };
    }

    const codigoBarra = String(v.codigoBarra || '').trim();
    if (
      codigoBarra &&
      this.productoResueltoPorBuscar &&
      this.idProductoResuelto != null &&
      this.idProductoResuelto > 0
    ) {
      return { ...base, idProducto: this.idProductoResuelto };
    }

    if (codigoBarra) {
      return { ...base, codigoBarra };
    }

    return base;
  }

  private nombreExcelDefecto(p: KardexGeneralConsultaParams): string {
    const tieneFiltro = !!(
      (p.idProducto != null && p.idProducto > 0) ||
      (p.codigoBarra && String(p.codigoBarra).trim()) ||
      (p.codigo && String(p.codigo).trim()) ||
      (p.nombre && String(p.nombre).trim())
    );
    if (!tieneFiltro) {
      return `KARDEX_GENERAL_TODOS_${p.fechaInicio}_${p.fechaFin}.xlsx`;
    }
    return `KARDEX_GENERAL_${this.etiquetaProductoArchivo(p)}_${p.fechaInicio}_${p.fechaFin}.xlsx`;
  }

  private etiquetaProductoArchivo(p: KardexGeneralConsultaParams): string {
    if (p.idProducto) {
      return `ID${p.idProducto}`;
    }
    if (p.codigoBarra) {
      return p.codigoBarra.replace(/[^\w.-]+/g, '_');
    }
    const partes = [p.codigo, p.nombre].filter((x) => x && String(x).trim());
    return partes.length ? partes.join('_').replace(/[^\w.-]+/g, '_') : 'filtro';
  }

  private async mostrarErrorDescargaExcel(err: HttpErrorResponse): Promise<void> {
    let msg =
      err?.error?.mensaje ||
      err?.error?.message ||
      'Error al generar el Excel de kardex general.';
    if (err.error instanceof Blob) {
      try {
        const t = await err.error.text();
        const j = JSON.parse(t) as { mensaje?: string; message?: string };
        if (j?.mensaje) {
          msg = j.mensaje;
        } else if (j?.message) {
          msg = j.message;
        }
      } catch {
        /* mantener msg */
      }
    }
    this.funciones.showError(String(msg));
  }

  private mostrarErrorHttp(err: any): void {
    const msg =
      err?.error?.mensaje ||
      err?.error?.message ||
      err?.message ||
      'Error al consultar el kardex general.';
    this.funciones.showError(String(msg));
  }
}
