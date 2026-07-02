import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

export interface ComprobanteFilter {
  tipo?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  cliente?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Filtro estado en GET /api/efact/emisiones (backend):
 * - pendiente: falta cierre OSE/SUNAT o sin ticket
 * - proceso | en_proceso | con_ticket: hay ticket, pendiente validación
 * - completado | emitido | enviado: ya cerrado según estado
 * - todos
 */
export type EfactListadoEstado =
  | 'pendiente'
  | 'proceso'
  | 'en_proceso'
  | 'con_ticket'
  | 'completado'
  | 'emitido'
  | 'enviado'
  | 'todos'
  | string;

export interface EfactFilter {
  idPuntoVenta?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  cliente?: string;
  modoListado?: 'emitidos' | 'pendientes';
  estado?: EfactListadoEstado;
  origen?: 'recibo' | 'comprobante' | 'todos';
  page?: number;
  pageSize?: number;
}

export interface ComprobanteItem {
  id: number;
  origen?: 'recibo' | 'comprobante';
  idPuntoVenta?: number;
  puntoVentaNombre?: string;
  serie?: string;
  tipo: string;
  fecha: string;
  numero: string | number;
  cliente: string;
  total: number;
  // adicional: código asociado con la factura
  codigo?: string;
  idTipoCambio?: number;
  tipoCambio?: number;
  igv?: number;
  subTotal?: number;
  idMoneda?: number;
  // OSE eFact
  efact_ticket?: string | null;
  /** Ticket POS (serie_ticket + numero_ticket); no CPE. */
  ticket_pos?: { serie?: string; numeracion?: string; texto?: string } | null;
  /** CPE SUNAT; copia de comprobante_electronico cuando aplica. */
  cpe_sunat?: { serie?: string; numero?: string; comprobante?: string } | null;
  comprobante_electronico?: { serie?: string; numero?: string; comprobante?: string } | null;
  comprobante_emitido?: string | null;
  /** Serie–número del ticket POS (texto listo; redundante con ticket_pos.texto). */
  enumeracion_ticket?: string | null;
  serie_ticket?: string;
  numero_ticket?: string | number;
  /** Texto canónico / combinado según backend */
  efact_estado?: string;
  /** Columnas explícitas cuando existen en BD */
  estado_ose?: string;
  estado_sunat?: string;
  emitirEfact?: boolean;
  puede_descargar?: boolean;
  pendiente_emision?: boolean;
  /** true cuando OSE/SUNAT cerraron el ciclo del CPE (según backend). */
  cpe_cerrado_sunat_ose?: boolean | null;
  seleccionable?: boolean;
  resultadoLote?: {
    ok?: boolean;
    omitido?: boolean;
    error?: string | null;
    motivo?: string;
    agrupado?: boolean;
    comprobanteAgrupado?: string;
  };
}

export interface ComprobantePage {
  items: ComprobanteItem[];
  total: number;
  page?: number;
  pageSize?: number;
  nota?: string;
  status?: number;
}

export interface TipoDocumento {
  id: number;
  documento: string;
}

export interface EfactLoteItem {
  origen: 'recibo' | 'comprobante';
  id: number;
  /** Ticket OSE (UUID); recomendado para PDF/CDR y sincronización cuando origen=recibo. */
  efact_ticket?: string | null;
  /** Alias que algunos backends esperan en JSON. */
  ticket?: string | null;
}

export interface EfactLoteRequest {
  items: EfactLoteItem[];
  reintentar?: boolean;
  /** Varios tickets POS → un solo CPE SUNAT en emisión masiva. */
  agrupar_en_un_comprobante?: boolean;
  un_solo_comprobante?: boolean;
}

export interface EfactLoteResultado {
  index: number;
  origen: 'recibo' | 'comprobante';
  id: number;
  ok: boolean;
  omitido?: boolean;
  motivo?: string;
  error?: string | null;
  efact_ticket?: string;
  efact_response?: any;
}

export interface EfactLoteResponse {
  resultados: EfactLoteResultado[];
  resumen: {
    total: number;
    errores: number;
  };
  comprobante_agrupado?: {
    serie?: string;
    numero?: string | number;
    comprobante?: string;
    efact_ticket?: string;
  };
  tickets_agrupados?: Array<{ origen?: 'recibo' | 'comprobante'; id?: number }>;
  mensaje?: string;
  status?: number;
}

/** POST /api/efact/sincronizar-estados — consulta CDR/ticket en OSE y actualiza estados en BD. */
export interface EfactSincronizarEstadosRequest {
  items: EfactLoteItem[];
  /** Opcional: si el backend lo usa para limitar trabajo por request. */
  limite?: number;
}

export interface EfactSincronizarEstadoResultado {
  index?: number;
  origen?: string;
  id?: number;
  ok?: boolean;
  error?: string | null;
  nota?: string | null;
  motivo?: string | null;
  mensaje?: string | null;
  [key: string]: unknown;
}

export interface EfactSincronizarEstadosResponse {
  resultados?: EfactSincronizarEstadoResultado[];
  mensaje?: string;
  status?: number;
}

@Injectable({ providedIn: 'root' })
export class ComprobantesService {
  private baseUrl = environment.BASE_URL + 'comprobantes';
  private efactBaseUrl = environment.BASE_URL + 'efact';

  constructor(private http: HttpClient) {}

  list(filters: ComprobanteFilter): Observable<ComprobantePage> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });
    return this.http.get<ComprobantePage>(this.baseUrl, { params });
  }

  /**
   * Tipos de comprobantes disponibles para filtro/selección.
   */
  getTipos(): Observable<TipoDocumento[]> {
    return this.http.get<TipoDocumento[]>(`${this.baseUrl}/tipos`);
  }

  /**
   * Lista de tipos de documento (RUC, DNI, etc.) según NUBEFact.
   */
  getTiposDocumento(): Observable<{tipos:{codigo:string,descripcion:string}[]}> {
    return this.http.get<{tipos:{codigo:string,descripcion:string}[]}>(`${this.baseUrl}/tipos-documento`);
  }

  obtenerSeries(idPuntoVenta?: number): Observable<{ series: string[] }> {
    let params = new HttpParams();
    if (idPuntoVenta !== undefined && idPuntoVenta !== null) {
      params = params.set('idPuntoVenta', idPuntoVenta.toString());
    }
    return this.http.get<{ series: string[] }>(`${this.baseUrl}/series`, { params });
  }

  /**
   * Devuelve la numeración siguiente para la serie indicada.
   */
  getNumeracion(serie: string, idPuntoVenta?: number): Observable<{serie:string,siguiente:number,idSerie?:number,idNumeracion?:number}> {
    let params = new HttpParams().set('serie', serie);
    if (idPuntoVenta !== undefined && idPuntoVenta !== null) {
      params = params.set('idPuntoVenta', idPuntoVenta.toString());
    }
    return this.http.get<{serie:string,siguiente:number,idSerie?:number,idNumeracion?:number}>(`${this.baseUrl}/numeracion`, { params });
  }

  /**
   * Crea un comprobante con cabecera y detalle en backend.
   * El backend espera payload: { cabecera: {...}, detalle: [...] }
   * El backend emite automáticamente a la OSE eFact.
   */
  createComprobante(cabecera: any, detalle: any[]): Observable<any> {
    const payload = { cabecera, detalle };
    return this.http.post<any>(`${this.baseUrl}`, payload);
  }

  /**
   * Reintenta emitir un comprobante ya existente a la OSE eFact.
   */
  emitirEfact(cabecera: any, detalle: any[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/efact`, { cabecera, detalle });
  }

  /**
   * Obtiene el CDR (Constancia de Recepción) de la OSE para un comprobante.
   */
  obtenerCdr(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}/cdr`);
  }

  /**
   * Obtiene el XML firmado (base64) de un comprobante.
   */
  obtenerXml(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}/xml`);
  }

  /**
   * Obtiene el PDF (base64) de un comprobante.
   */
  obtenerPdf(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}/pdf`);
  }

  listEfactEmisiones(filters: EfactFilter): Observable<ComprobantePage> {
    let params = new HttpParams();
    Object.keys(filters || {}).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });
    return this.http.get<ComprobantePage>(`${this.efactBaseUrl}/emisiones`, { params });
  }

  emitirLoteEfact(payload: EfactLoteRequest): Observable<EfactLoteResponse> {
    return this.http.post<EfactLoteResponse>(`${this.efactBaseUrl}/emision-lote`, payload);
  }

  sincronizarEstadosEfact(
    payload: EfactSincronizarEstadosRequest
  ): Observable<EfactSincronizarEstadosResponse> {
    return this.http.post<EfactSincronizarEstadosResponse>(
      `${this.efactBaseUrl}/sincronizar-estados`,
      payload
    );
  }

  descargarCdrPorTicket(ticket: string): Observable<Blob> {
    return this.http.get(`${this.efactBaseUrl}/cdr/${encodeURIComponent(ticket)}`, {
      responseType: 'blob'
    });
  }

  descargarXmlPorTicket(ticket: string): Observable<Blob> {
    return this.http.get(`${this.efactBaseUrl}/xml/${encodeURIComponent(ticket)}`, {
      responseType: 'blob'
    });
  }

  descargarPdfPorTicket(ticket: string): Observable<Blob> {
    return this.http.get(`${this.efactBaseUrl}/pdf/${encodeURIComponent(ticket)}`, {
      responseType: 'blob'
    });
  }

  /**
   * GET /api/efact/{cdr|xml|pdf}?origen=recibo|comprobante&id=... [&ticket=...]
   * Si no hay ticket resoluble, el backend responde 404 JSON.
   */
  descargarEfactPorQuery(
    tipo: 'cdr' | 'xml' | 'pdf',
    opts: { origen: 'recibo' | 'comprobante'; id: number; ticket?: string | null }
  ): Observable<Blob> {
    let params = new HttpParams().set('origen', opts.origen).set('id', String(opts.id));
    const t = opts.ticket != null ? String(opts.ticket).trim() : '';
    if (t) {
      params = params.set('ticket', t);
    }
    return this.http.get(`${this.efactBaseUrl}/${tipo}`, { params, responseType: 'blob' });
  }
}
