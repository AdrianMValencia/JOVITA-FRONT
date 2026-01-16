import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.prod';
import { Observable } from 'rxjs-compat';
import { PagosRealizar } from '../models/pagosrealizar';

@Injectable()
export class PagosrealizarService {
  urlBase = environment.BASE_URL + 'pagosRealizar';
  urlUpload = environment.BASE_URL_UPLOAD + 'pagosRealizar/'

  constructor(private http: HttpClient){}

  cargarPagosRealizar(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  obtenerPagosRealizar(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  crudPagosRealizar(pagosrealizar: PagosRealizar): Observable<any> {
    if(pagosrealizar.id === 0){
      return this.http.post(this.urlBase, pagosrealizar);
    }else{
      return this.http.put(this.urlBase + '/' + pagosrealizar.id, pagosrealizar);
    }
  }

  deletePagosRealizar(pagosrealizar: PagosRealizar): Observable<any> {
    return this.http.delete(this.urlBase + '/' + pagosrealizar.id, { body: pagosrealizar });
  }
}
