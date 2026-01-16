import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs-compat';
import { TipoCambio } from '../model/tipoCambio';

@Injectable({
  providedIn: 'root'
})
export class TipoCambioService {

  urlBase = environment.BASE_URL + 'tipoCambio';

  constructor(private http: HttpClient){}

  cargarTipoCambio(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  obtenerTipoCambio(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  crudTipoCambio(tipoCambios: TipoCambio): Observable<any> {
    if(tipoCambios.id === 0){
      return this.http.post(this.urlBase, tipoCambios);
    }else{
      return this.http.put(this.urlBase + '/' + tipoCambios.id, tipoCambios);
    }
  }

  deleteTipoCambio(tipoCambios: TipoCambio): Observable<any> {
    return this.http.delete(this.urlBase + '/' + tipoCambios.id, { body: tipoCambios });
  }

}
