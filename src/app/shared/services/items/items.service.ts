import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.prod';
import { Observable } from 'rxjs-compat';

@Injectable()
export class ItemsService {
  urlBase = environment.BASE_URL + 'items';
  constructor(private http: HttpClient){}

  cargarItems(tipo: string): Observable<any> {
    return this.http.get(this.urlBase + '/' + tipo);
  }
}
