/** Forma UUID (8-4-4-4-12 hex). Evita confundir con correlativo POS tipo "BE01-24". */
const REGEX_TICKET_OSE_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function esProbableTicketOseUuid(s: string): boolean {
  return REGEX_TICKET_OSE_UUID.test(s.trim());
}

function normalizarTicketValor(v: unknown): string | null {
  if (v === undefined || v === null) {
    return null;
  }
  const s = String(v).trim();
  if (!s) {
    return null;
  }
  const lower = s.toLowerCase();
  if (lower === 'null' || lower === 'undefined' || lower === '—' || lower === '-') {
    return null;
  }
  return s;
}

/**
 * Resuelve el identificador de envío OSE/eFact (UUID) desde distintas claves del API.
 * Prioriza valores con forma UUID; el campo `ticket` solo se usa si es UUID (no correlativo POS).
 */
export function resolverTicketEfactDesdeItem(item: unknown): string | null {
  if (!item || typeof item !== 'object') {
    return null;
  }
  const o = item as Record<string, unknown>;

  const clavesUuidPrimero: string[] = [
    'efact_ticket',
    'efactTicket',
    'ticket_ose',
    'ticketOse',
    'ticket_uuid',
    'ticketUuid',
    'uuid_ticket',
    'uuidTicket',
    'ticket_efact',
    'ticketEfact',
    'nubefact_ticket',
    'nubefactTicket',
    'ticketOseUuid',
    'uuid',
    'ose_uuid',
    'oseUuid',
    'id_ticket_ose',
    'idTicketOse'
  ];

  const candidatosUuid: string[] = [];
  const candidatosOtros: string[] = [];

  const push = (v: unknown, aceptarNoUuid: boolean) => {
    const n = normalizarTicketValor(v);
    if (!n) {
      return;
    }
    if (esProbableTicketOseUuid(n)) {
      candidatosUuid.push(n);
    } else if (aceptarNoUuid) {
      candidatosOtros.push(n);
    }
  };

  for (const k of clavesUuidPrimero) {
    push(o[k], false);
  }

  const nested = o['efact_response'] as Record<string, unknown> | undefined;
  if (nested && typeof nested === 'object') {
    for (const k of ['ticket', 'uuid', 'ticket_uuid', 'efact_ticket', 'data']) {
      const v = nested[k];
      if (k === 'data' && v && typeof v === 'object') {
        const d = v as Record<string, unknown>;
        push(d['ticket'], false);
        push(d['uuid'], false);
      } else {
        push(v, false);
      }
    }
  }

  const ticketGen = o['ticket'];
  push(ticketGen, true);

  if (candidatosUuid.length) {
    return candidatosUuid[0];
  }

  let idx = 0;
  for (const v of Object.values(o)) {
    if (++idx > 80) {
      break;
    }
    if (typeof v === 'string' && esProbableTicketOseUuid(v)) {
      return v.trim();
    }
  }

  if (candidatosOtros.length) {
    const t = candidatosOtros[0];
    if (esProbableTicketOseUuid(t)) {
      return t;
    }
  }

  return null;
}
