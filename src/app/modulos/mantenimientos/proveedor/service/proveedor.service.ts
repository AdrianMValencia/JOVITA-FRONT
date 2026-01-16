import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment.prod';
import { Observable } from 'rxjs-compat';
import { Proveedor } from '../model/proveedor';

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {

  urlBase = environment.BASE_URL + 'proveedores';
  urlUpload = environment.BASE_URL_UPLOAD + 'proveedor/'

  constructor(private http: HttpClient){}

  cargarProveedor(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  obtenerProveedor(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  crudProveedor(proveedor: Proveedor): Observable<any> {
    if(proveedor.id === 0){
      return this.http.post(this.urlBase, proveedor);
    }else{
      return this.http.put(this.urlBase + '/' + proveedor.id, proveedor);
    }
  }

  deleteCajas(proveedor: Proveedor): Observable<any> {
    return this.http.delete(this.urlBase + '/' + proveedor.id, { body: proveedor });
  }

}
