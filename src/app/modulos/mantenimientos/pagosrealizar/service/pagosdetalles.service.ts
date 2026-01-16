import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { DetallesPagos } from '../models/detallesPagos';

@Injectable()
export class PagosdetallesService {
  urlBase = environment.BASE_URL + 'pagosDetalles';
  urlUpload = environment.BASE_URL_UPLOAD + 'pagosDetalles/'

  constructor(private http: HttpClient){}

  obtenerPagosRealizar(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  crudPagosRealizar(pagosrealizar: DetallesPagos): Observable<any> {
    if(pagosrealizar.id === 0){
      return this.http.post(this.urlBase, pagosrealizar);
    }else{
      return this.http.put(this.urlBase + '/' + pagosrealizar.id, pagosrealizar);
    }
  }

  deletePagosRealizar(pagosrealizar: DetallesPagos): Observable<any> {
    return this.http.delete(this.urlBase + '/' + pagosrealizar.id, { body: pagosrealizar });
  }
}
