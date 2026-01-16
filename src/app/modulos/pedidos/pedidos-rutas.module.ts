import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ContainerInsideComponent } from 'src/app/shared/components/container-inside/container-inside.component';
import { Oauth2Guard } from 'src/app/shared/guards/oauth2.guard';

import { ModalOrdenPedidoComponent } from './orden-pedido/modal-orden-pedido/modal-orden-pedido.component';
import { OrdenPedidoComponent } from './orden-pedido/orden-pedido.component';
import { ModalOrdenRequerimientoPdfComponent } from './orden-requerimiento/modal-orden-requerimiento-pdf/modal-orden-requerimiento-pdf.component';
import { ModalOrdenRequerimientoProductosComponent } from './orden-requerimiento/modal-orden-requerimiento-productos/modal-orden-requerimiento-productos.component';
import { ModalOrdenRequerimientoComponent } from './orden-requerimiento/modal-orden-requerimiento/modal-orden-requerimiento.component';
import { OrdenRequerimientoComponent } from './orden-requerimiento/orden-requerimiento.component';
import { ModalValidacionPedidoComponent } from './validacion-pedido/modal-validacion-pedido/modal-validacion-pedido.component';
import { ValidacionPedidoComponent } from './validacion-pedido/validacion-pedido.component';
import { PedidosWebComponent } from './pedidos-web/pedidos-web.component';
import { ModalDetallePedidoComponent } from './pedidos-web/modal-detalle-pedido/modal-detalle-pedido.component';
import { SuscriptoresComponent } from './suscriptores/suscriptores.component';

export const PEDIDOS_RUTAS_COMPONENTES = [
  OrdenRequerimientoComponent, ModalOrdenRequerimientoComponent, ModalOrdenRequerimientoPdfComponent, ModalOrdenRequerimientoProductosComponent, OrdenPedidoComponent, ModalOrdenPedidoComponent, ModalValidacionPedidoComponent, ValidacionPedidoComponent, PedidosWebComponent, ModalDetallePedidoComponent, SuscriptoresComponent
]

const routes: Routes = [
  {
    path: "pedidos",
    component: ContainerInsideComponent,
    canActivate: [Oauth2Guard],
    children:[
      {
        path: "orden-requerimiento",
        component: OrdenRequerimientoComponent,
        data: { titulo: "Orden de Requerimiento" }
      },
      {
        path: "orden-pedido",
        component: OrdenPedidoComponent,
        data: { titulo: "Orden de Pedido" }
      },
      {
        path: "validacion-pedido",
        component: ValidacionPedidoComponent,
        data: { titulo: "Validación de Pedido" }
      },
      {
        path: "pedidos-web",
        component: PedidosWebComponent,
        data: { titulo: "Pedidos Web" }
      },
      {
        path: "suscriptores",
        component: SuscriptoresComponent,
        data: { titulo: "Suscriptores" }
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
export class PedidosRutasModule { }
