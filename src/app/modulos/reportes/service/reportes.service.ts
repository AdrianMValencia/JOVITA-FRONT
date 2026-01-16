import { environment } from './../../../../environments/environment.prod';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs-compat';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {

  urlBase = environment.BASE_URL + 'reportes/';

  constructor(private http: HttpClient){}

  cargarReporteInventario(id: number): Observable<any> {
    return this.http.get(this.urlBase + 'inventario/' + id);
  }

  cargarReporteMovmiento(id: number): Observable<any> {
    return this.http.get(this.urlBase + 'movimientos/' + id);
  }

  cargarReporteVentasTotales(fechaInicio: any, fechaFin: any, idPuntoVenta: number): Observable<any> {
    return this.http.post(environment.BASE_URL + 'ventasTotales/ventasMes', {fechaInicio, fechaFin, idPuntoVenta});
  }

  cargarReporteVentasTotalesAnio(fechaInicio: any, fechaFin: any, idPuntoVenta: number): Observable<any> {
    return this.http.post(environment.BASE_URL + 'ventasTotales/ventasAnio', {fechaInicio, fechaFin, idPuntoVenta});
  }

  cargarComparacionVentasVendedores(id: number): Observable<any> {
    return this.http.get(this.urlBase + 'comparacionVentasVendedores/' + id);
  }

  cargarReporteProductosPuntoVenta(id: number): Observable<any> {
    return this.http.get(this.urlBase + 'reporteProductosPuntoVenta/' + id);
  }

  cargarReporteGananciaTiendas(fechaInicio: any, fechaFin: any, idPuntoVenta: number): Observable<any> {
    return this.http.post(environment.BASE_URL + 'gananciaTiendas', {fechaInicio, fechaFin, idPuntoVenta});
  }

  valorizacionProductosTienda(id: number): Observable<any> {
    return this.http.get(this.urlBase + 'valorizacionProductosTienda/' + id);
  }

  flujoInversion(id: number): Observable<any> {
    return this.http.get(this.urlBase + 'flujoInversion/' + id);
  }

  cargarReporteValorizado(id: number): Observable<any> {
    return this.http.get(environment.BASE_URL + 'valorizadoCrud/' + id);
  }

  cargarReporteMensualporVendedorComponent(id: number): Observable<any> {
    return this.http.get(environment.BASE_URL + 'reporteMensualporVendedorComponent/' + id);
  }

  comprasResumidas(fechaInicio: any, fechaFin: any, idProveedor: any, idPuntoVenta: number): Observable<any>{
    return this.http.post(environment.BASE_URL + 'comprasResumidas', {fechaInicio, fechaFin, idProveedor, idPuntoVenta});
  }

  ventasComprasDiarias(fechaInicio: any, fechaFin: any, idPuntoVenta: number): Observable<any>{
    return this.http.post(environment.BASE_URL + 'ventasComprasDiarias', {fechaInicio, fechaFin, idPuntoVenta});
  }

  sobranteVsFaltantes(fechaInicio: any, fechaFin: any, idPuntoVenta: number): Observable<any>{
    return this.http.post(environment.BASE_URL + 'sobranteVsFaltantes', {fechaInicio, fechaFin, idPuntoVenta});
  }

  proveedoresProductos(id: number): Observable<any>{
    return this.http.get(environment.BASE_URL + 'proveedoresProductos/' + id);
  }

  productosStockMinimo(id: number): Observable<any>{
    return this.http.get(this.urlBase + 'productosStockMinimo/' + id);
  }
}
