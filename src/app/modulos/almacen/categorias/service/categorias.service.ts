import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs-compat';
import { Categorias } from '../model/categorias';

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {

  urlBase = environment.BASE_URL + 'categorias';

  constructor(private http: HttpClient){}

  cargarCategorias(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  obtenerCategorias(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  crudCategorias(categorias: Categorias): Observable<any> {
    if(categorias.id === 0){
      return this.http.post(this.urlBase, categorias);
    }else{
      return this.http.put(this.urlBase + '/' + categorias.id, categorias);
    }
  }

  deleteCategorias(categorias: Categorias): Observable<any> {
    return this.http.delete(this.urlBase + '/' + categorias.id);
  }

  subirImagenCategoria(id: number, imagen: File): Observable<any> {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('imagen', imagen);
    return this.http.post(environment.BASE_URL + 'categorias/upload-imagen', formData);
  }

  deleteImagenCategoria(id: number): Observable<any> {
    return this.http.post(environment.BASE_URL + 'categorias/delete-imagen', { id });
  }
}
