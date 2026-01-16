export class Proveedor{
  constructor(
    public id?: number | any,
    public idPuntoVenta?: number | any,
    public idTipoDoi?: string | any,
    public numeroDoi?: string | any,
    public nombre?: string | any,
    public razonsocial?: string | any,
    public pais?: string | any,
    public idUbigeo?: string | any,
    public direccion?: string | any,
    public correo?: string | any,
    public celular?: string | any,
    public telefono?: string | any,
    public imagen?: string | any,
    public observaciones?: string | any,
    public status?: boolean | any,
    public opcion?: number,
    public created_at?: string | any,
    public puntoventa?: any,
    public tipoDoi?: any,
    public ubigeos?: any
  ){}
}
