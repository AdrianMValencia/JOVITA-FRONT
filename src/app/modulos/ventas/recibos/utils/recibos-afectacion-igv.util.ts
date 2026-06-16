import { Productos } from 'src/app/modulos/almacen/productos/model/productos';
import { RecibosDetalles } from '../model/recibosDetalles';

export const CODIGO_AFECTACION_GRAVADO = '10';
export const CODIGO_AFECTACION_EXONERADO = '20';
export const CODIGO_AFECTACION_INAFECTO = '30';

const TASA_IGV = 0.18;
const FACTOR_INCLUYE_IGV = 1 + TASA_IGV;

export type CodigoAfectacionIgv = '10' | '20' | '30';

/** true si el producto del catálogo está marcado con IGV (misma regla que modal de productos). */
export function productoAplicaIgv(producto?: Partial<Productos> | null): boolean {
  if (!producto) {
    return true;
  }
  const v = producto.igv;
  if (v === undefined || v === null) {
    return false;
  }
  return v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true';
}

/** Por defecto en venta: con IGV → gravado (10); sin IGV → inafecto (30). */
export function codigoAfectacionPorDefectoProducto(
  producto?: Partial<Productos> | null
): CodigoAfectacionIgv {
  return productoAplicaIgv(producto) ? CODIGO_AFECTACION_GRAVADO : CODIGO_AFECTACION_INAFECTO;
}

/** Normaliza texto o número a código cat. 07 SUNAT. */
export function normalizarCodigoAfectacionIgv(val: any): CodigoAfectacionIgv {
  if (val === undefined || val === null) {
    return CODIGO_AFECTACION_GRAVADO;
  }
  const s = String(val).trim().toLowerCase();
  if (s === '10' || s === 'gravado') {
    return CODIGO_AFECTACION_GRAVADO;
  }
  if (s === '20' || s === 'exo' || s.startsWith('exon')) {
    return CODIGO_AFECTACION_EXONERADO;
  }
  if (s === '30' || s === 'ina' || s.startsWith('inaf')) {
    return CODIGO_AFECTACION_INAFECTO;
  }
  return CODIGO_AFECTACION_GRAVADO;
}

export function resolverCodigoAfectacionLinea(
  detalle: Partial<RecibosDetalles> & Record<string, any>,
  producto?: Partial<Productos> | null
): CodigoAfectacionIgv {
  const raw =
    detalle.codigoAfectacionIgv ??
    detalle['codigo_afectacion_igv'] ??
    detalle.tipoAfectacionIgv ??
    detalle['tipo_afectacion_igv'];
  if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
    return normalizarCodigoAfectacionIgv(raw);
  }
  return codigoAfectacionPorDefectoProducto(producto);
}

export function esLineaGravada(codigo: CodigoAfectacionIgv): boolean {
  return codigo === CODIGO_AFECTACION_GRAVADO;
}

export interface ImportesLinea {
  subtotal: string;
  igv: string;
  total: string;
}

/**
 * Precio unitario de catálogo como en el flujo actual: para gravado el importe de línea incluye IGV.
 * Para 20/30 el importe es inafecto/exonerado (sin IGV): subtotal = total = cantidad * precio (menos desc. línea).
 */
export function calcularImportesLinea(
  cantidad: number,
  precioUnit: number,
  codigo: CodigoAfectacionIgv,
  porcentajeDescLinea: number = 0
): ImportesLinea {
  const c = cantidad || 0;
  const p = precioUnit || 0;
  const desc = porcentajeDescLinea || 0;
  const bruto = c * p - desc;

  if (esLineaGravada(codigo)) {
    const total = bruto;
    const subtotal = total / FACTOR_INCLUYE_IGV;
    const igv = total - subtotal;
    return {
      subtotal: subtotal.toFixed(2),
      igv: igv.toFixed(2),
      total: total.toFixed(2)
    };
  }

  const t = bruto;
  return {
    subtotal: t.toFixed(2),
    igv: '0.00',
    total: t.toFixed(2)
  };
}

export interface TotalesCabeceraRecibo {
  totalGravada: string;
  totalIgv: string;
  total: string;
  montoDesc?: string;
}

/** Actualiza subtotal, igv, total y fija codigoAfectacionIgv según detalle + producto. */
export function asignarMontosDetalle(
  detalle: RecibosDetalles,
  cantidad: number,
  precioUnit: number,
  producto: Partial<Productos> | null | undefined
): void {
  const cod = resolverCodigoAfectacionLinea(detalle, producto);
  detalle.codigoAfectacionIgv = cod;
  const pd = parseFloat(String(detalle.porcentajeDesc ?? 0)) || 0;
  const m = calcularImportesLinea(cantidad, precioUnit, cod, pd);
  detalle.subtotal = m.subtotal;
  detalle.igv = m.igv;
  detalle.total = m.total;
}

/** Cuando el importe total de línea ya está definido (p. ej. modal kilos / báscula). */
export function distribuirTotalLineaEnSubtotalIgv(
  detalle: RecibosDetalles,
  totalLinea: number,
  producto: Partial<Productos> | null | undefined
): void {
  const cod = resolverCodigoAfectacionLinea(detalle, producto);
  detalle.codigoAfectacionIgv = cod;
  const t = totalLinea || 0;
  if (esLineaGravada(cod)) {
    detalle.total = t.toFixed(2);
    const sub = t / FACTOR_INCLUYE_IGV;
    detalle.subtotal = sub.toFixed(2);
    detalle.igv = (t - sub).toFixed(2);
  } else {
    detalle.total = t.toFixed(2);
    detalle.subtotal = t.toFixed(2);
    detalle.igv = '0.00';
  }
}

/**
 * totalGravada: suma de bases gravadas (solo líneas 10).
 * totalIgv: solo IGV de gravadas; con descuento % se aplica sobre la suma de bases gravadas (comportamiento previo del formulario).
 * total: bases gravadas (netas si hay dto) + IGV + importes de líneas 20/30.
 */
export function recalcularTotalesCabeceraDesdeDetalles(
  detalles: RecibosDetalles[],
  resolverProducto: (d: RecibosDetalles) => Partial<Productos> | null | undefined,
  opciones?: { porcentajeDescGlobal?: number }
): TotalesCabeceraRecibo {
  let sumaSubtotalGravado = 0;
  let sumaIgvGravado = 0;
  let sumaTotalNoGravado = 0;

  detalles.forEach((d) => {
    const cod = resolverCodigoAfectacionLinea(d, resolverProducto(d));
    const sub = parseFloat(String(d.subtotal ?? 0)) || 0;
    const igv = parseFloat(String(d.igv ?? 0)) || 0;
    const tot = parseFloat(String(d.total ?? 0)) || 0;
    if (esLineaGravada(cod)) {
      sumaSubtotalGravado += sub;
      sumaIgvGravado += igv;
    } else {
      sumaTotalNoGravado += tot;
    }
  });

  const pct = opciones?.porcentajeDescGlobal;
  if (pct !== undefined && !isNaN(pct) && pct !== 0) {
    const montoDesc = (sumaSubtotalGravado * pct) / 100;
    const totalGravadaNeto = sumaSubtotalGravado - montoDesc;
    const totalIgv = totalGravadaNeto * TASA_IGV;
    const total = totalGravadaNeto + totalIgv + sumaTotalNoGravado;
    return {
      totalGravada: totalGravadaNeto.toFixed(2),
      totalIgv: totalIgv.toFixed(2),
      total: total.toFixed(2),
      montoDesc: montoDesc.toFixed(2)
    };
  }

  const total = sumaSubtotalGravado + sumaIgvGravado + sumaTotalNoGravado;
  return {
    totalGravada: sumaSubtotalGravado.toFixed(2),
    totalIgv: sumaIgvGravado.toFixed(2),
    total: total.toFixed(2)
  };
}
