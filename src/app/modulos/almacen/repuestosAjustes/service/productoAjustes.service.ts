import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs-compat';
import { ProductoAjustes } from '../model/productoAjustes';

@Injectable({
  providedIn: 'root'
})
export class ProductoAjustesService {

  urlBase = environment.BASE_URL + 'productoAjustes';

  constructor(private http: HttpClient){}

  cargarProductoAjustes(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  obtenerProductoAjustes(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  crudProductoAjustes(productoAjustes: ProductoAjustes): Observable<any> {
    if(productoAjustes.id === 0){
      return this.http.post(this.urlBase, productoAjustes);
    }else{
      return this.http.put(this.urlBase + '/' + productoAjustes.id, productoAjustes);
    }
  }

  deleteProductoAjustes(productoAjustes: ProductoAjustes): Observable<any> {
    return this.http.delete(this.urlBase + '/' + productoAjustes.id);
  }

}
