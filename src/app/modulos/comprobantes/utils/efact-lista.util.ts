import {
  textoComprobanteSunatRecibo,
  textoNumeracionTicketRecibo
} from 'src/app/modulos/ventas/recibos/utils/recibo-listado-ui.util';

export type ModoListaEfact = 'emitidos' | 'pendientes';

function textoUtil(s: string | null | undefined): boolean {
  const t = (s || '').trim();
  return !!t && t !== '—';
}

function leerTexto(el: Record<string, unknown>, claves: string[]): string {
  for (const k of claves) {
    const v = el[k];
    if (v != null) {
      const s = String(v).trim();
      if (s && s !== '—' && s.toLowerCase() !== 'null' && s.toLowerCase() !== 'undefined') {
        return s;
      }
    }
  }
  return '';
}

/** CPE SUNAT (boleta/factura electrónica), distinto del ticket POS. */
export function tieneNumeroCpeSunat(el: Record<string, unknown> | null | undefined): boolean {
  if (!el) {
    return false;
  }
  // Preferir resolver desde estructura recibos/cpe_sunat.
  if (textoUtil(textoComprobanteSunatRecibo(el))) {
    return true;
  }

  // Compatibilidad con distintos payloads legacy del backend.
  const cpePlano = leerTexto(el, [
    'comprobante_emitido',
    'comprobante',
    'comprobanteSunat',
    'efact_comprobante',
    'efactComprobante'
  ]);
  if (textoUtil(cpePlano)) {
    return true;
  }

  const serie = leerTexto(el, [
    'serieComprobanteEfact',
    'serie_comprobante_efact',
    'serie_cpe',
    'serieCpe',
    'serie'
  ]);
  const numero = leerTexto(el, [
    'numeroComprobanteEfact',
    'numero_comprobante_efact',
    'numero_cpe',
    'numeroCpe',
    'numero'
  ]);
  if (!serie || !numero) {
    return false;
  }
  const ticketPos = textoNumeracionTicketRecibo(el);
  const candidato = `${serie}-${numero}`;
  if (textoUtil(ticketPos) && ticketPos === candidato) {
    return false;
  }
  return true;
}

/** Ticket interno de caja (numeración POS). */
export function tieneNumeroTicketPos(el: Record<string, unknown> | null | undefined): boolean {
  return textoUtil(textoNumeracionTicketRecibo(el));
}

/** Ya emitido: tiene CPE SUNAT y ticket POS. */
export function esComprobanteEmitidoCompleto(el: Record<string, unknown> | null | undefined): boolean {
  return tieneNumeroCpeSunat(el) && tieneNumeroTicketPos(el);
}

/** Venta cobrada con ticket POS pero sin CPE SUNAT (pendiente de emisión masiva). */
export function esTicketPendienteEmision(el: Record<string, unknown> | null | undefined): boolean {
  return tieneNumeroTicketPos(el) && !tieneNumeroCpeSunat(el);
}

export function filtrarItemsPorModoLista<T extends Record<string, unknown>>(
  items: T[],
  modo: ModoListaEfact
): T[] {
  if (modo === 'emitidos') {
    return items.filter((row) => esComprobanteEmitidoCompleto(row));
  }
  return items.filter((row) => esTicketPendienteEmision(row));
}
