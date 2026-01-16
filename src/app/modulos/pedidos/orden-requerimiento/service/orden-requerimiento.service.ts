import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

import { OrdenRequerimiento } from '../model/ordenRequerimiento';

@Injectable({
  providedIn: 'root'
})
export class OrdenRequerimientoService {

urlBase = environment.BASE_URL + 'ordenRequerimiento';
  urlUpload = environment.BASE_URL_UPLOAD + 'ordenRequerimiento/';

  constructor(private http: HttpClient){}

  cargarOrdenRequerimiento(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  cargarOrdenRequerimientoDetalles(): Observable<any> {
    return this.http.get(this.urlBase + 'detalles');
  }

  obtenerOrdenRequerimiento(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  buscarProductos(producto: string): Observable<any> {
    const param: any = JSON.stringify(producto);
    return this.http.post(this.urlBase + 'buscarProductos', param);
  }

  crudOrdenRequerimiento(ordenRequerimiento: OrdenRequerimiento): Observable<any> {
    if(ordenRequerimiento.id === 0){
      return this.http.post(this.urlBase, ordenRequerimiento);
    }else{
      return this.http.put(this.urlBase + '/' + ordenRequerimiento.id, ordenRequerimiento);
    }
  }

  deleteOrdenRequerimiento(ordenRequerimiento: OrdenRequerimiento): Observable<any> {
    return this.http.delete(this.urlBase + '/' + ordenRequerimiento.id);
  }

  buscarPorFecha(page: number = 1, per_page: number = 10, fechaInicio: any, fechaFin: any, estadoActual: any, idPuntoVenta: number): Observable<any>{
    return this.http.post(environment.BASE_URL + 'buscarPorFechaOrdenRequerimiento', {fechaInicio, fechaFin, idPuntoVenta, estadoActual, page, per_page});
  }

  cargarPDF(id: number): Observable<any> {
    return this.http.get(environment.BASE_URL + 'reporteOrdenRequerimiento/' + id, { responseType: "arraybuffer" });
  }

}
