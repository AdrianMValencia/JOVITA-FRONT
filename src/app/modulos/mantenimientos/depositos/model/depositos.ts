export class Depositos{
  constructor(
    public id?: number,
    public idPuntoVenta?: number | any,
    public fechaDeposito?: string | any,
    public idBanco?: string | any,
    public imagen?: string | any,
    public observaciones?: string | any,
    public status?: boolean,
    public opcion?: number,
  ){}
}
