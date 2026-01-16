import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs-compat';
import { Bancos } from '../model/bancos';

@Injectable({
  providedIn: 'root'
})

export class BancosService {

  urlBase = environment.BASE_URL + 'bancos';

  constructor(private http: HttpClient){}

  cargarBancos(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  obtenerBancos(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  crudBancos(bancos: Bancos): Observable<any> {
    if(bancos.id === 0){
      return this.http.post(this.urlBase, bancos);
    }else{
      return this.http.put(this.urlBase + '/' + bancos.id, bancos);
    }
  }

  deleteBancos(bancos: Bancos): Observable<any> {
    return this.http.delete(this.urlBase + '/' + bancos.id);
  }

  consultasSUNAT(documento: string){
    return this.http.get(this.urlBase + '/buscarClientes/' + documento);
  }
}
