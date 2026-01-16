import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs-compat';
import { Depositos } from '../model/depositos';

@Injectable({
  providedIn: 'root'
})
export class DepositosService {

  urlBase = environment.BASE_URL + 'depositos';
  urlUpload = environment.BASE_URL_UPLOAD + 'depositos/'

  constructor(private http: HttpClient){}

  cargarDepositos(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  obtenerDepositos(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  crudDepositos(depositos: Depositos): Observable<any> {
    if(depositos.id === 0){
      return this.http.post(this.urlBase, depositos);
    }else{
      return this.http.put(this.urlBase + '/' + depositos.id, depositos);
    }
  }

  deleteDepositos(depositos: Depositos): Observable<any> {
    return this.http.delete(this.urlBase + '/' + depositos.id);
  }
}
