import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/modulos/Seguridad/services/user.service';
import { FuncionesService } from '../../services/funciones.service';

@Component({
  selector: 'app-container-inside',
  templateUrl: './container-inside.component.html'
})
export class ContainerInsideComponent implements OnInit {

  fecha: number = new Date().getFullYear();

  constructor(
    public userService: UserService,
    public funcionesService: FuncionesService
    ){}

  ngOnInit(): void {
    this.usuarioAuthenticado();
  }

  usuarioAuthenticado() {
    const token: string | any = localStorage.getItem("token");
    if (token) {
      return true;
    }
    else{
      return false;
    }
  }
}
