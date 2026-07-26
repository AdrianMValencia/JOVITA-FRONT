import { Proveedor } from "src/app/modulos/mantenimientos/proveedor/model/proveedor";
import { ComprasDetalles } from "./comprasDetalles";
import { Comprobantes } from "src/app/shared/services/tipodocumento/comprobantes";

export class Compras{
  constructor(
    public id?: number | any,
    public idPuntoVenta?: number | any,
    public fechaCompra?: string | any,
    public idProveedor?: number | any,
    public rucProveedor?: string | any,
    public nombreProveedor?: string | any,
    public razonSocial?: string | any,
    public idTipoDocumento?: number | any,
    public nombreTipoDocumento?: string | any,
    public numeroTipoDocumento?: string | any,
    public procedencia?: string | any,
    public archivo?: string | any,
    public observaciones?: string | any,
    public status?: boolean | any,
    public created_at?: boolean | any,
    public opcion?: number | any,
    public proveedores?: Proveedor | any,
    public comprobantes?: Comprobantes | any,
    public detalles?: Array<ComprasDetalles> | any,
    public idProducto?: string | any,
    public totalCompras?: string | any,
    public percepcion?: string | any,
    public serieTipoDocumento?: string | any
  ){}
}
