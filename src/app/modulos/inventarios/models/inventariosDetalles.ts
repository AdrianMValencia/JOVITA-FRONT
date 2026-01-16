export class InventariosDetalles{
  constructor(
    public id?: number | any,
    public idInventario?: number | any,
    public idCategoria?: number | any,
    public categoria?: string | any,
    public codigoBarra?: string | any,
    public idProducto?: number | any,
    public productos?: string | any,
    public stockActual?: string | any,
    public stockInventario?: string | any,
    public diferenciaCantidad?: string | any,
    public precio?: string | any,
    public diferenciaPrecio?: string | any
  ){}
}
