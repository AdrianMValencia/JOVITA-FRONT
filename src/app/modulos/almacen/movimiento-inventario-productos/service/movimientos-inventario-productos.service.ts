import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.prod';
import { Observable } from 'rxjs-compat';

@Injectable()
export class MovimientosInventarioProductosService {
  urlBase = environment.BASE_URL + '';

  constructor(private http: HttpClient){
  }

  obtenerMovimientoInventarioProducto(id: number): Observable<any> {
    return this.http.get(this.urlBase + id);
  }

}
