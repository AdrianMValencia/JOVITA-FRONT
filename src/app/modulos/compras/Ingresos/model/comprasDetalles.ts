export class ComprasDetalles{
  constructor(
    public id?: number | any,
    public idCompra?: number | any,
    public idProducto?: number | any,
    public nombre?: string | any,
    public precio?: string | any,
    public precioVenta?: string | any,
    public nuevoPrecio?: string | any,
    public cantidad?: number | any,
    public fechaVencimiento?: string | any,
    public loteProducto?: string | any,
    public total?: string | any,
    public status?: boolean | any,
    public codigoBarra?: string | any,
    public observaciones?: string | any,
    public existencia?: string | any,
    public precioMinimo?: string | any,
    public precioMaximo?: string | any,
    public precioMayor?: string | any,
    public stockActual?: string | any,
    public bonificacion?: boolean | any
  ){}
}
