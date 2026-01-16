import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs-compat';
import { Compras } from '../model/compras';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ComprasService {

  urlBase = environment.BASE_URL + 'compras';
  urlUpload = environment.BASE_URL_UPLOAD + 'compras/';

  constructor(private http: HttpClient){}

  cargarCompras(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  cargarComprasDetalles(): Observable<any> {
    return this.http.get(this.urlBase + 'detalles');
  }

  obtenerCompras(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  buscarProductos(producto: string): Observable<any> {
    const param: any = JSON.stringify(producto);
    return this.http.post(this.urlBase + 'buscarProductos', param);
  }

  crudCompras(compras: Compras): Observable<any> {
    if(compras.id === 0){
      return this.http.post(this.urlBase, compras);
    }else{
      return this.http.put(this.urlBase + '/' + compras.id, compras);
    }
  }

  deleteCompras(compras: Compras): Observable<any> {
    return this.http.delete(this.urlBase + '/' + compras.id);
  }

  buscarPorFecha(page: number = 1, per_page: number = 10, fechaInicio: any, fechaFin: any, idPuntoVenta: number): Observable<any>{
    return this.http.post(environment.BASE_URL + 'buscarPorFechaCompras', {fechaInicio, fechaFin, idPuntoVenta, page, per_page});
  }
}
