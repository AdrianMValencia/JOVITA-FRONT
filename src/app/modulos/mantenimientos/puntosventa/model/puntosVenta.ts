export class PuntosVenta{
  constructor(
    public id?: number | any,
    public nombre?: string | any,
    public direccion?: string | any,
    public idUbigeo?: number | any,
    public telefono?: string | any,
    public celular?: string | any,
    public correo?: string | any,
    public observaciones?: string | any,
    public status?: boolean | any,
    public created_at?: string | any,
    public opcion?: string | any,
    public puntoventa?: PuntosVenta | any
  ){}
}
