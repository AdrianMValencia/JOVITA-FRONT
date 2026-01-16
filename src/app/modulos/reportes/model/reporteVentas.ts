export class ReporteVentas{
  constructor(
    public fecha: string | any,
    public venta: string | any,
    public compra: string | any,
    public ganancia: string | any,
    public idPuntoVenta?: string | any,
    public fechaInicio?: string | any,
    public fechaFin?: string | any
  ){}
}
