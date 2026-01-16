import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

import { ProductosFaltantes } from '../models/productosFaltantes';

@Injectable({
  providedIn: 'root'
})
export class ProductosFaltantesService {

  urlBase = environment.BASE_URL + 'productosFaltantes';

  constructor(private http: HttpClient){}

  cargarProductosFaltantes(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  obtenerProductosFaltantes(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  crudProductosFaltantes(productosFaltantes: ProductosFaltantes): Observable<any> {
    if(productosFaltantes.id === 0){
      return this.http.post(this.urlBase, productosFaltantes);
    }else{
      return this.http.put(this.urlBase + '/' + productosFaltantes.id, productosFaltantes);
    }
  }

  deleteProductosFaltantes(productosFaltantes: ProductosFaltantes): Observable<any> {
    return this.http.delete(this.urlBase + '/' + productosFaltantes.id);
  }

  obtenerProductosFaltantesEditar(id: number): Observable<any> {
    return this.http.get(environment.BASE_URL + 'obtenerProductosFaltantesEditar/' + id);
  }

}
