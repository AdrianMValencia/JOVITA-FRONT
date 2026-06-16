import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.prod';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Recibos } from '../model/recibos';
import { tap } from 'rxjs/operators';
import { RecibosDetalles } from '../model/recibosDetalles';

export interface RecibosNumeracionResponse {
  serie?: string;
  idSerie?: number;
  idNumeracion?: number;
  siguiente?: number | string;
  status?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RecibosService {

  urlBase = environment.BASE_URL + 'recibos';
  private cachedData: any;

  constructor(private http: HttpClient){}

  cargarRecibos(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/devoluciones/' + id);
  }

  obtenerRecibos(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  enviarCorreo(recibos: Recibos): Observable<any> {
  return this.http.post(this.urlBase + '/enviarCorreo', recibos);
  }

  cargarDetalles(): Observable<any> {
    return this.http.get(environment.BASE_URL + 'recibosDetalles');
  }

  cargarMedioPago(idRecibo: number): Observable<any> {
    return this.http.get(environment.BASE_URL + 'recibosMedioPago/' + idRecibo);
  }

  cargarClientes(): Observable<any> {
    return this.http.get(this.urlBase + '/listarClientes');
  }

  emitirRecibo(recibos: Recibos): Observable<any>{
    if(recibos.id === 0){
      return this.http.post(this.urlBase, recibos);
    }else{
      return this.http.put(this.urlBase + '/' + recibos.id, recibos);
    }
  }

  cargarPDF(id: number): Observable<any> {
    return this.http.get(environment.BASE_URL + 'reporteRecibos/' + id, { responseType: "arraybuffer" });
  }

  deleteRecibos(recibos: Recibos): Observable<any> {
  return this.http.delete(this.urlBase + '/' + recibos.id, { body: recibos });
  }

  deleteRecibosDetalles(detalles: RecibosDetalles): Observable<any> {
  return this.http.delete(environment.BASE_URL + 'recibosDetalles/' + detalles.id, { body: detalles });
  }

  buscarPorFecha(page: number = 1, per_page: number = 10, fechaInicio: any, fechaFin: any, idPuntoVenta: number): Observable<any>{
  return this.http.post(environment.BASE_URL + 'buscarPorFecha', {fechaInicio, fechaFin, idPuntoVenta, page, per_page});
  }

  obtenerSiguienteNumeracion(params: {
    idPuntoVenta: number;
    tipoComprobante?: string;
    serieComprobante?: string;
    series?: string;
  }): Observable<RecibosNumeracionResponse> {
    let qp = new HttpParams().set('idPuntoVenta', String(params.idPuntoVenta));
    if (params.tipoComprobante) {
      qp = qp.set('tipoComprobante', params.tipoComprobante);
    }
    if (params.serieComprobante) {
      qp = qp.set('serieComprobante', params.serieComprobante);
    }
    if (params.series) {
      qp = qp.set('series', params.series);
    }
    return this.http.get<RecibosNumeracionResponse>(environment.BASE_URL + 'recibos/numeracion', { params: qp });
  }
}
