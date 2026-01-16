import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.prod';
import { Observable } from 'rxjs';
import { TiposPago } from '../models/tiposPago';

@Injectable()
export class TipospagoService {
  urlBase = environment.BASE_URL + 'tiposPago';
  urlUpload = environment.BASE_URL_UPLOAD + 'tiposPago/'

  constructor(private http: HttpClient){}

  cargarTiposPago(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  obtenerTiposPago(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  crudTiposPago(tiposPago: TiposPago): Observable<any> {
    if(tiposPago.id === 0){
      return this.http.post(this.urlBase, tiposPago);
    }else{
      return this.http.put(this.urlBase + '/' + tiposPago.id, tiposPago);
    }
  }

  deleteTiposPago(tiposPago: TiposPago): Observable<any> {
    return this.http.delete(this.urlBase + '/' + tiposPago.id, { body: tiposPago });
  }
}
