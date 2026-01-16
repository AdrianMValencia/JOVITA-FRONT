import { TiposPago } from "../../mantenimientos/tipospagos/models/tiposPago";

export class ComparacionVentaVendedores{
  constructor(
    public puntoVenta: string | any,
    public fecha: string | any,
    public vendedor: string | any,
    public tipoPago: string | any,
    public monto: string | any,
    public total: string | any
  ){}
}
