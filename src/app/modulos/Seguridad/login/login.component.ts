import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { User } from '../models/User';
import { UserService } from '../services/user.service';
import { FuncionesService } from '../../../shared/services/funciones.service';
import { DatosEmpresaService } from '../../configuracion/datosEmpresa/service/datosEmpresa.service';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { ProductosService } from '../../almacen/productos/service/Productos.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [ProductosService]
})
export class LoginComponent implements OnInit {

  type: string = 'password';
  recuerdame = false;

  usuario: User = new User(0, '0', '', '', '', '', '', '',);
  fecha: number = new Date().getFullYear();

  // Progress Bar
  pbLogin: boolean | any;

  cboPuntoVenta: PuntosVenta[] = [];
  idPuntoVenta: number = 0;
  existePuntoVenta: boolean = false;
  response: any;

  constructor(
    public router: Router,
    public userService: UserService,
    public funciones: FuncionesService,
    public datosEmpresaService: DatosEmpresaService,
    private productosService: ProductosService
  ) { }

  ngOnInit() {
    this.usuario.usuario = localStorage.getItem('recuerdame') || '';
    if (this.usuario.usuario.length > 1) {
      this.recuerdame= true;
    }
  }

  cargarProductos(idPuntoVenta: number){
    this.productosService.obtenerProductos(idPuntoVenta).subscribe(response => {
      let productosStorage = JSON.stringify(response.productos);
      localStorage.setItem('productos', productosStorage);
    });
  }

  ingresar() {

    this.pbLogin = true;

    if(this.usuario.usuario === ''){
      this.funciones.showError('Ingrese su usuario');
    }else{

      if(this.usuario.password === ''){
        this.funciones.showError('Ingrese su contraseña');
      }else{

        this.funciones.showLoading();
        this.userService.signup(this.usuario, this.recuerdame)
        .pipe(
          catchError(err => {
            // this.funciones.showError(err.error);
            return throwError(err);
        })
        ).subscribe(response => {
          this.response = response;
          this.usuario = response.usuario;
          this.cboPuntoVenta = response.puntoVenta;

          if(response.puntoVenta.length > 1) {
            this.existePuntoVenta = true;
            this.funciones.hideLoading();

          }else if(response.puntoVenta.length === 1) {
            let puntoVentas: any[] = this.response.puntoVenta;
            this.userService.guardarStorage(this.response.token, this.response.menu, this.response.subMenu, this.response.usuario, this.response.permisos, puntoVentas[0]);

            // this.cargarProductos(puntoVentas[0].id);
            this.router.navigate(['/inicio/dashboard']);

            this.existePuntoVenta = false;
            this.funciones.hideLoading();

          }else{
            this.userService.logout()
            this.existePuntoVenta = false;
            this.funciones.hideLoading();
          }
        }, error=>{
          this.funciones.showError(error.error);
          this.funciones.hideLoading();
          this.pbLogin = false;
        });
      }
    }

  }

  validarPuntoVenta(target: any): any{
    if(parseInt(target.value) === 0){
      this.funciones.showError('Seleccione su Punto de Venta');
      return false;
    }
    if(this.existePuntoVenta){

      let puntoVentas: any[] = this.response.puntoVenta;
      let puntoVenta: PuntosVenta = new PuntosVenta();

      puntoVentas.forEach(element => {
        if(parseInt(element.id) === parseInt(target.value)){
          puntoVenta = element;
        }
      });

      this.userService.guardarStorage(this.response.token, this.response.menu, this.response.subMenu, this.response.usuario, this.response.permisos, puntoVenta);
      // this.cargarProductos(puntoVenta.id);
      this.router.navigate(['/inicio/dashboard']);
      this.funciones.hideLoading();
      this.pbLogin = false;
    }
  }

  mostrar(cambio: number){
    if(cambio === 1){
      this.type = 'text';
    }else{
      this.type = 'password';
    }
  }
}
