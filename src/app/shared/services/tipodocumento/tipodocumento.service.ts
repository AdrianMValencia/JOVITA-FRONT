import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.prod';
import { Observable } from 'rxjs-compat';

@Injectable()
export class TipodocumentoService {
  urlBase = environment.BASE_URL + 'tipoDocumento';
  constructor(private http: HttpClient){}

  cargarTipoDocumento(): Observable<any> {
    return this.http.get(this.urlBase);
  }
}
