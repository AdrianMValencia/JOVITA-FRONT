import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs-compat';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Pedidos } from '../model/pedidos';

@Injectable({
  providedIn: 'root'
})
export class PedidosService {

  urlBase = environment.BASE_URL + 'pedidos';
  urlUpload = environment.BASE_URL_UPLOAD + 'pedidos/';

  constructor(private http: HttpClient){}

  cargarPedidos(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  cargarPedidosDetalles(): Observable<any> {
    return this.http.get(this.urlBase + 'detalles');
  }

  obtenerPedidos(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  buscarProductos(producto: string): Observable<any> {
    const param: any = JSON.stringify(producto);
    return this.http.post(this.urlBase + 'buscarProductos', param);
  }

  crudPedidos(pedidos: Pedidos): Observable<any> {
    if(pedidos.id === 0){
      return this.http.post(this.urlBase, pedidos);
    }else{
      return this.http.put(this.urlBase + '/' + pedidos.id, pedidos);
    }
  }

  deletePedidos(pedidos: Pedidos): Observable<any> {
    return this.http.delete(this.urlBase + '/' + pedidos.id);
  }

  buscarPorFecha(page: number = 1, per_page: number = 10, fechaInicio: any, fechaFin: any, idPuntoVenta: number): Observable<any>{
    return this.http.post(environment.BASE_URL + 'buscarPorFechaPedidos', {fechaInicio, fechaFin, idPuntoVenta, page, per_page});
  }

  cargarPDF(id: number): Observable<any> {
    return this.http.get(environment.BASE_URL + 'reportePedido/' + id, { responseType: "arraybuffer" });
  }
}
