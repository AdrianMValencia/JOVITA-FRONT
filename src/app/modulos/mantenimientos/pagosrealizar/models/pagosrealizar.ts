export class PagosRealizar{
  constructor(
    public id?: number,
    public idPuntoVenta?: number | any,
    public nombre?: string | any,
    public periodicidad?: number | any,
    public tipo?: number | any,
    public idBanco?: string | any,
    public idMoneda?: string | any,
    public cantidad?: number | any,
    public monto?: string | any,
    public observaciones?: string | any,
    public opcion?: string | any,
    public status?: boolean,
    public created_at?: string | any
  ){}
}
