import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { ContainerInsideComponent } from '../../shared/components/container-inside/container-inside.component';
import { Oauth2Guard } from '../../shared/guards/oauth2.guard';
import { BancosComponent } from './bancos/bancos.component';
import { ModalBancosComponent } from './bancos/modalBancos/modalBancos.component';
import { ClientesComponent } from './clientes/clientes.component';
import { ModalClientesComponent } from './clientes/ModalClientes/ModalClientes.component';
import { DepositosComponent } from './depositos/depositos.component';
import { ModalDepositosComponent } from './depositos/modalDepositos/modalDepositos.component';
import { MonedasComponent } from './monedas/monedas.component';
import { ModalMonedasComponent } from './monedas/modalMonedas/modalMonedas.component';
import { ProveedorComponent } from './proveedor/proveedor.component';
import { ModalProveedorComponent } from './proveedor/modalProveedor/modalProveedor.component';
import { PuntosventaComponent } from "./puntosventa/puntosventa.component";
import { ModalpuntosventaComponent } from "./puntosventa/modalpuntosventa/modalpuntosventa.component";
import { SeriesticketsComponent } from "./seriestickets/seriestickets.component";
import { ModalseriesticketsComponent } from "./seriestickets/modalseriestickets/modalseriestickets.component";
import { NumeracionticketsComponent } from './numeraciontickets/numeraciontickets.component';
import { ModalnumeracionticketsComponent } from './numeraciontickets/modalnumeraciontickets/modalnumeraciontickets.component';
import { CajasComponent } from "./cajas/cajas.component";
import { ModalcajasComponent } from "./cajas/modalcajas/modalcajas.component";
import { PagosrealizarComponent } from "./pagosrealizar/pagosrealizar.component";
import { ModalpagosrealizarComponent } from './pagosrealizar/modalpagosrealizar/modalpagosrealizar.component';
import { DetallespagorealizarComponent } from "./pagosrealizar/detallespagorealizar/detallespagorealizar.component";
import { ModaldetallesComponent } from "./pagosrealizar/modaldetalles/modaldetalles.component";
import { TipospagosComponent } from "./tipospagos/tipospagos.component";
import { ModaltipospagoComponent } from "./tipospagos/modaltipospago/modaltipospago.component";
import { TipoCambioComponent } from "./tipoCambio/tipoCambio.component";
import { ModalTipoCambioComponent } from "./tipoCambio/modalTipoCambio/modalTipoCambio.component";

export const MANTENIMIENTO_RUTAS_COMPONENTES = [
  BancosComponent, ModalBancosComponent, ClientesComponent, ModalClientesComponent, DepositosComponent, ModalDepositosComponent,
  MonedasComponent, ModalMonedasComponent, ProveedorComponent, ModalProveedorComponent, PuntosventaComponent, ModalpuntosventaComponent,
  SeriesticketsComponent, ModalseriesticketsComponent, NumeracionticketsComponent, ModalnumeracionticketsComponent, CajasComponent,
  ModalcajasComponent, PagosrealizarComponent, ModalpagosrealizarComponent, DetallespagorealizarComponent, ModaldetallesComponent,
  TipospagosComponent, ModaltipospagoComponent, TipoCambioComponent, ModalTipoCambioComponent
];

const routes: Routes = [
  {
    path: "mantenimiento",
    component: ContainerInsideComponent,
    canActivate: [Oauth2Guard],
    children: [
      {
        path: "bancos",
        component: BancosComponent,
      },
      {
        path: "clientes",
        component: ClientesComponent,
        data: { titulo: "Clientes" }
      },
      {
        path: "depositos",
        component: DepositosComponent,
      },
      {
        path: "monedas",
        component: MonedasComponent,
      },
      {
        path: "proveedores",
        component: ProveedorComponent,
        data: { titulo: "Proveedor" }
      },
      {
        path: "puntos-venta",
        component: PuntosventaComponent,
        data: { titulo: "Puntos de Venta" }
      },
      {
        path: "series-tickets",
        component: SeriesticketsComponent,
        data: { titulo: "Series Tickets" }
      },
      {
        path: "numeracion-tickets",
        component: NumeracionticketsComponent,
        data: { titulo: "Númeracion de Tickets" }
      },
      {
        path: "cajas",
        component: CajasComponent,
        data: { titulo: "Caja" }
      },
      {
        path: "pagos-realizar",
        component: PagosrealizarComponent,
        data: { titulo: "Pagos a Realizar" }
      },
      {
        path: "pagos-realizar/detalles/:id",
        component: DetallespagorealizarComponent,
        data: { titulo: "Pagos a Realizar Detalles" }
      },
      {
        path: "tipos-pago",
        component: TipospagosComponent,
        data: { titulo: "Tipos de Pago" }
      },
      {
        path: "tipo-cambio",
        component: TipoCambioComponent,
        data: { titulo: "Tipos de Cambio" }
      },
    ],
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule],
  declarations: [],
})
export class MantenimientoRutasModule { }
