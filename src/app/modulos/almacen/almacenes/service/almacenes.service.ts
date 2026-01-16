import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.prod';
import { Observable } from 'rxjs-compat';
import { Almacenes } from '../models/almacenes';

@Injectable()
export class AlmacenesService {
  urlBase = environment.BASE_URL + 'almacenes';

  constructor(private http: HttpClient){}

  cargarAlmacenes(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  obtenerAlmacenes(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  crudAlmacenes(almacenes: Almacenes): Observable<any> {
    if(almacenes.id === 0){
      return this.http.post(this.urlBase, almacenes);
    }else{
      return this.http.put(this.urlBase + '/' + almacenes.id, almacenes);
    }
  }

  deleteAlmacenes(almacenes: Almacenes): Observable<any> {
    return this.http.delete(this.urlBase + '/' + almacenes.id);
  }
}
