import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

import { CierreCaja } from '../models/cierreCaja';

@Injectable()
export class CierrecajaService {
  urlBase = environment.BASE_URL + 'cierreCajas';

  constructor(private http: HttpClient){}

  cargarCierreCaja(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  obtenerCierreCaja(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  crudCierreCaja(cierreCajas: CierreCaja): Observable<any> {
    if(cierreCajas.id === 0){
      return this.http.post(this.urlBase, cierreCajas);
    }else{
      return this.http.put(this.urlBase + '/' + cierreCajas.id, cierreCajas);
    }
  }

  guardarReporte(idPuntoVenta: number): Observable<any> {
    return this.http.post(environment.BASE_URL + 'guardarReporteVentas', { idPuntoVenta });
  }

  deleteCierreCaja(cierreCajas: CierreCaja): Observable<any> {
    return this.http.delete(this.urlBase + '/' + cierreCajas.id);
  }

  crudCierreCajaGeneral(cierreCajas: Array<CierreCaja>): Observable<any> | any {
    return this.http.post(environment.BASE_URL + 'cierreCajasGeneral', cierreCajas);
  }

  cargarPDF(id: number, fecha: any, idUusario: any): Observable<any> {
    if(parseInt(idUusario) === 0){
      return this.http.get(environment.BASE_URL + 'reporteCierreCajaTodos/' + id + '/' + fecha, { responseType: "arraybuffer" });
    }else{
      return this.http.get(environment.BASE_URL + 'reporteCierreCaja/' + id + '/' + fecha + '/' + idUusario, { responseType: "arraybuffer" });
    }
  }

  listaIngresoSobrante(id: number): Observable<any> {
    return this.http.get(environment.BASE_URL + 'listaIngresoSobrante/' + id);
  }
}
