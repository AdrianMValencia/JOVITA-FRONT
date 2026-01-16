export class User{
  constructor(
    public id?: number,
    public idRol?: number | any,
    public nombre_Rol?: string | any,
    public nombre?: string | any,
    public usuario?: string | any,
    public password?: string | any,
    public direccion?: string | any,
    public idUbigeo_Usu?: number | any,
    public ubigeo?: string | any,
    public comisionLima_Usu?: string | any,
    public comisionProv_Usu?: string | any,
    public telefono?: string | any,
    public celular?: string | any,
    public ciudad?: string | any,
    public status?: boolean | any
  ){}
}
