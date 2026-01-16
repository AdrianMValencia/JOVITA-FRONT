import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { PuntoVentasUser } from '../models/puntoVentasUser';

@Injectable()
export class PuntoventauserService {
  urlBase = environment.BASE_URL + 'puntoVentasUser';

  constructor(
    private http: HttpClient
  ) {}

  cargarPuntoVentaUser(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  obtenerPuntoVentaUser(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  crudPuntoVentaUser(puntoVentasUser: PuntoVentasUser): Observable<any> {
    if(puntoVentasUser.id === 0){
      return this.http.post(this.urlBase, puntoVentasUser);
    }else{
      return this.http.put(this.urlBase + '/' + puntoVentasUser.id, puntoVentasUser);
    }
  }

  deletePuntoVentaUser(puntoVentasUser: PuntoVentasUser): Observable<any> {
    return this.http.delete(this.urlBase + '/' + puntoVentasUser.id);
  }
}
