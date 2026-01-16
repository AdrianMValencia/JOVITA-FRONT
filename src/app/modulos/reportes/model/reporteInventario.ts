export class ReporteInventario{
  constructor(
    public codigoBarra?: string | any,
    public idProducto?: number | any,
    public idCategoria?: number | any,
    public producto?: any | any,
    public categoria?: any | any,
    public costo?: string | any,
    public precio?: string | any,
    public existencia?: string | any,
    public productos?: any | any,
    public categorias?: any | any,
  ){}
}
