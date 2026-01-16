import { Categorias } from '../../categorias/model/categorias';
import { UnidadMedidas } from '../../unidadmedidas/models/unidadmedidas';
export class Productos{
  constructor(
    public id?: number | any,
    public idPuntoVenta?: number | any,
    public nombrePuntoVenta?: string | any,
    public nombre?: string | any,
    public codigoAntiguo?: string | any,
    public codigoBarra?: string | any,
    public idCategoria?: number | any,
    public nombreCategoria?: string | any,
    public idUm?: string | any,
    public nombreUm?: string | any,
    public stockMinimo?: number | any,
    public stockMaximo?: number | any,
    public stockActual?: string | any,
    public stockAlerta?: string | any,
    public precio?: string | any,
    public precioMinimo?: string | any,
    public precioMaximo?: string | any,
    public precioMayor?: string | any,
    public observaciones?: string | any,
    public status?: boolean | any,
    public created_at?: boolean | any,
    public opcion?: number,
    public categorias?: Categorias | any,
    public unidadMedidas?: UnidadMedidas | any,
    public precioCompra?: string | any,
    public imagen?: string | any,
    public slider?: boolean | any,
    public banner?: number | any,
    public descuento?: string | any
  ){}
}
