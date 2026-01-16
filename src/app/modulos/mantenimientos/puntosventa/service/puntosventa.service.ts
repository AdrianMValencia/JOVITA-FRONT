import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { PuntosVenta } from '../model/puntosVenta';

@Injectable()
export class PuntosventaService {
  urlBase = environment.BASE_URL + 'puntosVenta';

  constructor(private http: HttpClient){}

  cargarPuntosVenta(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  obtenerPuntosVenta(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  cargarPuntosVentaAbastecimiento(id: number): Observable<any> {
    return this.http.get(environment.BASE_URL + 'abastecimiento/' + id);
  }

  cargarPuntosVentaDevoluciones(id: number): Observable<any> {
    return this.http.get(environment.BASE_URL + 'devoluciones/' + id);
  }

  crudPuntosVenta(puntosVenta: PuntosVenta): Observable<any> {
    if(puntosVenta.id === 0){
      return this.http.post(this.urlBase, puntosVenta);
    }else{
      return this.http.put(this.urlBase + '/' + puntosVenta.id, puntosVenta);
    }
  }

  deletePuntosVenta(puntosVenta: PuntosVenta): Observable<any> {
    return this.http.delete(this.urlBase + '/' + puntosVenta.id, { body: puntosVenta });
  }
}
