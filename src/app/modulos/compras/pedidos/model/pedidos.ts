import { PedidosDetalles } from "./pedidosDetalles";

export class Pedidos{
  constructor(
    public id?: number | any,
    public idPuntoVenta?: number | any,
    public puntoventa?: string | any,
    public idPuntoVentaLlegada?: number | any,
    public puntoVentaLlegada?: string | any,
    public idUsuario?: number | any,
    public vendedor?: string | any,
    public total?: string | any,
    public observaciones?: string | any,
    public status?: boolean | any,
    public created_at?: boolean | any,
    public opcion?: number | any,
    public detalles?: PedidosDetalles[] | any
  ){}
}
