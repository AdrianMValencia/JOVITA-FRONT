import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SuscriptoresService {

  urlBase = 'https://jovita-online.com/backend/public/api/suscriptores';

  constructor(private http: HttpClient) {}

  obtenerSuscriptores(): Observable<any> {
    return this.http.get<any>(this.urlBase);
  }
}
