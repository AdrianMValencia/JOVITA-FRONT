import { RecibosDetalles } from "./recibosDetalles";
import { RecibosMedioPago } from './recibosMedioPago';

export class Recibos{
  constructor(
      public id?: number | any,
      public idPuntoVenta?: number | any,
      public puntoventa?: string | any,
      public idCliente?: number | any,
      public documento?: string | any,
      public razonSocial?: string | any,
      public correo?: string | any,
      public idUsuario?: string | any,
      public vendedor?: string | any,
      public idSeries?: number | any,
      public series?: string | any,
      public numeracion?: string | any,
      public fechaEmision?: string | any,
      public idMoneda?: number | any,
      public moneda?: string | any,
      public tipoCambio?: string | any,
      public porcentajeDesc?: number | any,
      public montoDesc?: string | any,
      public totalGravada?: string | any,
      public totalIgv?: string | any,
      public otrosCargo?: string | any,
      public total?: string | any,
      public pagado?: string | any,
      public vuelto?: string | any,
      public status?: boolean | any,
      public detalles?: RecibosDetalles[] | any,
      public medioPagos?: RecibosMedioPago | any,
      public created_at?: string | any,
      public emitirEfact?: boolean | any
  ){}

  /**
   * Campos extra que mezcla el API en listados (p. ej. POST buscarPorFecha).
   * Opcionales; no forman parte del constructor legacy.
   */
  /** Ticket interno POS (solo tbl_recibos); no CPE. */
  ticket_pos?: { serie?: string; numeracion?: string; texto?: string } | null;
  /** CPE SUNAT; mismo shape que comprobante_electronico. */
  cpe_sunat?: { serie?: string; numero?: string; comprobante?: string } | null;
  enumeracion_ticket?: string;
  comprobante_electronico?: { serie?: string; numero?: string; comprobante?: string } | null;
  comprobante_emitido?: string | null;
  /**
   * Al crear venta: correlativo SUNAT (Boleta/Factura) distinto de series/numeracion del ticket POS.
   * El backend debe persistirlos aparte (p. ej. efact_comprobante_* vs tbl_recibos).
   */
  serieComprobanteEfact?: string;
  numeroComprobanteEfact?: string;
  efact_ticket?: string | null;
  efact_estado?: string;
  estado_ose?: string;
  estado_sunat?: string;
  pendiente_emision?: boolean;
  puede_descargar?: boolean;
  es_error_critico?: boolean;
  cpe_cerrado_sunat_ose?: boolean | null;
}
