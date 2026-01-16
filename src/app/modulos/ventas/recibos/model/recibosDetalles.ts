export class RecibosDetalles{
  constructor(
    public id?: number | any,
    public idRecibo?: number | any,
    public idProducto?: string | any,
    public codigoBarra?: string | any,
    public nombre?: string | any,
    public detalle?: string | any,
    public precio?: string | any,
    public cantidad?: string | any,
    public subtotal?: string | any,
    public igv?: string | any,
    public total?: string | any,
    public porcentajeDesc?: string | any,
    public totalDesc?: string | any,
    public existencia?: number | any,
    public montoDesc?: string | any,
    public productos?: any | any
  ){}
}
