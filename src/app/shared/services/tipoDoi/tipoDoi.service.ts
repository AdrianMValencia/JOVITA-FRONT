import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from '@reactivex/rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable()
export class TipoDoiService {
  urlBase = environment.BASE_URL + 'tipoDoi';
  constructor(private http: HttpClient){}

  cargarTipoDoi(): Observable<any> {
    return this.http.get(this.urlBase);
  }
}
