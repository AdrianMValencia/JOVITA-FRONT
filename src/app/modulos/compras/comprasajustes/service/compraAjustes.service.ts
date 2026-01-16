import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs-compat';
import { CompraAjustes } from '../model/compraAjustes';

@Injectable({
  providedIn: 'root'
})
export class CompraAjustesService {

  urlBase = environment.BASE_URL + 'compraAjustes';

  constructor(private http: HttpClient){}

  cargarProductoAjustes(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  obtenerProductoAjustes(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  crudProductoAjustes(compraAjustes: CompraAjustes): Observable<any> {
    if(compraAjustes.id === 0){
      return this.http.post(this.urlBase, compraAjustes);
    }else{
      return this.http.put(this.urlBase + '/' + compraAjustes.id, compraAjustes);
    }
  }

  deleteProductoAjustes(compraAjustes: CompraAjustes): Observable<any> {
    return this.http.delete(this.urlBase + '/' + compraAjustes.id);
  }

}
