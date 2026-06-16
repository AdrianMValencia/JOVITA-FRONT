import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';

/** Periodo del mes calendario actual (Y-m-d). */
export function periodoMesActual(): { fechaInicio: string; fechaFin: string } {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, '0');
  const ini = `${y}-${m}-01`;
  const ult = new Date(y, hoy.getMonth() + 1, 0).getDate();
  const fin = `${y}-${m}-${String(ult).padStart(2, '0')}`;
  return { fechaInicio: ini, fechaFin: fin };
}

/** ID de punto de venta guardado en localStorage, o cadena vacía. */
export function idPuntoVentaDesdeStorage(): string {
  const pv = localStorage.getItem('puntosVenta');
  if (!pv) {
    return '';
  }
  try {
    const p = JSON.parse(pv) as PuntosVenta;
    return p.id != null ? String(p.id) : '';
  } catch {
    return '';
  }
}
