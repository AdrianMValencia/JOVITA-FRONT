import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface RceComprasPeriodo {
  fechaInicio?: string;
  fechaFin?: string;
  idPuntoVenta?: number | null;
  solo_activas?: boolean;
}

export interface RceComprasFila {
  compra_id?: number;
  id_punto_venta?: number;
  columnas?: Record<string, string>;
  celdas?: string[];
}

export interface RceComprasResponse {
  reporte?: string;
  cabeceras?: string[];
  periodo?: RceComprasPeriodo;
  total_registros?: number;
  filas?: RceComprasFila[];
  status?: number;
  mensaje?: string;
  message?: string;
}

/** Fila RVIE (registro de ventas electrónico). */
export interface RvieVentasFila {
  recibo_id?: number;
  id_punto_venta?: number;
  columnas?: Record<string, string | number | boolean | null>;
  celdas?: (string | number | boolean | null)[];
}

export interface RvieVentasResponse {
  reporte?: string;
  cabeceras?: string[];
  periodo?: RceComprasPeriodo;
  total_registros?: number;
  filas?: RvieVentasFila[];
  status?: number;
  mensaje?: string;
  message?: string;
}

export interface RceComprasConsultaParams {
  fechaInicio: string;
  fechaFin: string;
  idPuntoVenta?: number | null;
  /** Por defecto true (solo_activas=1). */
  soloActivas?: boolean;
}

export interface InventarioValorizadoProducto {
  id?: number;
  codigoBarra?: string;
  nombre?: string;
  idPuntoVenta?: number;
}

export interface InventarioValorizadoSaldo {
  cantidad?: number;
  costo_unitario?: number;
  costo_total?: number;
}

export interface InventarioValorizadoFila {
  tipo_operacion?: string;
  columnas?: Record<string, string | number | null>;
  celdas?: (string | number | null)[];
}

export interface InventarioValorizadoProductoBloque {
  producto?: InventarioValorizadoProducto;
  saldo_inicial?: InventarioValorizadoSaldo;
  saldo_final?: InventarioValorizadoSaldo;
  total_registros?: number;
  filas?: InventarioValorizadoFila[];
  cabeceras?: string[];
}

export interface InventarioValorizadoPaginacion {
  page?: number;
  per_page?: number;
  total_productos?: number;
  total_paginas?: number;
  productos_en_pagina?: number;
  tiene_siguiente?: boolean;
  tiene_anterior?: boolean;
}

export interface InventarioValorizadoResponse {
  reporte?: string;
  modo?: 'producto_unico' | 'todos_productos' | string;
  cabeceras?: string[];
  producto?: InventarioValorizadoProducto;
  periodo?: RceComprasPeriodo;
  saldo_inicial?: InventarioValorizadoSaldo;
  saldo_final?: InventarioValorizadoSaldo;
  total_registros?: number;
  total_productos?: number;
  paginacion?: InventarioValorizadoPaginacion;
  filas?: InventarioValorizadoFila[];
  productos?: InventarioValorizadoProductoBloque[];
  status?: number;
  mensaje?: string;
  message?: string;
}

export interface InventarioValorizadoConsultaParams {
  fechaInicio: string;
  fechaFin: string;
  idPuntoVenta: number;
  /** Prioridad máxima en el backend. */
  idProducto?: number | null;
  /** Coincidencia exacta en codigoBarra. */
  codigoBarra?: string | null;
  /** Búsqueda parcial en codigoBarra (LIKE %codigo%). */
  codigo?: string | null;
  /** Búsqueda parcial en nombre (LIKE %nombre%). */
  nombre?: string | null;
  /** Por defecto true (1). */
  incluirSaldoInicial?: boolean;
  /** Solo listado JSON; ignorado en Excel y con idProducto/codigoBarra exacto. */
  page?: number;
  perPage?: number;
}

@Injectable({ providedIn: 'root' })
export class ContabilidadService {
  private readonly apiBase = environment.BASE_URL.replace(/\/?$/, '/');

  constructor(private http: HttpClient) {}

  /** Query común a RCE compras y RVIE ventas (fechaInicio/fechaFin obligatorios; resto opcional). */
  private buildConsultaReporteParams(p: RceComprasConsultaParams): HttpParams {
    let params = new HttpParams().set('fechaInicio', p.fechaInicio).set('fechaFin', p.fechaFin);
    if (p.idPuntoVenta != null && String(p.idPuntoVenta) !== '') {
      params = params.set('idPuntoVenta', String(p.idPuntoVenta));
    }
    const activas = p.soloActivas !== false;
    params = params.set('solo_activas', activas ? '1' : '0');
    return params;
  }

  obtenerRceCompras(p: RceComprasConsultaParams): Observable<RceComprasResponse> {
    return this.http.get<RceComprasResponse>(`${this.apiBase}contabilidad/rce-compras`, {
      params: this.buildConsultaReporteParams(p)
    });
  }

  obtenerRvieVentas(p: RceComprasConsultaParams): Observable<RvieVentasResponse> {
    return this.http.get<RvieVentasResponse>(`${this.apiBase}contabilidad/rvie-ventas`, {
      params: this.buildConsultaReporteParams(p)
    });
  }

  /**
   * Excel con plantilla COMPRAS.xlsx (SUNAT); conserva formato del template en el backend.
   */
  descargarExcelRceCompras(p: RceComprasConsultaParams): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiBase}contabilidad/rce-compras/excel`, {
      params: this.buildConsultaReporteParams(p),
      responseType: 'blob',
      observe: 'response'
    });
  }

  /**
   * Excel con plantilla VENTAS.xlsx (SUNAT); conserva formato del template en el backend.
   */
  descargarExcelRvieVentas(p: RceComprasConsultaParams): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiBase}contabilidad/rvie-ventas/excel`, {
      params: this.buildConsultaReporteParams(p),
      responseType: 'blob',
      observe: 'response'
    });
  }

  /** Sin paginación: idProducto o codigoBarra exacto. */
  static aplicaPaginacionInventario(p: InventarioValorizadoConsultaParams): boolean {
    if (p.idProducto != null && p.idProducto > 0) {
      return false;
    }
    const codigoBarra = p.codigoBarra != null ? String(p.codigoBarra).trim() : '';
    return !codigoBarra;
  }

  private buildInventarioValorizadoParams(
    p: InventarioValorizadoConsultaParams,
    incluirPagina = true
  ): HttpParams {
    let params = new HttpParams()
      .set('fechaInicio', p.fechaInicio)
      .set('fechaFin', p.fechaFin)
      .set('idPuntoVenta', String(p.idPuntoVenta))
      .set('incluirSaldoInicial', p.incluirSaldoInicial === false ? '0' : '1');
    if (p.idProducto != null && p.idProducto > 0) {
      return params.set('idProducto', String(p.idProducto));
    }
    const codigoBarra = p.codigoBarra != null ? String(p.codigoBarra).trim() : '';
    if (codigoBarra) {
      return params.set('codigoBarra', codigoBarra);
    }
    const codigo = p.codigo != null ? String(p.codigo).trim() : '';
    const nombre = p.nombre != null ? String(p.nombre).trim() : '';
    if (codigo) {
      params = params.set('codigo', codigo);
    }
    if (nombre) {
      params = params.set('nombre', nombre);
    }
    if (incluirPagina && ContabilidadService.aplicaPaginacionInventario(p)) {
      const page = Math.max(1, p.page ?? 1);
      const perPage = Math.min(500, Math.max(1, p.perPage ?? 100));
      params = params.set('page', String(page)).set('per_page', String(perPage));
    }
    return params;
  }

  obtenerInventarioValorizado(
    p: InventarioValorizadoConsultaParams
  ): Observable<InventarioValorizadoResponse> {
    return this.http.get<InventarioValorizadoResponse>(
      `${this.apiBase}contabilidad/inventario-valorizado`,
      { params: this.buildInventarioValorizadoParams(p) }
    );
  }

  descargarExcelInventarioValorizado(
    p: InventarioValorizadoConsultaParams
  ): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiBase}contabilidad/inventario-valorizado/excel`, {
      params: this.buildInventarioValorizadoParams(p, false),
      responseType: 'blob',
      observe: 'response'
    });
  }

  /** --- Kardex general --- */

  static aplicaPaginacionKardex(p: KardexGeneralConsultaParams): boolean {
    const codigoBarra = p.codigoBarra != null ? String(p.codigoBarra).trim() : '';
    return !codigoBarra;
  }

  private buildKardexGeneralParams(p: KardexGeneralConsultaParams, incluirPagina = true): HttpParams {
    let params = new HttpParams()
      .set('fechaInicio', p.fechaInicio)
      .set('fechaFin', p.fechaFin)
      .set('idPuntoVenta', String(p.idPuntoVenta))
      .set('incluirSaldoInicial', p.incluirSaldoInicial === false ? '0' : '1');

    if (p.idProducto != null && p.idProducto > 0) {
      params = params.set('idProducto', String(p.idProducto));
      if (incluirPagina && ContabilidadService.aplicaPaginacionKardex(p)) {
        const page = Math.max(1, p.page ?? 1);
        const perPage = Math.min(500, Math.max(1, p.perPage ?? 100));
        params = params.set('page', String(page)).set('per_page', String(perPage));
      }
      return params;
    }

    const codigoBarra = p.codigoBarra != null ? String(p.codigoBarra).trim() : '';
    if (codigoBarra) {
      params = params.set('codigoBarra', codigoBarra);
    } else {
      const codigo = p.codigo != null ? String(p.codigo).trim() : '';
      const nombre = p.nombre != null ? String(p.nombre).trim() : '';
      if (codigo) {
        params = params.set('codigo', codigo);
      }
      if (nombre) {
        params = params.set('nombre', nombre);
      }
    }

    if (incluirPagina && ContabilidadService.aplicaPaginacionKardex(p)) {
      const page = Math.max(1, p.page ?? 1);
      const perPage = Math.min(500, Math.max(1, p.perPage ?? 100));
      params = params.set('page', String(page)).set('per_page', String(perPage));
    }
    return params;
  }

  obtenerKardexGeneral(p: KardexGeneralConsultaParams): Observable<KardexGeneralResponse> {
    return this.http.get<KardexGeneralResponse>(`${this.apiBase}contabilidad/kardex-general`, {
      params: this.buildKardexGeneralParams(p)
    });
  }

  descargarExcelKardexGeneral(p: KardexGeneralConsultaParams): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiBase}contabilidad/kardex-general/excel`, {
      params: this.buildKardexGeneralParams(p, false),
      responseType: 'blob',
      observe: 'response'
    });
  }
}

export interface KardexGeneralProducto {
  id?: number;
  codigoBarra?: string;
  nombre?: string;
  categoria?: string;
  um?: string;
  idPuntoVenta?: number;
}

export interface KardexGeneralCabeceraFila {
  producto?: KardexGeneralProducto;
  columnas?: Record<string, string | number | null>;
}

export interface KardexGeneralDetalleFila {
  producto?: KardexGeneralProducto;
  columnas?: Record<string, string | number | null>;
}

export interface KardexGeneralPeriodo {
  fechaInicio?: string;
  fechaFin?: string;
  idPuntoVenta?: number;
  incluir_saldo_inicial?: boolean;
}

export interface KardexGeneralConsultaParams {
  fechaInicio: string;
  fechaFin: string;
  idPuntoVenta: number;
  codigo?: string | null;
  nombre?: string | null;
  idProducto?: number | null;
  codigoBarra?: string | null;
  incluirSaldoInicial?: boolean;
  page?: number;
  perPage?: number;
}

export interface KardexGeneralResponse {
  reporte?: string;
  cabeceras_cabecera?: string[];
  cabeceras_detalle?: string[];
  periodo?: KardexGeneralPeriodo;
  filtros?: Record<string, string | number | null>;
  paginacion?: InventarioValorizadoPaginacion;
  producto_seleccionado?: KardexGeneralProducto | null;
  cabecera?: KardexGeneralCabeceraFila[];
  detalle?: KardexGeneralDetalleFila[];
  total_detalle_registros?: number;
  status?: number;
  mensaje?: string;
  message?: string;
}
