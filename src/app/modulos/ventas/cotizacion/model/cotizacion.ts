import { Clientes } from "src/app/modulos/mantenimientos/clientes/Model/clientes";
import { DetallesCotizacion } from "./detallesCotizacion";

export class Cotizacion{
    constructor(
        public id?: number | any,
        public idPuntoVenta?: number | any,
        public puntoventa?: string | any,  
        public idCliente?: string | any,
        public documento?: string | any,
        public razonSocial?: string | any,
        public fechaCotizacion?: string | any,
        public numero?: string | any,
        public subtotal?: string | any,
        public total?: string | any,
        public impuesto?: string | any,
        public status?: number | any,
        public detalles?: Array<DetallesCotizacion> | any,
        public opcion?: string | any,
        public clientes?: Array<Clientes> | any
    ){}
}
