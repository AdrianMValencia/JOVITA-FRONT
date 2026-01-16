export class DatosEmpresa{
  constructor(
    public id?: number | any,
    public idUsuario?: string | any,
    public ruc?: string | any,
    public nombreLegal?: string | any,
    public nombreComercial?: string | any,
    public logo?: string | any,
    public telefonos?: string | any,
    public correoEmpresa?: string | any,
    public direccion?: string | any,
    public pagina?: string | any,
    public cuentasBancarias?: string | any,
    public nombreBanco?: string | any,
    public codigoInterbancario?: string | any
  ){}
}
