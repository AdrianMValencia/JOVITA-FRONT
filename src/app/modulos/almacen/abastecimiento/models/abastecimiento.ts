import { AbastecimientoDetalles } from "./abastecimientoDetalles";

export class Abastecimiento{
  constructor(
    public id?: number | any,
    public idPuntoVenta?: number | any,
    public puntoVenta?: string | any,
    public idProducto?: string | any,
    public nombre?: string | any,
    public precioCompra?: string | any,
    public stockActual?: string | any,
    public codigoBarra?: string | any,
    public idPuntoVentaNew?: number | any,
    public puntoVentaNew?: string | any,
    public cantidad?: string | any,
    public created_at?: string | any,
    public stockEnviar?: string | any,
    public numeroEnvio?: string | any,
    public total?: string | any,
    public totalGeneral?: string | any,
    public detalles?: AbastecimientoDetalles[] | any
  ){}
}
