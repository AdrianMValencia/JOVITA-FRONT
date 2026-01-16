import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PedidoWeb } from '../model/pedido-web';

@Injectable({
  providedIn: 'root'
})
export class PedidosWebService {

  urlBase = 'https://jovita-online.com/backend/public/api/pedidos';

  constructor(private http: HttpClient) {}

  obtenerPedidos(): Observable<any> {
    return this.http.get<any>(this.urlBase);
  }

  actualizarEstadoPedido(id: number, estado: number): Observable<any> {
    const body = { estado };
    return this.http.put<any>(`${this.urlBase}/${id}/estado`, body);
  }
}
