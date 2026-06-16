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
      const isGetOrHead = req.method === 'GET' || req.method === 'HEAD';
      const isBinaryResponse =
        req.responseType === 'blob' || req.responseType === 'arraybuffer';

      if (isFormData) {
        // Solo agrega Authorization si existe, pero NO Content-Type
        if(localStorage.getItem('jwt') !== null){
          headers = new HttpHeaders()
            .set('Authorization', "Bearer " + localStorage.getItem('jwt'));
          req = req.clone({ headers });
        }
        // Si no hay JWT, no agregues nada
      } else {
        const jwt = localStorage.getItem('jwt');
        // GET/HEAD y descargas binarias: no forzar Content-Type (evita problemas con blob y APIs de archivos)
        if (jwt !== null && (isGetOrHead || isBinaryResponse)) {
          headers = new HttpHeaders()
            .set('Authorization', "Bearer " + jwt);
          req = req.clone({ headers });
        } else if (jwt === null) {
          headers = new HttpHeaders()
            .set("Content-Type", "application/json");
          req = req.clone({ headers });
        } else {
          headers = new HttpHeaders()
            .set("Content-Type", "application/json")
            .set('Authorization', "Bearer " + jwt);
          req = req.clone({ headers });
        }
      }

      return next.handle(req).pipe(
        tap(
          succ => { },
          err => {
            // acceso no autorizado indica que el token expiró o no es válido
            if (err.status == 401) {
              // limpiar storage para forzar nuevo login
              localStorage.removeItem('jwt');
              localStorage.removeItem('usuario');
              this.funcionesService.showError('Sesión expirada. Por favor vuelve a iniciar sesión.');
              this.router.navigateByUrl('/inicio');
            }
            // prohibido el acceso (token válido pero sin permisos)
            else if (err.status == 403) {
              this.funcionesService.showError('Sin autorización.');
              this.router.navigateByUrl('/inicio');
            }
            // error del servidor genérico
            else if (err.status == 500) {
              const isDocumentoLookup = req.url.includes('/clientes/buscarClientes/');
              const isEfactArchivo = req.url.includes('/efact/');
              const isContabilidad = req.url.includes('/contabilidad/');
              // Para la búsqueda de documento en caja no forzar navegación; el componente muestra el mensaje.
              // eFact CDR/XML/PDF: el componente maneja el error; no desloguear al usuario.
              if (!isDocumentoLookup && !isEfactArchivo && !isContabilidad) {
                this.funcionesService.showError('Error del servidor.');
                this.router.navigateByUrl('/inicio');
              }
            }
          }
        )
      )
    }
}
