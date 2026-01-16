import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ContainerInsideComponent } from 'src/app/shared/components/container-inside/container-inside.component';
import { Oauth2Guard } from 'src/app/shared/guards/oauth2.guard';

import { ActualizacionInventariosComponent } from './actualizacion-inventarios/actualizacion-inventarios.component';
import { ModalActualizacionInventariosComponent } from './modalActualizacionInventarios/modalActualizacionInventarios.component';

export const INVENTARIOS_RUTAS_COMPONENTES = [
  ActualizacionInventariosComponent, ModalActualizacionInventariosComponent
]

const routes: Routes = [
  {
    path: "inventarios",
    component: ContainerInsideComponent,
    canActivate: [Oauth2Guard],
    children:[
      {
        path: "actualizacion-inventarios",
        component: ActualizacionInventariosComponent,
        data: { titulo: "Actualización de Inventarios" }
      }
    ]
  }
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {useHash: true})
  ],
  exports: [RouterModule],
  declarations: []
})
export class InventariosRutasModule { }
