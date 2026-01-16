import { InventariosDetalles } from './inventariosDetalles';

export class ActualizacionInventarios{
  constructor(
    public id? :number | any,
    public idPuntoVenta?: number | any,
    public puntoVenta?: string | any,
    public created_at?: string | any,
    public fechaInicio?: string | any,
    public fechaFin?: string | any,
    public idCategoria?: string | any,
    public categoria?: string | any,
    public detalles?: InventariosDetalles | any
  ){}
}
