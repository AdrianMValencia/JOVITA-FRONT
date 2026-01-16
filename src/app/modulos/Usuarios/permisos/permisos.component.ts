import { Component, OnInit } from '@angular/core';
import { UsuarioService } from '../service/usuario.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Usuarios } from '../models/Usurarios';
import { Permisos } from '../models/permisos';
import { FuncionesService } from '../../../shared/services/funciones.service';
import { UserService } from '../../Seguridad/services/user.service';

@Component({
  selector: 'app-permisos',
  templateUrl: './permisos.component.html',
  providers: [UsuarioService ],
})
export class PermisosComponent implements OnInit {

  permiso: Permisos = new Permisos(0, '', '', '', '', '', '', '', '', '');

  // Progress Bar
  progressBar: boolean = false;

  //COMBOS
  cboUsuarios: Usuarios[] = [];

  // PERMISOS
  permisos: Permisos[] = [];

  constructor(
    private service: UsuarioService,
    private funcionesService: FuncionesService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.funcionesService.showLoading();
    this.progressBar = true;
    this.cargarUsuarios();
    this.funcionesService.hideLoading();
    this.progressBar	= false;
  }

  selectEventUsuarios(event: Usuarios){
    this.permiso.idUsuario = event.id;
    this.permiso.idRol = event.idRol;
    this.permiso.nombreRol = event.roles.nombreRol;
    this.cargarPermisos(event.id);
  }

  cargarPermisos(idUsuario: number){
    this.permisos = [];
    this.service.cargarPermisos(idUsuario).subscribe((response: any) => {
      response.modulos.forEach((element: any) => {
        this.permisos.push({
          id: element.id,
          nombre: element.nombre,
          children: element.sub_modulos
        });
      });

      response.permisos.forEach((result: any) => {
        this.permisos.forEach((elemento: any) => {
          elemento.children.forEach((resultado: any) => {
            if(parseInt(result.idSubModulo) === resultado.id){
              if(parseInt(result.idUsuario) === idUsuario){
                resultado.completed = result.completed == '0' ? false : true;
              }
            }
          });
        });
      });
    });
  }

  cargarUsuarios(){
    const usuario: any = localStorage.getItem('usuario');
    if(parseInt(JSON.parse(usuario).idRol) === 1){
      this.service.cargarUsuariosPermisos().subscribe(response => {
        this.cboUsuarios = response.usuarios;
      });
    }else{
      this.service.cargarUsuarios().subscribe(response => {
        this.cboUsuarios = response.usuarios;
      });
    }
  }

  cargarRoles(event: any){
    if(event !== undefined){
      this.permiso.idRol = event.idRol;
      this.permiso.nombreRol = event.roles.nombreRol;
      this.cargarPermisos(event.id);
    }
  }

  savePermisos(): any{

    if(this.permiso.idUsuario === ''){
      this.funcionesService.showError('Seleccione un usuario');
      return false;
    }

    this.funcionesService.mensajeConfirmar('¿Esta seguro de guardar los cambios?', '', (resultado: any) => {
      if (resultado.isConfirmed) {

        let operaciones: Permisos[] = [];

        this.permisos.forEach(element => {
          element.children.forEach((datos: any) => {
            operaciones.push({
              idUsuario: this.permiso.idUsuario,
              idRol: this.permiso.idRol,
              idSubModulo: datos.id,
              completed: datos.completed == undefined ? false: datos.completed,
            });
          });
        });

        this.funcionesService.showLoading();
        this.progressBar = true;
        this.service.crudPermisos(operaciones).subscribe(response => {
          this.funcionesService.showSuccess(response.message);
          this.funcionesService.hideLoading();
          this.progressBar = false;
        }, (error: any) => {
          this.funcionesService.hideLoading();
          this.progressBar = false;
        });
      }
    });
  }
}
