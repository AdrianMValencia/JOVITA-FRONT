import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.prod';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  obtenerProductosPaginado(id: number, page: number, perPage: number): Observable<any> {
    return this.http.get(`${this.urlBase}/${id}?page=${page}&perPage=${perPage}`);
  }

  cargarProductosVentas(id: number): Observable<any> {
    return this.http.get(environment.BASE_URL + 'cargarProductosVentas/' + id);
  }

  /**
   * Búsqueda POS: texto vacío → lista vacía sin llamar al API.
   * Query opcional `limite` (máx. 200 en backend).
   */
  buscarProductos(
    idPuntoVenta: number,
    texto: string,
    opciones?: { limite?: number }
  ): Observable<any> {
    const t = (texto ?? '').trim();
    if (!t) {
      return of({ productos: [], status: 200 });
    }
    const encoded = encodeURIComponent(t);
    let params = new HttpParams();
    if (opciones?.limite != null && opciones.limite > 0) {
      const lim = Math.min(200, Math.max(1, Math.floor(opciones.limite)));
      params = params.set('limite', String(lim));
    }
    return this.http.get(`${this.urlBase}/buscar/${idPuntoVenta}/${encoded}`, { params });
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
