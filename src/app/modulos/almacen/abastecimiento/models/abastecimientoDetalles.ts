export class AbastecimientoDetalles{
  constructor(
    public id?: number | any,
    public idAbastecimiento?: number | any,
    public idProducto?: string | any,
    public nombre?: string | any,
    public precioCompra?: string | any,
    public stockActual?: string | any,
    public codigoBarra?: string | any,
    public idPuntoVentaNew?: number | any,
    public puntoVentaNew?: string | any,
    public cantidad?: string | any,
    public stockEnviar?: string | any,
    public created_at?: string | any
  ){}
}
