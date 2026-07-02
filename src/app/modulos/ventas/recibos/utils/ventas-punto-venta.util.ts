/** Tiendas 1–3 y entorno de prueba usan facturación electrónica SUNAT/eFact en POS. */
const PUNTOS_VENTA_FACTURACION_ELECTRONICA = new Set([
  'JOVITA',
  'JOVITA 2',
  'JOVITA 3',
  'JOVITA PRUEBA',
]);

export function usaFacturacionElectronicaPos(nombrePuntoVenta: string | null | undefined): boolean {
  const nombre = (nombrePuntoVenta || '').trim().toUpperCase();
  return PUNTOS_VENTA_FACTURACION_ELECTRONICA.has(nombre);
}
