import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ContainerInsideComponent } from 'src/app/shared/components/container-inside/container-inside.component';
import { Oauth2Guard } from 'src/app/shared/guards/oauth2.guard';

import { IngresosComponent } from './Ingresos/Ingresos.component';
import { ModalIngresosComponent } from './Ingresos/modalIngresos/modalIngresos.component';
import { ModalIngresosProductosComponent } from './Ingresos/modalIngresosProductos/modalIngresosProductos.component';
import { ComprasAjustesComponent } from './comprasajustes/comprasajustes.component';
import { ModalCompraAjustesComponent } from './comprasajustes/modalCompraAjustes/modalCompraAjustes.component';
import { ModalPedidosComponent } from './pedidos/modalPedidos/modalPedidos.component';
import { ModalPedidosProductosComponent } from './pedidos/modalPedidosProductos/modalPedidosProductos.component';
import { ModalpedidospdfComponent } from './pedidos/modalpedidospdf/modalpedidospdf.component';
import { PedidosComponent } from './pedidos/pedidos.component';
import { CrudProductosfaltantesComponent } from './productos-faltantes/crudProductosfaltantes/crudProductosfaltantes.component';
import { ProductosFaltantesComponent } from './productos-faltantes/productos-faltantes.component';

export const COMPRAS_RUTAS_COMPONENTES = [
  IngresosComponent, ModalIngresosComponent, ModalIngresosProductosComponent,
  ComprasAjustesComponent, ModalCompraAjustesComponent, PedidosComponent, ModalPedidosComponent, ModalPedidosProductosComponent,
  ModalpedidospdfComponent, ProductosFaltantesComponent, CrudProductosfaltantesComponent
];

const routes: Routes = [
  {
    path: "compras",
    component: ContainerInsideComponent,
    canActivate: [Oauth2Guard],
    children: [
      {
        path: "ingresos",
        component: IngresosComponent,
        data: { titulo: "Compras" }
      },
      {
        path: "ajustes",
        component: ComprasAjustesComponent,
        data: { titulo: "Compras Ajustes" }
      },
      {
        path: "pedidos",
        component: PedidosComponent,
        data: { titulo: "Pedidos de Productos por Vendedores" }
      },
      {
        path: "productos-faltantes",
        component: ProductosFaltantesComponent,
        data: { titulo: "Productos Faltantes" }
      },
      {
        path: "agregar-productos-faltantes/:id",
        component: CrudProductosfaltantesComponent,
        data: { titulo: "Mantenimiento Productos Faltantes" }
      },
    ],
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class ComprasRutasModule { }
