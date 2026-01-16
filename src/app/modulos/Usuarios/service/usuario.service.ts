import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.prod';
import { Usuarios } from '../models/Usurarios';

@Injectable()
export class UsuarioService {

  urlBase = environment.BASE_URL + 'user';
  urlUpload = environment.BASE_URL_UPLOAD + 'usuario/'

  constructor(
    private http: HttpClient
  ) {}

  cargarUsuarios(): Observable<any> {
    return this.http.get(this.urlBase);
  }

  listarUsuarios(): Observable<any> {
    return this.http.get(this.urlBase + '/cargarUsuarios');
  }

  cargarUsuariosPermisos(): Observable<any> {
    return this.http.get(this.urlBase + 'Permisos');
  }

  cargarRoles(): Observable<any> {
    return this.http.get(environment.BASE_URL + 'roles');
  }

  cargarUbigeos(): Observable<any> {
    return this.http.get(this.urlBase + 'listarUbigeo');
  }

  crudUsuarios(usuarios: Usuarios): Observable<any> {
    if(usuarios.id === 0){
      return this.http.post(this.urlBase, usuarios);
    }else{
      return this.http.put(this.urlBase + '/' + usuarios.id, usuarios);
    }
  }

  deleteUsuarios(usuarios: Usuarios): Observable<any> {
    return this.http.delete(this.urlBase + '/' + usuarios.id);
  }

  obtenerUsuarios(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  cargarPermisos(idUsuario: number): Observable<any> {
    return this.http.get(this.urlBase + '/permisos/' + idUsuario);
  }

  cambiarRoles(usuarios: Usuarios): Observable<any>{
    return this.http.put(this.urlBase + '/role/' + usuarios.id, {idRol: usuarios.idRol});
  }

  obtenerRoles(idRol: number): Observable<any> {
    return this.http.get(this.urlBase + 'obtenerRoles/' + idRol);
  }

  crudPermisos(permisos: any): Observable<any> {
    return this.http.post(environment.BASE_URL + 'permisos', permisos);
  }

  uploadFile(usuarios: Usuarios): Observable<any> {
    return this.http.post(this.urlBase + 'subrArchivo', usuarios);
  }

  cambiarEstado(idUsuario: number): Observable<any>{
    return this.http.put(this.urlBase + '/estado/' + idUsuario, {status: 0});
  }

}
