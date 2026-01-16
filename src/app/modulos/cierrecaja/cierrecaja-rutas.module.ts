import { DatePipe, DecimalPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ContainerInsideComponent } from 'src/app/shared/components/container-inside/container-inside.component';
import { Oauth2Guard } from 'src/app/shared/guards/oauth2.guard';

import { CierrecajaComponent } from './cierre/cierrecaja.component';
import { EntradadineroComponent } from './entradadinero/entradadinero.component';
import { IngresoSobranteComponent } from './ingreso-sobrante/ingreso-sobrante.component';
import { IniciocajaComponent } from './iniciocaja/iniciocaja.component';
import { ModalpreviewComponent } from './modalpreview/modalpreview.component';
import { ModalreportecierrecajaComponent } from './modalreportecierrecaja/modalreportecierrecaja.component';
import { PagocreditosComponent } from './pagocreditos/pagocreditos.component';
import { PagoproveedoresComponent } from './pagoproveedores/pagoproveedores.component';
import { SalidadineroComponent } from './salidadinero/salidadinero.component';

export const CIERRECAJA_RUTAS_COMPONENTES = [
  EntradadineroComponent, IniciocajaComponent,SalidadineroComponent, PagoproveedoresComponent, PagocreditosComponent,
  ModalpreviewComponent, ModalreportecierrecajaComponent, CierrecajaComponent, IngresoSobranteComponent
];

const routes: Routes = [
  {
    path: "cierre-caja",
    component: ContainerInsideComponent,
    canActivate: [Oauth2Guard],
    children: [
      {
        path: "cierre",
        component: CierrecajaComponent,
        data: {titulo: 'Cierre de Caja'}
      },
      {
        path: "entrada-dinero",
        component: EntradadineroComponent,
        data: {titulo: 'Entrada de Dinero'}
      },
      {
        path: "inicio-caja",
        component: IniciocajaComponent,
        data: {titulo: 'Inicio de Caja'}
      },
      {
        path: "salida-dinero",
        component: SalidadineroComponent,
        data: {titulo: 'Salida de Dinero'}
      },
      {
        path: "pago-proveedores",
        component: PagoproveedoresComponent,
        data: {titulo: 'Pago de Proveedores'}
      },
      {
        path: "pago-creditos",
        component: PagocreditosComponent,
        data: {titulo: 'Pago de Créditos'}
      },
      {
        path: "ingreso-sobrante",
        component: IngresoSobranteComponent,
        data: {titulo: 'Ingreso de Sobrante'}
      },
    ],
  },
  // { path: '**', component: LoginComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule],
  providers: [DecimalPipe, DatePipe],
  declarations: [],
})
export class CierrecajaRutasModule { }
