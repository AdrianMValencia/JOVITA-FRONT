/** Respuesta anidada en listados de recibos (buscarPorFecha, etc.). */
export interface ComprobanteElectronicoListado {
  serie?: string;
  numero?: string;
  comprobante?: string;
}

/** Ticket interno POS (tbl_recibos); no mezcla CPE / efact_comprobante. */
export interface TicketPosListado {
  serie?: string;
  numeracion?: string;
  texto?: string;
}

function textoDesdeTicketPos(tp: unknown): string | null {
  if (!tp || typeof tp !== 'object') {
    return null;
  }
  const o = tp as TicketPosListado;
  const t = o.texto;
  if (t != null && String(t).trim()) {
    return String(t).trim();
  }
  const s = o.serie != null ? String(o.serie).trim() : '';
  const n = o.numeracion != null ? String(o.numeracion).trim() : '';
  if (s && n) {
    return `${s}-${n}`;
  }
  return (s || n || '').trim() || null;
}

function comprobanteDesdeCpeObj(obj: unknown): string | null {
  if (!obj || typeof obj !== 'object') {
    return null;
  }
  const o = obj as ComprobanteElectronicoListado;
  const c = o.comprobante;
  if (c != null && String(c).trim()) {
    return String(c).trim();
  }
  const s = o.serie != null ? String(o.serie).trim() : '';
  const n = o.numero != null ? String(o.numero).trim() : '';
  if (s && n) {
    return `${s}-${n}`;
  }
  return null;
}

/**
 * Texto columna "Ticket (POS)": `ticket_pos.texto`, luego `enumeracion_ticket`, luego series/numeracion del recibo.
 */
export function textoNumeracionTicketRecibo(el: Record<string, unknown> | null | undefined): string {
  if (!el) {
    return '—';
  }
  const desdeTp = textoDesdeTicketPos(el['ticket_pos']);
  if (desdeTp) {
    return desdeTp;
  }
  const et = el['enumeracion_ticket'];
  if (et != null && String(et).trim()) {
    return String(et).trim();
  }
  const s = el['series'] != null ? String(el['series']) : '';
  const n = el['numeracion'] != null ? String(el['numeracion']) : '';
  if (s && n) {
    return `${s}-${n}`;
  }
  const st = el['serie_ticket'] ?? el['serieTicket'];
  const nt = el['numero_ticket'] ?? el['numeroTicket'];
  const ss = st != null ? String(st).trim() : '';
  const nn = nt != null ? String(nt).trim() : '';
  if (ss && nn) {
    return `${ss}-${nn}`;
  }
  return (ss || nn || '—').trim() || '—';
}

/**
 * CPE SUNAT: `cpe_sunat.comprobante`, luego `comprobante_emitido`, luego `comprobante_electronico` (compat).
 */
export function textoComprobanteSunatRecibo(el: Record<string, unknown> | null | undefined): string {
  if (!el) {
    return '—';
  }
  const desdeCpe = comprobanteDesdeCpeObj(el['cpe_sunat']);
  if (desdeCpe) {
    return desdeCpe;
  }
  const ce = el['comprobante_emitido'];
  if (ce != null && String(ce).trim()) {
    return String(ce).trim();
  }
  const obj = el['comprobante_electronico'] as ComprobanteElectronicoListado | null | undefined;
  const desdeLegacy = comprobanteDesdeCpeObj(obj);
  return desdeLegacy || '—';
}

/** Tooltip con campos eFact / OSE útiles cuando existen en el JSON plano del recibo. */
export function tooltipResumenEfactRecibo(el: Record<string, unknown> | null | undefined): string {
  if (!el) {
    return '';
  }
  const parts: string[] = [];
  const add = (label: string, key: string) => {
    const v = el[key];
    if (v !== undefined && v !== null && String(v) !== '') {
      parts.push(`${label}: ${v}`);
    }
  };
  add('Ticket OSE', 'efact_ticket');
  add('Estado eFact', 'efact_estado');
  add('Estado OSE', 'estado_ose');
  add('Estado SUNAT', 'estado_sunat');
  add('Pendiente emisión', 'pendiente_emision');
  add('Puede descargar', 'puede_descargar');
  add('Error crítico', 'es_error_critico');
  add('CPE cerrado OSE/SUNAT', 'cpe_cerrado_sunat_ose');
  return parts.join('\n');
}

/**
 * Une `response.recibos` con campos eFact que a veces vienen en la raíz del JSON del POST emitir.
 */
export function mergeRespuestaEmitirRecibo(response: Record<string, unknown>): Record<string, unknown> {
  const base = (response['recibos'] as Record<string, unknown>) || {};
  const merged: Record<string, unknown> = { ...base };
  const raiz = response;
  const copiarRaiz = (key: string) => {
    const v = raiz[key];
    if (v !== undefined && v !== null && String(v) !== '' && (merged[key] == null || merged[key] === '')) {
      merged[key] = v;
    }
  };
  [
    'efact_ticket',
    'ticket',
    'ticket_ose',
    'comprobante_emitido',
    'comprobante_electronico',
    'cpe_sunat',
    'efact_estado',
    'estado_ose',
    'estado_sunat',
    'serieComprobanteEfact',
    'numeroComprobanteEfact',
    'ticket_pos',
    'enumeracion_ticket'
  ].forEach(copiarRaiz);
  return merged;
}

function textoCpeDesdeSerieNumeroEfact(merged: Record<string, unknown>): string | null {
  const s = merged['serieComprobanteEfact'];
  const n = merged['numeroComprobanteEfact'];
  if (s == null || n == null) {
    return null;
  }
  const ss = String(s).trim();
  const nn = String(n).trim();
  if (!ss || !nn) {
    return null;
  }
  return `${ss}-${nn}`;
}

/**
 * Mensaje multilínea para toast tras cobrar: CPE SUNAT, ticket POS, total y estado eFact.
 */
export function mensajeToastExitoCobroRecibo(
  response: Record<string, unknown>,
  emitirEfact: boolean
): string {
  const merged = mergeRespuestaEmitirRecibo(response);
  const backend = String(response['message'] ?? '').trim();

  if (!emitirEfact) {
    return backend || 'Venta registrada correctamente.';
  }

  let cpe = textoComprobanteSunatRecibo(merged);
  if (cpe === '—') {
    const sn = textoCpeDesdeSerieNumeroEfact(merged);
    if (sn) {
      cpe = sn;
    }
  }

  const ticketPos = textoNumeracionTicketRecibo(merged);
  const estado =
    (merged['efact_estado'] as string) ||
    (merged['estado_ose'] as string) ||
    (merged['estado_sunat'] as string) ||
    '';
  const moneda = merged['moneda'] != null ? String(merged['moneda']).trim() : '';
  const total = merged['total'] != null ? String(merged['total']).trim() : '';

  const lineas: string[] = [];
  lineas.push('Cobro registrado correctamente.');
  if (cpe !== '—') {
    lineas.push(`Comprobante electrónico SUNAT: ${cpe}.`);
  } else {
    lineas.push('El comprobante electrónico fue enviado a eFact; el número SUNAT puede reflejarse en segundos.');
  }
  lineas.push(`Ticket interno de caja (POS): ${ticketPos}.`);
  if (moneda && total) {
    lineas.push(`Total cobrado: ${moneda} ${total}.`);
  }
  if (estado.trim()) {
    lineas.push(`Estado eFact / OSE: ${estado.trim()}.`);
  }
  if (cpe === '—' && backend) {
    lineas.push(`Referencia: ${backend}`);
  }
  return lineas.join('\n');
}
