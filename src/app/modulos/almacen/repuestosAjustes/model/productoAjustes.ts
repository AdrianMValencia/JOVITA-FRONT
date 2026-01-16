export class ProductoAjustes{
  constructor(
    public id?: number | any,
    public idPuntoVenta?: number | any,
    public idProducto?: number | any,
    public nombre?: string | any,
    public stock?: number | any,
    public stockAjuste?: number | any,
    public cantidadAjuste?: number| any,
    public tipoAjuste?: number | any,
    public observaciones?: string | any,
    public status?: boolean,
    public opcion?: number | any,
    public created_at?: string | any
  ){}
}
