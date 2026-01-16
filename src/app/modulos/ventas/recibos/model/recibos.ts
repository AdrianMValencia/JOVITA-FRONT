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
      public created_at?: string | any
  ){}
}
