import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs-compat';
import { Clientes } from '../Model/clientes';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  urlBase = environment.BASE_URL + 'clientes';
  urlUpload = environment.BASE_URL_UPLOAD + 'clientes/'

  constructor(private http: HttpClient){}

  cargarClientes(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  obtenerClientes(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  crudClientes(clientes: Clientes): Observable<any> {
    if(clientes.id === 0){
      return this.http.post(this.urlBase, clientes);
    }else{
      return this.http.put(this.urlBase + '/' + clientes.id, clientes);
    }
  }

  deleteClientes(clientes: Clientes): Observable<any> {
    return this.http.delete(this.urlBase + '/' + clientes.id);
  }

  cargarTipoCliente(): Observable<any> {
    return this.http.get(environment.BASE_URL + 'tipoDoi');
  }

  consultasSUNAT(documento: string, idPuntoVenta: string){
    return this.http.get(this.urlBase + '/buscarClientes/' + documento + '/' + idPuntoVenta);
  }
}
