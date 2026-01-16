export class PedidosDetalles{
  constructor(
    public id?: number | any,
    public idPedido?: number | any,
    public idProducto?: number | any,
    public nombre?: string | any,
    public codigoBarra?: string | any,
    public precioCompra?: string | any,
    public tipoPresentacion?: string | any,
    public cantidadPaquetes?: string | any,
    public cantidad?: string | any,
    public total?: string | any,
    public existencia?: string | any
  ){}
}
