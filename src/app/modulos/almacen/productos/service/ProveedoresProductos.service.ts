import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

import { ProveedoresProductos } from '../model/proveedoresProductos';

@Injectable({
  providedIn: 'root'
})
export class ProveedoresProductosService {

  urlBase = environment.BASE_URL + 'productosProveedores';

  constructor(private http: HttpClient){}

  cargarProveedoresProductos(id: number, idProducto: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id + '/' + idProducto);
  }

  obtenerProveedoresProductos(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  crudProveedoresProductos(productos: ProveedoresProductos): Observable<any> {
    if(productos.id === 0){
      return this.http.post(this.urlBase, productos);
    }else{
      return this.http.put(this.urlBase + '/' + productos.id, productos);
    }
  }

  deleteProveedoresProductos(productos: ProveedoresProductos): Observable<any> {
    return this.http.delete(this.urlBase + '/' + productos.id);
  }


}
