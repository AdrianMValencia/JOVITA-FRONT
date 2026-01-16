import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { AjusteInventario } from '../models/ajuste-inventario';

@Injectable({
  providedIn: 'root'
})
export class AjustesInventarioService {

  urlBase = environment.BASE_URL + 'ajustesInventario';

  constructor(private http: HttpClient){}

  cargarAjustesInventario(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  obtenerAjusteInventario(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  crudAjusteInventario(ajuste: AjusteInventario): Observable<any> {
    if(ajuste.id === 0){
      return this.http.post(this.urlBase, ajuste);
    }else{
      return this.http.put(this.urlBase + '/' + ajuste.id, ajuste);
    }
  }

  deleteAjusteInventario(ajuste: AjusteInventario): Observable<any> {
    return this.http.delete(this.urlBase + '/' + ajuste.id);
  }

}
