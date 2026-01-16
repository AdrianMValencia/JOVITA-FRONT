import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ContainerInsideComponent } from 'src/app/shared/components/container-inside/container-inside.component';
import { Oauth2Guard } from 'src/app/shared/guards/oauth2.guard';

import { DashboardDosComponent } from './dashboard-dos/dashboard-dos.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const INICIO_RUTAS_COMPOMENTES = [
  DashboardComponent,
  DashboardDosComponent,
];

const routes: Routes = [
  {
    path: 'inicio',
    component: ContainerInsideComponent,
    data: { titulo: 'Dashboard' },
    canActivate: [Oauth2Guard],
    children: [
      {
        path: 'dashboard',
        component: DashboardDosComponent,
        data: { titulo: 'Dashboard' },
      },
      {
        path: 'dashboard-dos',
        component: DashboardComponent,
        data: { titulo: 'Dashboard 2' },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
  declarations: [],
})
export class InicioRutasModule {}
