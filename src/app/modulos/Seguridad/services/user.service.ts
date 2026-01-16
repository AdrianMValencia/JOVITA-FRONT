import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { User } from '../models/User';
import { Menu } from '../models/Menu';
import { environment } from '../../../../environments/environment.prod';
import { Permisos } from '../../Usuarios/models/permisos';
import { SubMenu } from '../models/SubMenu';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';

@Injectable()
export class UserService {

  public token: string | any = '';
  public menu: Menu[] | any = [];
  public subMenu: SubMenu[] | any = [];
  public puntosVenta: PuntosVenta[] | any = [];
  public usuario: string | any = '';
  public logo: string | any = '';
  public rol: string | any = '';
  public permisos?: string | any = '';
  public foto?: string | any = '';

  urlBase = environment.BASE_URL;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.cargarStorage();
  }

  logout() {
    this.token = '';
    this.usuario = '';
    this.permisos = '';
    this.menu = [];
    this.subMenu = [];
    this.puntosVenta = [];
    localStorage.removeItem('jwt');
    localStorage.removeItem('menu');
    localStorage.removeItem('subMenu');
    localStorage.removeItem('usuario');
    localStorage.removeItem('permisos');
    localStorage.removeItem('puntosVenta');
    localStorage.removeItem('productos');
    this.router.navigate(['/login']);
  }

  estaLogueado() {
    return (this.token.length > 5) ? true : false;
  }

  cargarStorage() {
    if (localStorage.getItem('jwt')) {
      this.token = localStorage.getItem('jwt');
      this.menu = localStorage.getItem('menu');
      this.subMenu = localStorage.getItem('subMenu');
      this.usuario = localStorage.getItem('usuario');
      this.permisos = localStorage.getItem('permisos');
      this.puntosVenta = localStorage.getItem('puntosVenta');
    } else {
      this.token = '';
      this.usuario = '';
      this.permisos = '';
      this.menu = [];
      this.subMenu = [];
      this.puntosVenta = [];
    }
  }

  public guardarStorage(token: string, menu: any, subMenu: any, usuario: any, permisos: Permisos, puntosVenta: PuntosVenta) {
    if (token !== '' && menu !== '') {
      localStorage.setItem('jwt', token);
      localStorage.setItem('menu', JSON.stringify(menu));
      localStorage.setItem('subMenu', JSON.stringify(subMenu));
      localStorage.setItem('usuario', JSON.stringify(usuario));
      localStorage.setItem('permisos', JSON.stringify(permisos));
      localStorage.setItem('puntosVenta', JSON.stringify(puntosVenta));
      this.token = token;
      this.menu = menu;
      this.subMenu = subMenu;
      this.usuario = usuario;
      this.permisos = permisos;
      this.puntosVenta = puntosVenta;
    }
  }

  signup(user: User,   recuerdame: boolean = false): Observable<any> {
    if (recuerdame) {
      localStorage.setItem('recuerdame', user.usuario);
    } else {
      localStorage.removeItem('recuerdame');
    }

      const body = { usuario: user.usuario, password: user.password };
      return this.http.post(this.urlBase + "login", body).pipe(catchError(e => throwError(this.handleError(e))));
  }

  handleError(error: HttpErrorResponse) {
    return error.error;
  }
}
