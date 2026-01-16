export class Permisos{
  constructor(
    public id?: number | any,
    public idSubModulo?: number | any,
    public nombre?: string | any,
    public tipo?: number | any,
    public idRol?: number | any,
    public idUsuario?: number | any,
    public nombreRol?: string | any,
    public completed?: boolean | any,
    public operaciones?: Array<Permisos> | any,
    public children?: Array<Permisos> | any
  ){}
}
