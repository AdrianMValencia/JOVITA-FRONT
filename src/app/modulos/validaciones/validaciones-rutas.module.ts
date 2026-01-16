import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ContainerInsideComponent } from 'src/app/shared/components/container-inside/container-inside.component';
import { Oauth2Guard } from 'src/app/shared/guards/oauth2.guard';

import { AnulacionesTicketsComponent } from './anulaciones-tickets/anulaciones-tickets.component';
import { PedidosAprobarComponent } from './pedidos-aprobar/pedidos-aprobar.component';
import { ModalPedidosAprobarComponent } from './pedidos-aprobar/modal-pedidos-aprobar/modal-pedidos-aprobar.component';

export const VALIDACIONES_RUTAS_COMPONENTES = [
  PedidosAprobarComponent,
  AnulacionesTicketsComponent,
  ModalPedidosAprobarComponent
];

const routes: Routes = [
  {
    path: 'validaciones',
    component: ContainerInsideComponent,
    canActivate: [Oauth2Guard],
    children: [
      {
        path: 'pedidos-aprobar',
        component: PedidosAprobarComponent,
        data: { titulo: 'Pedidos Aprobar' },
      },
      {
        path: 'anulacion-tickets',
        component: AnulacionesTicketsComponent,
        data: { titulo: 'Anulaciones Tickets' },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
  declarations: [],
})
export class ValidacionesRutasModule {}
