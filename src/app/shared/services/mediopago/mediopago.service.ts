import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.prod';
import { Observable } from 'rxjs-compat';
import { of, tap } from 'rxjs';

@Injectable()
export class MediopagoService {
  urlBase = environment.BASE_URL + 'tiposPago';
  private cachedData: any;

  constructor(private http: HttpClient){}

  cargarMedioPago(id: number): Observable<any> {
    if (this.cachedData) {
      return of(this.cachedData);
    } else {
      return this.http.get(this.urlBase + '/' + id).pipe(
        tap((data) => {
          this.cachedData = data;
        })
      );
    }
  }

  obtenerMedioPago(): Observable<any> {
    return this.http.get(environment.BASE_URL + 'recibosMedioPago');
  }

  recibosMedioPago(idPuntoVenta: number, idUsuario: number, dia: number): Observable<any> {
    return this.http.get(environment.BASE_URL + 'recibosMedioPagoDia/' + idPuntoVenta + '/' + idUsuario + '/' + dia);
  }
}
