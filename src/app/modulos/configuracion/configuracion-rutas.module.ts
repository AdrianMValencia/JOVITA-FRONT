import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { ContainerInsideComponent } from '../../shared/components/container-inside/container-inside.component';
import { Oauth2Guard } from '../../shared/guards/oauth2.guard';
import { DatosEmpresaComponent } from './datosEmpresa/datosEmpresa.component';

export const CONFIGURACION_RUTAS_COMPONENTES = [
  DatosEmpresaComponent
];

const routes: Routes = [
  {
    path: "configuracion",
    component: ContainerInsideComponent,
    canActivate: [Oauth2Guard],
    children: [
      {
        path: "datos-empresa",
        component: DatosEmpresaComponent,
        data: {titulo: 'Datos de la Empresa'}
      }
    ],
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule],
  declarations: [],
})
export class ConfiguracionRutasModule { }
