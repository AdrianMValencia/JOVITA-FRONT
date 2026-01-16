export class DetallesCotizacion{
    constructor(
        public id?: number,
        public idCotizacion?: number,
        public idProducto?: string | any,
        public nombre?: string | any,
        public precio?: string | any,
        public cantidad?: string | any,
        public subtotal?: string | any,
        public igv?: string | any,
        public total?: string | any,
        public porcentajeDesc?: string | any,
        public montoDesc?: string | any,
        public descripcion?: string | any,
        public status?: number | any
    ){}
}
