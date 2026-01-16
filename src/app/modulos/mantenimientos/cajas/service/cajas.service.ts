import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { Cajas } from '../models/cajas';

@Injectable()
export class CajasService {
  urlBase = environment.BASE_URL + 'cajas';

  constructor(private http: HttpClient){}

  cargarCajas(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  obtenerCajas(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  crudCajas(cajas: Cajas): Observable<any> {
    if(cajas.id === 0){
      return this.http.post(this.urlBase, cajas);
    }else{
      return this.http.put(this.urlBase + '/' + cajas.id, cajas);
    }
  }

  deleteCajas(cajas: Cajas): Observable<any> {
    return this.http.delete(this.urlBase + '/' + cajas.id);
  }
}
