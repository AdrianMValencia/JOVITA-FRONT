import { PuntosVenta } from "../../puntosventa/model/puntosVenta";

export class SeriesTickets{
  constructor(
    public id?: number | any,
    public serie?: string | any,
    public idPuntoVenta?: number | any,
    public observaciones?: string | any,
    public status?: boolean | any,
    public created_at?: string | any,
    public opcion?: string | any,
    public puntoventa?: PuntosVenta
  ){}
}
