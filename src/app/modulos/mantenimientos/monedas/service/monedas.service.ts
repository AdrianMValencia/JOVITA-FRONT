import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs-compat';
import { Monedas } from '../model/monedas';

@Injectable({
  providedIn: 'root'
})
export class MonedasService {

  urlBase = environment.BASE_URL + 'monedas';

  constructor(private http: HttpClient){}

  cargarMonedas(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  obtenerMonedas(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  crudMonedas(monedas: Monedas): Observable<any> {
    if(monedas.id === 0){
      return this.http.post(this.urlBase, monedas);
    }else{
      return this.http.put(this.urlBase + '/' + monedas.id, monedas);
    }
  }

  deleteMonedas(monedas: Monedas): Observable<any> {
    return this.http.delete(this.urlBase + '/' + monedas.id, { body: monedas });
  }

}
