import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs-compat';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';
import { FuncionesService } from '../services/funciones.service';

@Injectable({
  providedIn: 'root'
})
export class InterceptorService implements HttpInterceptor {

  constructor(private router: Router, private funcionesService: FuncionesService) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

      let headers: any;

      const isFormData = req.body instanceof FormData;

      if (isFormData) {
        // Solo agrega Authorization si existe, pero NO Content-Type
        if(localStorage.getItem('jwt') !== null){
          headers = new HttpHeaders()
            .set('Authorization', "Bearer " + localStorage.getItem('jwt'));
          req = req.clone({ headers });
        }
        // Si no hay JWT, no agregues nada
      } else {
        // ...tu lógica actual para JSON
        if(localStorage.getItem('jwt') === null){
          headers = new HttpHeaders()
            .set("Content-Type", "application/json");
        }else{
          headers = new HttpHeaders()
            .set("Content-Type", "application/json")
            .set('Authorization', "Bearer " + localStorage.getItem('jwt'));
        }
        req = req.clone({ headers });
      }

      return next.handle(req).pipe(
        tap(
          succ => { },
          err => {
            //acceso no autorizado
            if (err.status == 401) {
              this.funcionesService.showError('Sin autorización.');
              this.router.navigateByUrl('/inicio');
            }
            //prohibido el accesso
            else if (err.status == 403) {
              this.funcionesService.showError('Sin autorización.');
              this.router.navigateByUrl('/inicio');
            }
            //error en conexion con el servidor
            else if (err.status == 500) {
              this.funcionesService.showError('Sin autorización.');
              this.router.navigateByUrl('/inicio');
            }
          }
        )
      )
    }
}
