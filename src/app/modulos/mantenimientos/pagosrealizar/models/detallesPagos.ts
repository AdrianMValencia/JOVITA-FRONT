export class DetallesPagos{
  constructor(
    public id?: number,
    public idPagoRealizar?: number | any,
    public fechaVencimiento?: string | any,
    public cantidad?: number | any,
    public monto?: string | any,
    public interes?: string | any,
    public total?: string | any,
    public status?: boolean | any,
    public created_at?: string | any,
    public opcion?: string | any,
    public idUsuario?: number | any,
    public idModalidad?: number | any
  ){}
}
