import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs-compat';
import { environment } from '../../../../../environments/environment.prod';
import { DatosEmpresa } from '../model/datosEmpresa';

@Injectable({
  providedIn: 'root'
})
export class DatosEmpresaService {

  urlBase = environment.BASE_URL + 'datosEmpresa';
  urlBaseUpload = environment.BASE_URL_UPLOAD + 'logo/';
  datosEmpresa: DatosEmpresa = new DatosEmpresa(0, '', '', '', '', '', '', '', '', '', '', '', '');

  constructor(private http: HttpClient){}

  cargarDatosEmpresa(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  obtenerDatosEmpresa(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  crudDatosEmpresa(datosEmpresa: DatosEmpresa): Observable<any> {
    if(datosEmpresa.id === 0){
      return this.http.post(this.urlBase, datosEmpresa);
    }else{
      return this.http.put(this.urlBase + '/' + datosEmpresa.id, datosEmpresa);
    }
  }

  deleteDatosEmpresa(datosEmpresa: DatosEmpresa): Observable<any> {
    return this.http.delete(this.urlBase + '/' + datosEmpresa.id);
  }

  consultasSUNAT(documento: string, tipo: string){
    return this.http.get(environment.BASE_URL + 'consultaSUNAT/' + tipo + '/' + documento);
  }

  uploadFile(logo: any, type: string, tipo: string): Observable<any> {
    return this.http.post(this.urlBase + '/subirImagen/1/' + tipo, {logo: logo, type: type});
  }
}
