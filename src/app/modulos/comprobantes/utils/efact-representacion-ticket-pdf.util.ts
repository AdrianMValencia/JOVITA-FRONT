import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as QRCode from 'qrcode';
import { environment } from 'src/environments/environment';

/** Datos mínimos extraídos del XML UBL 2.1 (Factura/Boleta) para ticket térmico. */
export interface UblTicketData {
  tipoComprobanteCodigo: string;
  tipoComprobanteNombre: string;
  idDocumento: string;
  serie: string;
  numero: string;
  fechaEmision: string;
  horaEmision: string;
  monedaCodigo: string;
  monedaEtiqueta: string;
  rucEmisor: string;
  razonEmisor: string;
  direccionEmisor: string;
  tipoDocCliente: string;
  nroDocCliente: string;
  razonCliente: string;
  direccionCliente: string;
  igvPorcentaje: string;
  formaPago: string;
  totalLetras: string;
  items: {
    codigo: string;
    cantidad: string;
    unidad: string;
    descripcion: string;
    valorUnitario: string;
    descuento: string;
    importe: string;
  }[];
  opGravadas: string;
  opInafectas: string;
  opExoneradas: string;
  igv: string;
  total: string;
  hash: string;
}

function allElements(root: Document | Element, localName: string): Element[] {
  return Array.from(root.getElementsByTagName('*')).filter((e) => e.localName === localName);
}

function firstChildText(el: Element | null, localName: string): string {
  if (!el) {
    return '';
  }
  for (let i = 0; i < el.children.length; i++) {
    const c = el.children[i];
    if (c.localName === localName) {
      return (c.textContent || '').trim();
    }
  }
  return '';
}

function firstDescendant(root: Element, localName: string): Element | null {
  const stack: Element[] = [root];
  while (stack.length) {
    const n = stack.pop()!;
    if (n.localName === localName) {
      return n;
    }
    for (let i = n.children.length - 1; i >= 0; i--) {
      stack.push(n.children[i] as Element);
    }
  }
  return null;
}

function formatPostalAddress(addr: Element | null): string {
  if (!addr) {
    return '';
  }
  const lines: string[] = [];
  for (let i = 0; i < addr.children.length; i++) {
    const ch = addr.children[i];
    if (ch.localName === 'AddressLine') {
      const t = (ch.textContent || '').trim();
      if (t) {
        lines.push(t);
      }
    }
  }
  const city = firstChildText(addr, 'CityName');
  const dept = firstChildText(addr, 'CountrySubentity');
  const dist = firstChildText(addr, 'District');
  const tail = [dist, city, dept].filter(Boolean).join(' - ');
  if (tail) {
    lines.push(tail);
  }
  return lines.join(', ');
}

/** Elige el digest del comprobante (evita el de SignedProperties u otros nodos cortos). */
function elegirDigestValueRepresentacion(dom: Document): string {
  const digs = allElements(dom, 'DigestValue');
  const texts = digs
    .map((d) => (d.textContent || '').replace(/\s+/g, '').trim())
    .filter(Boolean);
  if (!texts.length) {
    return '';
  }
  const largos = texts.filter((t) => t.length >= 40);
  if (largos.length) {
    return largos[0];
  }
  return texts[texts.length - 1];
}

function nombreTipoComprobante(cod: string): string {
  const c = (cod || '').trim();
  const map: Record<string, string> = {
    '01': 'FACTURA ELECTRÓNICA',
    '03': 'BOLETA DE VENTA ELECTRÓNICA',
    '07': 'NOTA DE CRÉDITO ELECTRÓNICA',
    '08': 'NOTA DE DÉBITO ELECTRÓNICA',
    '09': 'GUÍA DE REMISIÓN ELECTRÓNICA'
  };
  return map[c] || `COMPROBANTE (${c})`;
}

function etiquetaMoneda(cod: string): string {
  const u = (cod || '').toUpperCase();
  if (u === 'PEN') {
    return 'SOLES';
  }
  if (u === 'USD') {
    return 'DÓLARES AMERICANOS';
  }
  return cod || '';
}

function splitSerieNumero(idFull: string): { serie: string; numero: string } {
  const s = (idFull || '').trim();
  const idx = s.lastIndexOf('-');
  if (idx <= 0) {
    return { serie: s, numero: '' };
  }
  return { serie: s.substring(0, idx), numero: s.substring(idx + 1) };
}

/** true si el nodo está dentro de una línea InvoiceLine (TaxTotal por ítem, no totales documento). */
function estaDentroDeInvoiceLine(el: Element): boolean {
  let p: Element | null = el.parentElement;
  while (p) {
    if (p.localName === 'InvoiceLine') {
      return true;
    }
    if (p.localName === 'Invoice') {
      return false;
    }
    p = p.parentElement;
  }
  return false;
}

/**
 * OP. GRAVADAS / INAFECTAS / EXONERADAS desde TaxSubtotal del TaxTotal documento (igual que PDF eFact).
 * No usar LineExtensionAmount del LegalMonetaryTotal: en comprobantes mixtos es la suma de todas las bases.
 * Ignorar TaxTotal de cada InvoiceLine (evita duplicar 6.36+2.00 → 12.72+4.00).
 */
function extraerOperacionesDesdeTaxTotal(root: Element): {
  opGravadas: string;
  opInafectas: string;
  opExoneradas: string;
} {
  let grav = 0;
  let inaf = 0;
  let exo = 0;

  const taxTotals = allElements(root, 'TaxTotal').filter((tt) => !estaDentroDeInvoiceLine(tt));
  for (let t = 0; t < taxTotals.length; t++) {
    const taxTotalEl = taxTotals[t];
    const subs = allElements(taxTotalEl, 'TaxSubtotal');
    for (let i = 0; i < subs.length; i++) {
      const sub = subs[i];
      const taxableRaw = firstChildText(sub, 'TaxableAmount');
      const taxable = parseMontoTicket(taxableRaw);
      if (taxable === null || taxable <= 0) {
        continue;
      }
      const cat = firstDescendant(sub, 'TaxCategory');
      const scheme = cat ? firstDescendant(cat, 'TaxScheme') : null;
      const schemeId = (scheme ? firstChildText(scheme, 'ID') : '').trim();
      const schemeName = (scheme ? firstChildText(scheme, 'Name') : '').trim().toUpperCase();
      const taxAmt = parseMontoTicket(firstChildText(sub, 'TaxAmount')) ?? 0;
      const exemptCode = cat ? firstChildText(cat, 'TaxExemptionReasonCode') : '';

      if (schemeId === '1000' || schemeName === 'IGV' || taxAmt > 0.0005) {
        grav += taxable;
        continue;
      }
      if (schemeId === '9998' || schemeName === 'INA' || exemptCode === '30' || exemptCode === '40') {
        inaf += taxable;
        continue;
      }
      if (schemeId === '9997' || schemeName === 'EXO' || exemptCode === '20') {
        exo += taxable;
        continue;
      }
      inaf += taxable;
    }
  }

  if (grav === 0 && inaf === 0 && exo === 0) {
    const lmt = firstDescendant(root, 'LegalMonetaryTotal');
    const lineExt = lmt ? firstChildText(lmt, 'LineExtensionAmount') : '';
    const n = parseMontoTicket(lineExt);
    if (n !== null && n > 0) {
      grav = n;
    }
  }

  return {
    opGravadas: grav.toFixed(2),
    opInafectas: inaf.toFixed(2),
    opExoneradas: exo.toFixed(2)
  };
}

function leerTotalDesdeLegalMonetaryTotal(lmt: Element | null): string {
  if (!lmt) {
    return '';
  }
  for (let i = 0; i < lmt.children.length; i++) {
    const ch = lmt.children[i];
    if (ch.localName === 'PayableAmount') {
      const direct = (ch.textContent || '').trim();
      if (direct) {
        return direct;
      }
      const inner = firstChildText(ch as Element, 'PayableAmount');
      if (inner) {
        return inner;
      }
    }
  }
  return firstChildText(lmt, 'TaxInclusiveAmount');
}

function textoFormaPago(code: string): string {
  const c = (code || '').trim();
  if (c === '01' || c === '001') {
    return 'Contado';
  }
  if (c === '02' || c === '002') {
    return 'Crédito';
  }
  return c ? `Código ${c}` : '—';
}

/**
 * Interpreta XML UBL 2.1 de Factura (incl. boleta como Invoice tipo 03).
 */
export function parseUblInvoiceXmlParaTicket(xmlText: string): UblTicketData | null {
  const trimmed = (xmlText || '').trim();
  if (!trimmed || trimmed.startsWith('{')) {
    return null;
  }
  const dom = new DOMParser().parseFromString(trimmed, 'application/xml');
  const err = dom.getElementsByTagName('parsererror')[0];
  if (err) {
    return null;
  }
  const root = dom.documentElement;
  if (!root || root.localName !== 'Invoice') {
    return null;
  }

  const idDocumento = firstChildText(root, 'ID');
  if (!idDocumento) {
    return null;
  }
  const { serie, numero } = splitSerieNumero(idDocumento);
  const tipoComprobanteCodigo = firstChildText(root, 'InvoiceTypeCode') || '01';
  const fechaEmision = firstChildText(root, 'IssueDate') || '';
  const horaEmision = firstChildText(root, 'IssueTime') || '';
  const monedaCodigo = firstChildText(root, 'DocumentCurrencyCode') || 'PEN';

  const sup = firstDescendant(root, 'AccountingSupplierParty');
  const supParty = sup ? firstDescendant(sup, 'Party') : null;
  let rucEmisor = '';
  let razonEmisor = '';
  let direccionEmisor = '';
  if (supParty) {
    const ids = allElements(supParty, 'PartyIdentification');
    for (let i = 0; i < ids.length; i++) {
      const idEl = firstDescendant(ids[i], 'ID');
      if (idEl && /^\d{11}$/.test((idEl.textContent || '').trim())) {
        rucEmisor = (idEl.textContent || '').trim();
        break;
      }
    }
    const ple = firstDescendant(supParty, 'PartyLegalEntity');
    razonEmisor = ple ? firstChildText(ple, 'RegistrationName') : '';
    const regAddr = ple ? firstDescendant(ple, 'RegistrationAddress') : null;
    direccionEmisor = formatPostalAddress(regAddr);
    if (!direccionEmisor) {
      const pa = firstDescendant(supParty, 'PostalAddress');
      direccionEmisor = formatPostalAddress(pa);
    }
  }

  const cus = firstDescendant(root, 'AccountingCustomerParty');
  const cusParty = cus ? firstDescendant(cus, 'Party') : null;
  let tipoDocCliente = '';
  let nroDocCliente = '';
  let razonCliente = '';
  let direccionCliente = '';
  if (cusParty) {
    const pid = firstDescendant(cusParty, 'PartyIdentification');
    if (pid) {
      const idEl = firstDescendant(pid, 'ID');
      if (idEl) {
        nroDocCliente = (idEl.textContent || '').trim();
        tipoDocCliente = idEl.getAttribute('schemeID') || idEl.getAttribute('schemeId') || '';
      }
    }
    const ple = firstDescendant(cusParty, 'PartyLegalEntity');
    if (ple) {
      razonCliente = firstChildText(ple, 'RegistrationName');
      const ra = firstDescendant(ple, 'RegistrationAddress');
      direccionCliente = formatPostalAddress(ra);
    }
    if (!razonCliente) {
      const pn = firstDescendant(cusParty, 'PartyName');
      if (pn) {
        razonCliente = firstChildText(pn, 'Name');
      }
    }
  }

  const notes = allElements(root, 'Note');
  let totalLetras = '';
  for (let i = 0; i < notes.length; i++) {
    const t = (notes[i].textContent || '').trim();
    if (/^SON\s*:/i.test(t)) {
      totalLetras = t;
      break;
    }
  }

  const payMeans = firstDescendant(root, 'PaymentMeans');
  const payCode = payMeans ? firstChildText(payMeans, 'PaymentMeansCode') : '';
  const formaPago = textoFormaPago(payCode);

  const lmt = firstDescendant(root, 'LegalMonetaryTotal');
  const total = leerTotalDesdeLegalMonetaryTotal(lmt);
  const operaciones = extraerOperacionesDesdeTaxTotal(root);

  const taxTotalsDoc = allElements(root, 'TaxTotal').filter((tt) => !estaDentroDeInvoiceLine(tt));
  const taxTotalEl = taxTotalsDoc.length ? taxTotalsDoc[0] : null;
  const igv = taxTotalEl ? firstChildText(taxTotalEl, 'TaxAmount') : '';

  let igvPorcentaje = '';
  if (taxTotalEl) {
    const subs = allElements(taxTotalEl, 'TaxSubtotal');
    for (let i = 0; i < subs.length; i++) {
      const cat = firstDescendant(subs[i], 'TaxCategory');
      const pct = cat ? firstChildText(cat, 'Percent') : '';
      if (pct) {
        igvPorcentaje = pct;
        break;
      }
    }
  }

  const hash = elegirDigestValueRepresentacion(dom);

  const lineEls = allElements(root, 'InvoiceLine');
  const items: UblTicketData['items'] = [];
  for (let i = 0; i < lineEls.length; i++) {
    const line = lineEls[i];
    const qtyEl = firstDescendant(line, 'InvoicedQuantity');
    const cantidad = (qtyEl?.textContent || '').trim();
    const unidad = qtyEl?.getAttribute('unitCode') || qtyEl?.getAttribute('unitCodeID') || 'NIU';
    const item = firstDescendant(line, 'Item');
    const desc = item ? firstChildText(item, 'Description') : '';
    const priceEl = firstDescendant(line, 'Price');
    const valorUnitario = priceEl ? firstChildText(priceEl, 'PriceAmount') : '';
    const importe = firstChildText(line, 'LineExtensionAmount') || '';
    let descuento = '0.00';
    const allowances = allElements(line, 'AllowanceCharge');
    for (let j = 0; j < allowances.length; j++) {
      const isCharge = firstChildText(allowances[j], 'ChargeIndicator') === 'true';
      const amt = firstChildText(allowances[j], 'Amount');
      if (!isCharge && amt) {
        descuento = amt;
      }
    }
    let codigo = '';
    if (item) {
      const sell = firstDescendant(item, 'SellersItemIdentification');
      const std = firstDescendant(item, 'StandardItemIdentification');
      codigo =
        (sell && firstChildText(sell, 'ID')) ||
        (std && firstChildText(std, 'ID')) ||
        '';
    }
    items.push({
      codigo: codigo || '—',
      cantidad,
      unidad,
      descripcion: desc || '—',
      valorUnitario,
      descuento,
      importe
    });
  }

  return {
    tipoComprobanteCodigo,
    tipoComprobanteNombre: nombreTipoComprobante(tipoComprobanteCodigo),
    idDocumento,
    serie,
    numero,
    fechaEmision,
    horaEmision,
    monedaCodigo,
    monedaEtiqueta: etiquetaMoneda(monedaCodigo),
    rucEmisor,
    razonEmisor,
    direccionEmisor,
    tipoDocCliente,
    nroDocCliente,
    razonCliente,
    direccionCliente,
    igvPorcentaje: igvPorcentaje || '18.00',
    formaPago,
    totalLetras,
    items,
    opGravadas: operaciones.opGravadas,
    opInafectas: operaciones.opInafectas,
    opExoneradas: operaciones.opExoneradas,
    igv: igv || '0.00',
    total: total || '0.00',
    hash
  };
}

/** Cadena SUNAT para QR de representación impresa (10 campos separados por |). */
export function construirPayloadQrSunat(d: UblTicketData): string {
  const tipoDoc = d.tipoComprobanteCodigo;
  const fecha = d.fechaEmision;
  const tipoCli = d.tipoDocCliente || '-';
  const nroCli = d.nroDocCliente || '-';
  const parts = [
    d.rucEmisor,
    tipoDoc,
    d.serie,
    d.numero,
    d.igv,
    d.total,
    fecha,
    tipoCli,
    nroCli,
    d.hash
  ];
  return parts.join('|');
}

function addWrappedLines(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const lines = doc.splitTextToSize(text || '', maxWidth);
  const arr = Array.isArray(lines) ? lines : [lines];
  let yy = y;
  for (let i = 0; i < arr.length; i++) {
    doc.text(String(arr[i]), x, yy);
    yy += lineHeight;
  }
  return yy;
}

/** Varias líneas centradas respecto a `centerX` (p. ej. ancho página / 2). */
function addWrappedLinesCentered(
  doc: jsPDF,
  text: string,
  centerX: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const lines = doc.splitTextToSize(text || '', maxWidth);
  const arr = Array.isArray(lines) ? lines : [lines];
  let yy = y;
  for (let i = 0; i < arr.length; i++) {
    doc.text(String(arr[i]), centerX, yy, { align: 'center', maxWidth });
    yy += lineHeight;
  }
  return yy;
}

function parseMontoTicket(s: string | undefined | null): number | null {
  if (s === undefined || s === null) {
    return null;
  }
  const t = String(s).replace(/,/g, '').trim();
  if (t === '' || t === '—' || t === '-') {
    return null;
  }
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

/** Montos en 2 decimales (cantidades, importes, totales). */
function fmtMonto2(s: string | undefined | null, siVacio: string): string {
  const n = parseMontoTicket(s);
  if (n === null) {
    return siVacio;
  }
  return n.toFixed(2);
}

/** Valor unitario gravado SUNAT: 4 decimales. */
function fmtValorUnit4(s: string | undefined | null): string {
  const n = parseMontoTicket(s);
  if (n === null) {
    const t = (s || '').trim();
    return t || '—';
  }
  return n.toFixed(4);
}

/**
 * Genera PDF estrecho (~72 mm) estilo ticket térmico a partir del XML firmado.
 * Devuelve null si el XML no es una Invoice UBL válida o falla el QR.
 */
export async function generarPdfTicketDesdeUblXml(xmlText: string): Promise<Blob | null> {
  const data = parseUblInvoiceXmlParaTicket(xmlText);
  if (!data || !data.rucEmisor || !data.hash) {
    return null;
  }
  const qrPayload = construirPayloadQrSunat(data);
  let qrDataUrl: string;
  try {
    qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 240,
      color: { dark: '#000000', light: '#ffffff' }
    });
  } catch {
    return null;
  }

  const ancho = 72;
  /** Márgenes laterales más amplios (similar a ticket físico ~80 mm útil). */
  const margen = 5.5;
  const textoAncho = ancho - margen * 2;
  const filasEstimadas = data.items.length * 2 + 28;
  const alto = Math.min(420, Math.max(130, 8 + filasEstimadas * 3.6 + 56));

  const doc = new jsPDF({ unit: 'mm', format: [ancho, alto], orientation: 'p' });
  doc.setFont('courier', 'normal');
  let y = margen + 3;

  doc.setFontSize(8);
  const nombreTicket = String(environment.nombreEmpresaTicketEfact || '').trim() || data.razonEmisor || 'EMISOR';
  const tituloEmp = nombreTicket;
  y = addWrappedLinesCentered(doc, tituloEmp, ancho / 2, y, textoAncho, 3.6);
  doc.setFontSize(6.5);
  if (data.rucEmisor) {
    doc.text(`RUC: ${data.rucEmisor}`, ancho / 2, y, { align: 'center', maxWidth: textoAncho });
    y += 3.2;
  }
  if (data.direccionEmisor) {
    y = addWrappedLinesCentered(doc, data.direccionEmisor, ancho / 2, y, textoAncho, 3);
  }
  y += 2;
  doc.setLineWidth(0.2);
  doc.line(margen, y, ancho - margen, y);
  y += 4;

  doc.setFontSize(7);
  doc.text(data.tipoComprobanteNombre, ancho / 2, y, { align: 'center' });
  y += 3.5;
  doc.setFontSize(8);
  doc.text(`Nro. ${data.idDocumento}`, ancho / 2, y, { align: 'center' });
  y += 4;
  doc.line(margen, y, ancho - margen, y);
  y += 3.5;

  doc.setFontSize(6);
  doc.text(`Fecha emisión: ${data.fechaEmision}${data.horaEmision ? ' ' + data.horaEmision : ''}`, margen, y);
  y += 3.2;
  doc.text(`Forma de pago: ${data.formaPago}`, margen, y);
  y += 3.2;
  doc.text(`Moneda: ${data.monedaEtiqueta} (${data.monedaCodigo})`, margen, y);
  y += 3.2;
  doc.text(`IGV: ${data.igvPorcentaje}%`, margen, y);
  y += 4;
  doc.line(margen, y, ancho - margen, y);
  y += 3.5;

  doc.setFontSize(6.5);
  doc.text(`Cliente: ${data.razonCliente || '—'}`, margen, y);
  y += 3.2;
  if (data.nroDocCliente) {
    doc.text(`Doc.: ${data.tipoDocCliente || '-'} ${data.nroDocCliente}`, margen, y);
    y += 3.2;
  }
  if (data.direccionCliente) {
    y = addWrappedLines(doc, `Dir.: ${data.direccionCliente}`, margen, y, textoAncho, 3);
  }
  y += 2.5;
  doc.line(margen, y, ancho - margen, y);
  /** Espacio antes de la tabla de ítems (no pegada al separador). */
  y += 4.5;

  const body: (string | { content: string; colSpan?: number; styles?: Record<string, unknown> })[][] = [];
  for (let i = 0; i < data.items.length; i++) {
    const it = data.items[i];
    const cantN = parseMontoTicket(it.cantidad);
    const cantTxt = cantN !== null ? cantN.toFixed(2) : String(it.cantidad || '').trim() || '0.00';
    body.push([
      (it.codigo || '—').substring(0, 22),
      cantTxt,
      fmtValorUnit4(it.valorUnitario),
      fmtMonto2(it.descuento, '0.00'),
      fmtMonto2(it.importe, '0.00')
    ]);
    body.push([
      {
        content: it.descripcion,
        colSpan: 5,
        styles: {
          fontSize: 5.8,
          textColor: [45, 45, 45],
          cellPadding: { top: 1.2, bottom: 2, left: 0.3, right: 0.3 },
          minCellHeight: 5.5,
          valign: 'top',
          lineWidth: 0
        }
      }
    ]);
  }

  const prefMon = data.monedaCodigo === 'PEN' ? 'S/' : data.monedaCodigo;
  (doc as any).autoTable({
    startY: y,
    head: [
      ['Cód.', 'Cant.', 'V.Unit', 'Dscto.', 'Importe'],
      [
        {
          content: 'Descripción',
          colSpan: 5,
          styles: { fontSize: 5.4, fontStyle: 'italic', halign: 'left', cellPadding: { top: 0.4, bottom: 1.1, left: 0.2, right: 0.2 } }
        }
      ]
    ],
    body,
    theme: 'plain',
    tableWidth: textoAncho,
    styles: {
      font: 'courier',
      fontSize: 6,
      cellPadding: { top: 1, bottom: 1, left: 0.5, right: 0.5 },
      lineWidth: 0,
      minCellHeight: 3.8,
      valign: 'middle',
      overflow: 'linebreak',
      textColor: [0, 0, 0]
    },
    headStyles: {
      fontStyle: 'bold',
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 6,
      cellPadding: { top: 1.1, bottom: 1.1, left: 0.5, right: 0.5 },
      lineWidth: 0,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 17, halign: 'left' },
      1: { cellWidth: 11, halign: 'right' },
      2: { cellWidth: 14, halign: 'right' },
      3: { cellWidth: 9, halign: 'right' },
      4: { cellWidth: 10, halign: 'right' }
    },
    margin: { left: margen, right: margen, top: 0, bottom: 0 }
  });

  y = (doc as any).lastAutoTable.finalY + 2.5;
  doc.setDrawColor(100, 100, 100);
  doc.setLineDashPattern([0.55, 0.85] as number[], 0);
  doc.setLineWidth(0.1);
  doc.line(margen, y, ancho - margen, y);
  doc.setLineDashPattern([], 0);
  doc.setDrawColor(0, 0, 0);
  y += 3.2;

  doc.setFontSize(6.5);
  doc.text(`OP. GRAVADAS: ${prefMon} ${fmtMonto2(data.opGravadas, '0.00')}`, margen, y);
  y += 3.2;
  doc.text(`OP. INAFECTAS: ${prefMon} ${fmtMonto2(data.opInafectas, '0.00')}`, margen, y);
  y += 3.2;
  doc.text(`OP. EXONERADAS: ${prefMon} ${fmtMonto2(data.opExoneradas, '0.00')}`, margen, y);
  y += 3.2;
  doc.text(`IGV: ${prefMon} ${fmtMonto2(data.igv, '0.00')}`, margen, y);
  y += 3.2;
  doc.setFont('courier', 'bold');
  doc.text(`TOTAL: ${prefMon} ${fmtMonto2(data.total, '0.00')}`, margen, y);
  doc.setFont('courier', 'normal');
  y += 4;

  if (data.totalLetras) {
    y = addWrappedLines(doc, data.totalLetras, margen, y, textoAncho, 3);
    y += 2;
  }

  doc.setLineWidth(0.2);
  doc.line(margen, y, ancho - margen, y);
  y += 4;
  const qrMm = 32;
  const qx = (ancho - qrMm) / 2;
  doc.addImage(qrDataUrl, 'PNG', qx, y, qrMm, qrMm);
  y += qrMm + 3;

  doc.setFontSize(5.5);
  y = addWrappedLines(
    doc,
    'Representación impresa de comprobante de pago electrónico. Consulte en www.sunat.gob.pe o en el sitio del OSE.',
    margen,
    y,
    textoAncho,
    2.8
  );

  return doc.output('blob') as Blob;
}
