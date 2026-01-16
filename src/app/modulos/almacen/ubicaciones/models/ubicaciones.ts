import { Almacenes } from "../../almacenes/models/almacenes";
import { Productos } from "../../productos/model/productos";

export class Ubicaciones{
  constructor(
    public id?: number,
    public idPuntoVenta?: number | any,
    public idProducto?: number | any,
    public nombre?: string | any,
    public idAlmacen?: number | any,
    public nombreAlmacen?: string | any,
    public ubicacion1?: string | any,
    public anaquel1?: string | any,
    public gaveta1?: string | any,
    public numeroGaveta1?: string | any,
    public ubicacion2?: string | any,
    public anaquel2?: string | any,
    public gaveta2?: string | any,
    public numeroGaveta2?: string | any,
    public observaciones?: string | any,
    public status?: boolean | any,
    public created_at?: boolean | any,
    public opcion?: number,
    public productos?: Productos | any,
    public almacen?: Almacenes | any
  ){}
}
