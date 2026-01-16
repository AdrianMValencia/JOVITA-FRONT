import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from '@reactivex/rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable()
export class UbigeoService {
  urlBase = environment.BASE_URL + 'ubigeo';
  constructor(private http: HttpClient){}

  cargarUbigeo(): Observable<any> {
    return this.http.get(this.urlBase);
  }
}
