import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.prod';
import { Observable } from 'rxjs-compat';
import { Ubicaciones } from '../models/ubicaciones';

@Injectable()
export class UbicacionesService {
  urlBase = environment.BASE_URL + 'ubicaciones';

  constructor(private http: HttpClient){}

  cargarUbicaciones(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  obtenerUbicaciones(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  crudUbicaciones(ubicaciones: Ubicaciones): Observable<any> {
    if(ubicaciones.id === 0){
      return this.http.post(this.urlBase, ubicaciones);
    }else{
      return this.http.put(this.urlBase + '/' + ubicaciones.id, ubicaciones);
    }
  }

  deleteUbicaciones(ubicaciones: Ubicaciones): Observable<any> {
    return this.http.delete(this.urlBase + '/' + ubicaciones.id);
  }
}
