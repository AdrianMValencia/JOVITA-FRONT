import {
  RceComprasFila,
  RceComprasResponse,
  RvieVentasFila,
  RvieVentasResponse
} from '../contabilidad.service';

export interface TablaSireFila {
  registro_id?: number;
  id_punto_venta?: number;
  [key: string]: string | number | undefined;
}

export interface TablaSireEstado {
  cabeceras: string[];
  keysColumnas: string[];
  displayedColumns: string[];
  data: TablaSireFila[];
}

function cabecerasPorDefecto(n: number): string[] {
  const cols = n > 0 ? n : 40;
  return Array.from({ length: cols }, (_, i) => 'C' + String(i + 1).padStart(2, '0'));
}

export function mergeRceComprasResponses(
  responses: RceComprasResponse[],
  etiquetaReporte?: string
): RceComprasResponse {
  const cabeceras =
    responses.find((r) => r.cabeceras && r.cabeceras.length)?.cabeceras ||
    cabecerasPorDefecto(responses.find((r) => r.filas?.length)?.filas?.[0]?.celdas?.length || 40);
  const filas = responses.flatMap((r) => r.filas || []);
  return {
    reporte: etiquetaReporte || responses[0]?.reporte || 'RCE — Compras',
    cabeceras,
    periodo: responses[0]?.periodo,
    total_registros: filas.length,
    filas
  };
}

export function mergeRvieVentasResponses(
  responses: RvieVentasResponse[],
  etiquetaReporte?: string
): RvieVentasResponse {
  const cabeceras =
    responses.find((r) => r.cabeceras && r.cabeceras.length)?.cabeceras ||
    cabecerasPorDefecto(responses.find((r) => r.filas?.length)?.filas?.[0]?.celdas?.length || 40);
  const filas = responses.flatMap((r) => r.filas || []);
  return {
    reporte: etiquetaReporte || responses[0]?.reporte || 'RVIE — Ventas',
    cabeceras,
    periodo: responses[0]?.periodo,
    total_registros: filas.length,
    filas
  };
}

export function armarTablaRce(res: RceComprasResponse): TablaSireEstado {
  const heads =
    res.cabeceras && res.cabeceras.length
      ? res.cabeceras
      : cabecerasPorDefecto(res.filas?.[0]?.celdas?.length || 40);
  const keysColumnas = heads.map((_, i) => 'k' + i);
  const displayedColumns = ['registro_id', 'id_punto_venta', ...keysColumnas];
  const data: TablaSireFila[] = (res.filas || []).map((f: RceComprasFila) => {
    const row: TablaSireFila = {
      registro_id: f.compra_id,
      id_punto_venta: f.id_punto_venta
    };
    heads.forEach((_, i) => {
      row['k' + i] = f.celdas?.[i] != null ? String(f.celdas[i]) : '';
    });
    return row;
  });
  return { cabeceras: heads, keysColumnas, displayedColumns, data };
}

export function armarTablaRvie(res: RvieVentasResponse): TablaSireEstado {
  const heads =
    res.cabeceras && res.cabeceras.length
      ? res.cabeceras
      : cabecerasPorDefecto(res.filas?.[0]?.celdas?.length || 40);
  const keysColumnas = heads.map((_, i) => 'k' + i);
  const displayedColumns = ['registro_id', 'id_punto_venta', ...keysColumnas];
  const data: TablaSireFila[] = (res.filas || []).map((f: RvieVentasFila) => {
    const row: TablaSireFila = {
      registro_id: f.recibo_id,
      id_punto_venta: f.id_punto_venta
    };
    heads.forEach((_, i) => {
      const raw = f.celdas?.[i];
      row['k' + i] = raw != null && raw !== '' ? String(raw) : '';
    });
    return row;
  });
  return { cabeceras: heads, keysColumnas, displayedColumns, data };
}

export function etiquetaColumnaSire(
  key: string,
  cabeceras: string[],
  keysColumnas: string[],
  idLabel: string
): string {
  const idx = keysColumnas.indexOf(key);
  if (idx >= 0 && cabeceras[idx]) {
    return cabeceras[idx];
  }
  if (key === 'registro_id') {
    return idLabel;
  }
  if (key === 'id_punto_venta') {
    return 'Punto venta';
  }
  return key;
}
