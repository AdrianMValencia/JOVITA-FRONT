/**
 * Convierte serial de fecha Excel (columna FECHA del inventario valorizado) a texto legible.
 * Epoch: (serial - 25569) * 86400000 ms desde 1970-01-01 UTC.
 */
export function formatExcelSerialDate(serial: unknown): string {
  if (serial == null || serial === '') {
    return '';
  }
  const n = typeof serial === 'number' ? serial : Number(serial);
  if (!Number.isFinite(n) || n <= 0) {
    return String(serial);
  }
  const ms = (n - 25569) * 86400000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) {
    return String(serial);
  }
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
