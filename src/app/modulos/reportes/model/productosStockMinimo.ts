export class ProductosStockMinimo {
  puntoVenta: string;
  categoria: string;
  codigoBarra: string;
  nombreProducto: string;
  stockMinimo: number;
  stockActual: number;

  constructor(
    puntoVenta: string = '',
    categoria: string = '',
    codigoBarra: string = '',
    nombreProducto: string = '',
    stockMinimo: number = 0,
    stockActual: number = 0
  ) {
    this.puntoVenta = puntoVenta;
    this.categoria = categoria;
    this.codigoBarra = codigoBarra;
    this.nombreProducto = nombreProducto;
    this.stockMinimo = stockMinimo;
    this.stockActual = stockActual;
  }
}

export class ProductosStockMinimoResponse {
  productosStockMinimo: ProductosStockMinimo[];
  stockMinimo: number;
  stockAlerta: number;
  totalProductos: number;
  status: number;

  constructor(
    productosStockMinimo: ProductosStockMinimo[] = [],
    stockMinimo: number = 0,
    stockAlerta: number = 0,
    totalProductos: number = 0,
    status: number = 200
  ) {
    this.productosStockMinimo = productosStockMinimo;
    this.stockMinimo = stockMinimo;
    this.stockAlerta = stockAlerta;
    this.totalProductos = totalProductos;
    this.status = status;
  }
}
