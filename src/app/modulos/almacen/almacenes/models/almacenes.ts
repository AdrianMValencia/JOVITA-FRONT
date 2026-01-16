import { Ubigeo } from "src/app/shared/services/ubigeo/ubigeo";

export class Almacenes{
  constructor(
    public id?: number,
    public idPuntoVenta?: number | any,
    public nombre?: string | any,
    public direccion?: string | any,
    public idUbigeo?: number | any,
    public observaciones?: string | any,
    public status?: boolean | any,
    public created_at?: boolean | any,
    public opcion?: number,
    public ubigeos?: Ubigeo | any
  ){}
}
