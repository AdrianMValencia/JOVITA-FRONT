import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { Abastecimiento } from '../models/abastecimiento';

@Injectable()
export class AbastacimientoService {
  urlBase = environment.BASE_URL + 'abastecimientos';

  constructor(private http: HttpClient){}

  crudAbastecimiento(abastecimiento: Abastecimiento[]): Observable<any> {
    return this.http.post(this.urlBase, abastecimiento);
  }

  cargarAbastecimientos(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  obtenerAbastecimientos(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  cargarNumeroEnvio(id: number): Observable<any> {
    return this.http.get(environment.BASE_URL + 'numeroEnvio/' + id);
  }

  cargarPDF(id: number): Observable<any> {
    return this.http.get(environment.BASE_URL + 'reporteAbastecimiento/' + id, { responseType: "arraybuffer" });
  }

  obtenerDetallesAbastecimiento(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/detalles/' + id);
  }
}
