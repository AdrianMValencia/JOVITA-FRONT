import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { ContainerInsideComponent } from '../../shared/components/container-inside/container-inside.component';
import { Oauth2Guard } from '../../shared/guards/oauth2.guard';
import { UsuariosComponent } from './registros/usuarios.component';
import { ModalUsuariosComponent } from './modalUsuarios/modalUsuarios.component';
import { PermisosComponent } from './permisos/permisos.component';
import { AsignarusuariosComponent } from "./asignarusuarios/asignarusuarios.component";

export const USUARIOS_RUTAS_COMPONENTES = [
  UsuariosComponent, ModalUsuariosComponent, PermisosComponent, AsignarusuariosComponent
];

const routes: Routes = [
  {
    path: "usuarios",
    component: ContainerInsideComponent,
    canActivate: [Oauth2Guard],
    children: [
      {
        path: "registro",
        component: UsuariosComponent,
        data: { titulo: "Listado de Usuarios" }
      },
      {
        path: "permisos",
        component: PermisosComponent,
        data: { titulo: "Asignar Permisos" }
      }
    ],
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule],
  declarations: [],
})
export class UsuariosRutasModule { }
