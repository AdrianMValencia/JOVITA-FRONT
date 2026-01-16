export class Devoluciones{
  constructor(
    public id?: number,
    public idPuntoVenta?: number | any,
    public puntoVenta?: string | any,
    public idProducto?: string | any,
    public nombre?: string | any,
    public stockActual?: string | any,
    public codigoBarra?: string | any,
    public idPuntoVentaNew?: number | any,
    public puntoVentaNew?: string | any,
    public cantidad?: string | any,
    public created_at?: string | any,
    public motivo?: string | any
  ){}
}
