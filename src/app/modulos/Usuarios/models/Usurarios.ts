import { Roles } from './Roles';
export class Usuarios{
  constructor(
    public id?: number | any,
    public idRol?: number | any,
    public nombre?: string | any,
    public usuario?: string | any,
    public email?: string | any,
    public password?: string | any,
    public direccion?: string | any,
    public telefono?: string | any,
    public celular?: string | any,
    public ciudad?: string | any,
    public imagen?: string | any,
    public status?: boolean | any,
    public opcion?: number | any,
    public roles?: Roles | any,
    public password_confirmation?: string  | any,
    public idPuntoVenta?: string | any
  ){}
}
