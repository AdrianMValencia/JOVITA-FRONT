import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs-compat';
import { environment } from 'src/environments/environment.prod';

import { ActualizacionInventarios } from '../models/inventarios';
import { InventariosDetalles } from '../models/inventariosDetalles';

@Injectable({
  providedIn: 'root'
})
export class ActualizacionInventariosService {

  urlBase = environment.BASE_URL + 'actualizacionInventarios';
  urlUpload = environment.BASE_URL_UPLOAD + 'actualizacionInventarios/';

  constructor(private http: HttpClient){}

  cargarActualizacionInventarios(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  obtenerActualizacionInventarios(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  buscarProductos(producto: InventariosDetalles): Observable<any> {
    return this.http.post(this.urlBase + 'BuscarProductos', producto);
  }

  crudActualizacionInventarios(inventarios: ActualizacionInventarios): Observable<any> {
    if(inventarios.id === 0){
      return this.http.post(this.urlBase, inventarios);
    }else{
      return this.http.put(this.urlBase + '/' + inventarios.id, inventarios);
    }
  }

  deleteActualizacionInventarios(inventarios: ActualizacionInventarios): Observable<any> {
    return this.http.delete(this.urlBase + '/' + inventarios.id);
  }

  buscarPorFecha(fechaInicio: any, fechaFin: any, idPuntoVenta: number): Observable<any>{
    return this.http.post(environment.BASE_URL + 'buscarPorFechaActualizacionInventarios', {fechaInicio, fechaFin, idPuntoVenta});
  }
}
