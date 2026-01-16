import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.prod';
import { Observable } from 'rxjs-compat';
import { NumeracionTickets } from '../models/numeracionTickets';

@Injectable()
export class NumeracionticketsService {
  urlBase = environment.BASE_URL + 'numeracionTickets';

  constructor(private http: HttpClient){}

  cargarNumeracionTickets(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  obtenerNumeracionTickets(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  crudNumeracionTickets(numeracionTickets: NumeracionTickets): Observable<any> {
    if(numeracionTickets.id === 0){
      return this.http.post(this.urlBase, numeracionTickets);
    }else{
      return this.http.put(this.urlBase + '/' + numeracionTickets.id, numeracionTickets);
    }
  }

  deleteNumeracionTickets(numeracionTickets: NumeracionTickets): Observable<any> {
    return this.http.delete(this.urlBase + '/' + numeracionTickets.id, { body: numeracionTickets });
  }
}
