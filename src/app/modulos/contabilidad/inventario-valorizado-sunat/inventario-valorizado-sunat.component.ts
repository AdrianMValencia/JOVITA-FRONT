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
  InventarioValorizadoConsultaParams,
  InventarioValorizadoFila,
  InventarioValorizadoPaginacion,
  InventarioValorizadoProductoBloque,
  InventarioValorizadoResponse
} from '../contabilidad.service';
import { formatExcelSerialDate } from '../utils/excel-serial-date.util';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import {
  idPuntoVentaDesdeStorage,
  periodoMesActual
} from '../utils/contabilidad-filtros-defaults.util';

export interface InventarioValorizadoTablaFila {
  tipo_operacion?: string;
  [key: string]: string | number | undefined;
}

export interface InventarioValorizadoResumenFila {
  indice: number;
  id?: number;
  codigoBarra?: string;
  nombre?: string;
  si_cantidad?: number;
  si_costo_unitario?: number;
  si_costo_total?: number;
  sf_cantidad?: number;
  sf_costo_unitario?: number;
  sf_costo_total?: number;
  movimientos?: number;
}

@Component({
  selector: 'app-inventario-valorizado-sunat',
  templateUrl: './inventario-valorizado-sunat.component.html',
  styleUrls: ['./inventario-valorizado-sunat.component.css'],
  providers: [PuntosventaService]
})
export class InventarioValorizadoSunatComponent implements OnInit {
  readonly perPageOpciones = [25, 50, 100, 250, 500];

  fg: FormGroup;
  puntosVenta: PuntosVenta[] = [];
  loading = false;
  descargandoExcel = false;
  buscandoProducto = false;

  productoNombre = '';
  idProductoResuelto: number | null = null;
  /** true solo tras pulsar Buscar con código de barras válido */
  productoResueltoPorBuscar = false;

  modo: 'producto_unico' | 'todos_productos' | null = null;
  resumen: InventarioValorizadoResponse | null = null;
  paginacion: InventarioValorizadoPaginacion | null = null;
  bloquesProductos: InventarioValorizadoProductoBloque[] = [];
  indiceProductoActivo = -1;
  bloqueActivo: InventarioValorizadoProductoBloque | null = null;

  pageActual = 1;
  perPage = 100;

  listaProductosColumns: string[] = [
    'codigoBarra',
    'nombre',
    'id',
    'si_cantidad',
    'si_costo_unitario',
    'si_costo_total',
    'sf_cantidad',
    'sf_costo_unitario',
    'sf_costo_total',
    'movimientos'
  ];
  listaProductosDS = new MatTableDataSource<InventarioValorizadoResumenFila>([]);

  cabeceras: string[] = [];
  keysColumnas: string[] = [];
  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource<InventarioValorizadoTablaFila>([]);

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

  get esModoTodos(): boolean {
    return this.modo === 'todos_productos';
  }

  get paginatorLength(): number {
    return this.paginacion?.total_productos ?? this.resumen?.total_productos ?? 0;
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
    this.indiceProductoActivo = -1;
    this.limpiarResultados();
  }

  consultar(): void {
    if (!this.validarFormulario()) {
      return;
    }
    this.pageActual = 1;
    this.cargarConsulta(true);
  }

  onPaginatorChange(event: PageEvent): void {
    this.pageActual = event.pageIndex + 1;
    this.perPage = Math.min(500, event.pageSize);
    this.cargarConsulta(false);
  }

  descargarExcel(): void {
    if (!this.validarFormulario()) {
      return;
    }
    const p = this.buildParamsConsulta();
    this.descargandoExcel = true;
    const nombreDefecto = this.nombreExcelDefecto(p);

    this.contabilidad.descargarExcelInventarioValorizado(p).subscribe({
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

  seleccionarProductoDesdeLista(fila: InventarioValorizadoResumenFila): void {
    this.mostrarBloqueProducto(fila.indice);
  }

  esFilaProductoSeleccionada(fila: InventarioValorizadoResumenFila): boolean {
    return fila.indice === this.indiceProductoActivo;
  }

  private cargarConsulta(limpiarTodo: boolean): void {
    const p = this.buildParamsConsulta();
    if (ContabilidadService.aplicaPaginacionInventario(p)) {
      p.page = this.pageActual;
      p.perPage = this.perPage;
    }

    if (limpiarTodo) {
      this.limpiarResultados();
    } else {
      this.bloqueActivo = null;
      this.indiceProductoActivo = -1;
      this.dataSource.data = [];
    }

    this.loading = true;
    this.contabilidad.obtenerInventarioValorizado(p).subscribe({
      next: (res) => {
        this.loading = false;
        this.procesarRespuestaConsulta(res);
      },
      error: (err) => {
        this.loading = false;
        this.mostrarErrorHttp(err);
      }
    });
  }

  private limpiarResultados(): void {
    this.resumen = null;
    this.paginacion = null;
    this.modo = null;
    this.bloquesProductos = [];
    this.bloqueActivo = null;
    this.indiceProductoActivo = -1;
    this.listaProductosDS.data = [];
    this.dataSource.data = [];
    this.cabeceras = [];
    this.keysColumnas = [];
    this.displayedColumns = [];
  }

  private procesarRespuestaConsulta(res: InventarioValorizadoResponse): void {
    const normalizada = this.normalizarRespuesta(res);
    this.resumen = normalizada;
    this.paginacion = normalizada.paginacion ?? null;

    if (normalizada.paginacion?.page) {
      this.pageActual = normalizada.paginacion.page;
    }
    if (normalizada.paginacion?.per_page) {
      this.perPage = Math.min(500, normalizada.paginacion.per_page);
    }

    if (this.esRespuestaTodosProductos(normalizada)) {
      this.modo = 'todos_productos';
      this.bloquesProductos = normalizada.productos || [];
      if (!this.bloquesProductos.length) {
        this.bloqueActivo = null;
        this.dataSource.data = [];
        this.listaProductosDS.data = [];
        return;
      }
      this.armarListaProductos();
      return;
    }

    this.modo = (normalizada.modo as 'producto_unico') || 'producto_unico';
    this.bloquesProductos = [];
    this.bloqueActivo = null;
    this.listaProductosDS.data = [];
    if (normalizada.producto?.nombre) {
      this.productoNombre = normalizada.producto.nombre;
    }
    if (normalizada.producto?.id) {
      this.idProductoResuelto = Number(normalizada.producto.id);
    }
    this.armarTabla(normalizada);
  }

  private normalizarRespuesta(res: InventarioValorizadoResponse): InventarioValorizadoResponse {
    if (res.modo === 'producto_unico' || (res.producto && (res.filas?.length || res.total_registros != null))) {
      return res;
    }
    if (res.productos?.length === 1 && !res.paginacion) {
      const b = res.productos[0];
      return {
        ...res,
        modo: 'producto_unico',
        producto: b.producto ?? res.producto,
        saldo_inicial: b.saldo_inicial ?? res.saldo_inicial,
        saldo_final: b.saldo_final ?? res.saldo_final,
        filas: b.filas ?? res.filas,
        cabeceras: b.cabeceras?.length ? b.cabeceras : res.cabeceras,
        total_registros: b.total_registros ?? res.total_registros
      };
    }
    return res;
  }

  private esRespuestaTodosProductos(res: InventarioValorizadoResponse): boolean {
    if (res.modo === 'producto_unico') {
      return false;
    }
    if (res.modo === 'todos_productos') {
      return true;
    }
    if (res.paginacion) {
      return true;
    }
    if (res.filas?.length) {
      return false;
    }
    return !!(res.productos && res.productos.length > 0);
  }

  private armarListaProductos(): void {
    this.bloqueActivo = null;
    this.indiceProductoActivo = -1;
    this.dataSource.data = [];
    this.cabeceras = [];
    this.keysColumnas = [];
    this.displayedColumns = [];

    this.listaProductosDS.data = this.bloquesProductos.map((bloque, indice) => ({
      indice,
      id: bloque.producto?.id,
      codigoBarra: bloque.producto?.codigoBarra ?? '',
      nombre: bloque.producto?.nombre ?? '',
      si_cantidad: bloque.saldo_inicial?.cantidad,
      si_costo_unitario: bloque.saldo_inicial?.costo_unitario,
      si_costo_total: bloque.saldo_inicial?.costo_total,
      sf_cantidad: bloque.saldo_final?.cantidad,
      sf_costo_unitario: bloque.saldo_final?.costo_unitario,
      sf_costo_total: bloque.saldo_final?.costo_total,
      movimientos: bloque.total_registros ?? bloque.filas?.length ?? 0
    }));
  }

  private mostrarBloqueProducto(indice: number): void {
    if (indice < 0 || indice >= this.bloquesProductos.length) {
      return;
    }
    this.indiceProductoActivo = indice;
    const bloque = this.bloquesProductos[indice];
    this.bloqueActivo = bloque;
    const resTabla: InventarioValorizadoResponse = {
      cabeceras: bloque.cabeceras?.length ? bloque.cabeceras : this.resumen?.cabeceras,
      filas: bloque.filas,
      producto: bloque.producto,
      saldo_inicial: bloque.saldo_inicial,
      saldo_final: bloque.saldo_final,
      total_registros: bloque.total_registros
    };
    this.armarTabla(resTabla);
  }

  formatoSaldo(valor: number | null | undefined): string {
    if (valor == null || Number.isNaN(Number(valor))) {
      return '—';
    }
    const n = Number(valor);
    return Number.isInteger(n) ? String(n) : n.toFixed(5).replace(/\.?0+$/, '');
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

  private tieneFiltroProductoEnParams(p: InventarioValorizadoConsultaParams): boolean {
    return !!(
      (p.idProducto != null && p.idProducto > 0) ||
      (p.codigoBarra && String(p.codigoBarra).trim()) ||
      (p.codigo && String(p.codigo).trim()) ||
      (p.nombre && String(p.nombre).trim())
    );
  }

  private buildParamsConsulta(): InventarioValorizadoConsultaParams {
    const v = this.fg.value;
    const idPv = Number(v.idPuntoVenta);
    const base: InventarioValorizadoConsultaParams = {
      fechaInicio: v.fechaInicio,
      fechaFin: v.fechaFin,
      idPuntoVenta: idPv,
      idProducto: null,
      codigoBarra: null,
      codigo: null,
      nombre: null,
      incluirSaldoInicial: v.incluirSaldoInicial !== false
    };

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

  private nombreExcelDefecto(p: InventarioValorizadoConsultaParams): string {
    if (!this.tieneFiltroProductoEnParams(p)) {
      return `INVENTARIO_VALORIZADO_SUNAT_TODOS_${p.fechaInicio}_${p.fechaFin}.xlsx`;
    }
    return `INVENTARIO_VALORIZADO_SUNAT_${this.etiquetaProductoArchivo(p)}_${p.fechaInicio}_${p.fechaFin}.xlsx`;
  }

  private etiquetaProductoArchivo(p: InventarioValorizadoConsultaParams): string {
    if (p.idProducto) {
      return `ID${p.idProducto}`;
    }
    if (p.codigoBarra) {
      return p.codigoBarra.replace(/[^\w.-]+/g, '_');
    }
    const partes = [p.codigo, p.nombre].filter((x) => x && String(x).trim());
    return partes.length ? partes.join('_').replace(/[^\w.-]+/g, '_') : 'producto';
  }

  private armarTabla(res: InventarioValorizadoResponse): void {
    const heads = res.cabeceras?.length ? res.cabeceras : this.cabecerasPorDefecto(res);
    this.cabeceras = heads;
    this.keysColumnas = heads.map((_, i) => 'k' + i);
    this.displayedColumns = ['tipo_operacion', ...this.keysColumnas];

    const filas = res.filas || [];
    const data: InventarioValorizadoTablaFila[] = filas.map((f: InventarioValorizadoFila) => {
      const row: InventarioValorizadoTablaFila = {
        tipo_operacion: f.tipo_operacion
      };
      heads.forEach((h, i) => {
        row['k' + i] = this.formatearCelda(h, i, this.valorCeldaFila(f, h, i));
      });
      return row;
    });
    this.dataSource.data = data;
  }

  private valorCeldaFila(f: InventarioValorizadoFila, cabecera: string, indice: number): unknown {
    const celdas = f.celdas;
    if (celdas?.length && indice < celdas.length && celdas[indice] != null && celdas[indice] !== '') {
      return celdas[indice];
    }
    const cols = f.columnas;
    if (!cols || typeof cols !== 'object') {
      return celdas?.[indice] ?? null;
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
    const esFecha = indice === 0 || String(cabecera || '').toUpperCase() === 'FECHA';
    if (esFecha && typeof valor === 'number') {
      return formatExcelSerialDate(valor);
    }
    if (typeof valor === 'number') {
      return Number.isInteger(valor) ? String(valor) : valor.toFixed(5).replace(/\.?0+$/, '');
    }
    return String(valor);
  }

  private cabecerasPorDefecto(res: InventarioValorizadoResponse): string[] {
    const f0 = res.filas?.[0];
    if (f0?.columnas && typeof f0.columnas === 'object') {
      return Object.keys(f0.columnas);
    }
    const n = f0?.celdas?.length || 14;
    return Array.from({ length: n }, (_, i) => 'C' + String(i + 1).padStart(2, '0'));
  }

  private async mostrarErrorDescargaExcel(err: HttpErrorResponse): Promise<void> {
    let msg =
      err?.error?.mensaje ||
      err?.error?.message ||
      'Error al generar el Excel de inventario valorizado.';
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
      'Error al consultar el reporte.';
    this.funciones.showError(String(msg));
  }

  etiquetaColumna(key: string): string {
    if (key === 'tipo_operacion') {
      return 'Tipo operación';
    }
    const idx = this.keysColumnas.indexOf(key);
    if (idx >= 0 && this.cabeceras[idx]) {
      return this.cabeceras[idx];
    }
    return key;
  }

  claseFila(tipo: string | undefined): string {
    const t = String(tipo || '').toUpperCase();
    if (t === 'SALDO INICIAL') {
      return 'fila-saldo-inicial';
    }
    if (t.startsWith('AJUSTE')) {
      return 'fila-ajuste';
    }
    return '';
  }
}
