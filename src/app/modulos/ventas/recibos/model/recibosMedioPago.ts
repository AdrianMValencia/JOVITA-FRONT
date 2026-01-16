import { Recibos } from "./recibos";

export class RecibosMedioPago{
  constructor(
    public id?: number,
    public idRecibo?: number | any,
    public idMedioPago?: number | any,
    public importe?: string | any,
    public nota?: string | any,
    public llave?: any,
    public recibos?: Recibos | any,
    public created_at?: string | any
  ){}
}
