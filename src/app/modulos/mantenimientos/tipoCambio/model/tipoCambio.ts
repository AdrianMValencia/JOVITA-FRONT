export class TipoCambio{
  constructor(
    public id?: number,
    public idPuntoVenta?: number | any,
    public idMoneda?: number | any,
    public fecha?: string | any,
    public valorCompra?: string | any,
    public valorVenta?: string | any,
    public observaciones?: string | any,
    public status?: boolean | any,
    public created_at?:string | any,
    public opcion?: number,
  ){}
}
