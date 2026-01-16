import { Cotizacion } from '../model/cotizacion';
import { Observable } from 'rxjs-compat';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment.prod';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CotizacionService {

  urlBase = environment.BASE_URL + 'cotizacion';

  constructor(private http: HttpClient){}

  cargarCotizacion(): Observable<any> {
    return this.http.get(this.urlBase + '/');
  }

  obtenerrCotizacion(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  cargarDetalles(): Observable<any> {
    return this.http.get(environment.BASE_URL + 'cotizacionDetalles');
  }

  cargarPDF(id: number): Observable<any> {
    return this.http.get(environment.BASE_URL + 'reporteCotizacion/' + id, { responseType: "arraybuffer" });
  }

  crudCotizacion(cotizacion: Cotizacion): Observable<any> {
    if(cotizacion.id === 0){
      return this.http.post(this.urlBase, cotizacion);
    }else{
      return this.http.put(this.urlBase + '/' + cotizacion.id, cotizacion);
    }
  }

  cambiarEstado(estado: number, id: number): Observable<any> {
  return this.http.put(this.urlBase + '/cambiarEstado/' + id, { estado });
  }
}
