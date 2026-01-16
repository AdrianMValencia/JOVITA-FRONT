import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Productos } from '../model/productos';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  urlBase = environment.BASE_URL + 'productos';

  constructor(private http: HttpClient){}

  cargarProductos(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  obtenerProductos(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  cargarProductosVentas(id: number): Observable<any> {
    return this.http.get(environment.BASE_URL + 'cargarProductosVentas/' + id);
  }

  buscarProductos(id: number, texto: string): Observable<any> {
    return this.http.get(this.urlBase + '/buscar/' + id + '/' + texto);
  }

  obtenerProductosCodigoBarra(codigoBarras: string, id: number): Observable<any> {
    return this.http.get(this.urlBase + '/codigoBarras/' + id + '/' + codigoBarras);
  }

  crudProductos(productos: Productos): Observable<any> {
    if(productos.id === 0){
      return this.http.post(this.urlBase, productos);
    }else{
      return this.http.put(this.urlBase + '/' + productos.id, productos);
    }
  }

  deleteProductos(productos: Productos): Observable<any> {
    return this.http.delete(this.urlBase + '/' + productos.id);
  }

  obtenerBarCode(id: number): Observable<any> {
    return this.http.get(environment.BASE_URL + 'imprimir/' + id, { responseType: 'text' });
  }

  subirImagenProducto(id: number, imagen: File): Observable<any> {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('imagen', imagen);
    return this.http.post(environment.BASE_URL + 'productos/upload-imagen', formData);
  }

  deleteImagenProducto(id: number): Observable<any> {
    return this.http.post(environment.BASE_URL + 'productos/delete-imagen', { id });
  }
}
