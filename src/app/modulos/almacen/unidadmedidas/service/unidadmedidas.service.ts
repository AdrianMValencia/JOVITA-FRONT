import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { UnidadMedidas } from '../models/unidadmedidas';

@Injectable()
export class UnidadmedidasService {
  urlBase = environment.BASE_URL + 'unidadMedidas';

  constructor(private http: HttpClient){}

  cargarUnidadMedidas(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  obtenerUnidadMedidas(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  crudUnidadMedidas(unidadMedidas: UnidadMedidas): Observable<any> {
    if(unidadMedidas.id === 0){
      return this.http.post(this.urlBase, unidadMedidas);
    }else{
      return this.http.put(this.urlBase + '/' + unidadMedidas.id, unidadMedidas);
    }
  }

  deleteUnidadMedidas(unidadMedidas: UnidadMedidas): Observable<any> {
    return this.http.delete(this.urlBase + '/' + unidadMedidas.id);
  }
}
