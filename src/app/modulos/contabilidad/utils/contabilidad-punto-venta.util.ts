import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';

/** Tiendas que se consolidan al operar desde JOVITA GENERAL. */
export const NOMBRES_TIENDAS_CONSOLIDACION_SIRE = ['JOVITA', 'JOVITA 2', 'JOVITA 3'] as const;

export function esJovitaGeneral(puntoVenta: PuntosVenta | null | undefined): boolean {
  const nombre = (puntoVenta?.nombre || '').trim().toUpperCase();
  if (nombre === 'JOVITA GENERAL') {
    return true;
  }
  const id = parseInt(String(puntoVenta?.id ?? ''), 10);
  return id === 10;
}

export function idsTiendasConsolidacionSire(puntosVenta: PuntosVenta[]): number[] {
  const ids: number[] = [];
  for (const nombre of NOMBRES_TIENDAS_CONSOLIDACION_SIRE) {
    const pv = puntosVenta.find((p) => (p.nombre || '').trim().toUpperCase() === nombre);
    if (pv?.id != null) {
      ids.push(Number(pv.id));
    }
  }
  return ids;
}

export function etiquetaConsolidacionSire(): string {
  return 'JOVITA, JOVITA 2 y JOVITA 3 (consolidado)';
}

/** IDs a consultar: consolidado (1–3) desde GENERAL; una sola tienda en el resto. */
export function resolverIdsConsultaSire(
  puntoVentaSesion: PuntosVenta,
  puntosVenta: PuntosVenta[],
  idPuntoVentaFiltro: string | number | null | undefined
): number[] {
  if (esJovitaGeneral(puntoVentaSesion)) {
    const filtro = idPuntoVentaFiltro === '' || idPuntoVentaFiltro == null ? null : Number(idPuntoVentaFiltro);
    if (filtro != null && !Number.isNaN(filtro)) {
      return [filtro];
    }
    return idsTiendasConsolidacionSire(puntosVenta);
  }
  const idSesion = Number(puntoVentaSesion?.id);
  return Number.isFinite(idSesion) && idSesion > 0 ? [idSesion] : [];
}

export function puntoVentaDesdeStorage(): PuntosVenta {
  const raw = localStorage.getItem('puntosVenta');
  if (!raw) {
    return new PuntosVenta();
  }
  try {
    return JSON.parse(raw) as PuntosVenta;
  } catch {
    return new PuntosVenta();
  }
}
