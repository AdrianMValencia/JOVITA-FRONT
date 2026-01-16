import { Productos } from "src/app/modulos/almacen/productos/model/productos";

export class ProductosFaltantes{
  constructor(
    public id?: number | any,
    public idPuntoVenta?: string | any,
    public puntoVenta?: string | any,
    public idUsuario?: string | any,
    public usuario?: string | any,
    public fecha?: string | any,
    public idProducto?: string | any,
    public codigo?: string | any,
    public producto?: string | any,
    public precioVenta?: string | any,
    public cantidad?: string | any,
    public idCategoria?: string | any,
    public categoria?: string | any,
    public total?: string | any,
    public productos?: Productos | any
  ){}
}
