import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { Devoluciones } from '../models/devoluciones';

@Injectable()
export class DevolucionesService {
  urlBase = environment.BASE_URL + 'devoluciones';

  constructor(private http: HttpClient){}

  crudDevoluciones(devoluciones: Devoluciones[]): Observable<any> {
  return this.http.post(this.urlBase, devoluciones);
  }

  cargarDevolucioness(): Observable<any> {
    return this.http.get(this.urlBase);
  }
}
