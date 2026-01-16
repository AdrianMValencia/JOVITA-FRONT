import { DatePipe, DecimalPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CierrecajaComponent } from 'src/app/modulos/cierrecaja/cierre/cierrecaja.component';
import { ContainerInsideComponent } from 'src/app/shared/components/container-inside/container-inside.component';
import { Oauth2Guard } from 'src/app/shared/guards/oauth2.guard';

import { CotizacionComponent } from './cotizacion/cotizacion.component';
import { DownloadPDFComponent } from './cotizacion/downloadPDF/downloadPDF.component';
import { ModalItemsComponent } from './cotizacion/modal-items/modal-items.component';
import { ModalCotizacionComponent } from './cotizacion/modalCotizacion/modalCotizacion.component';
import { DevolucionesComponent } from './devoluciones/devoluciones.component';
import { ModalItemsConsultarComponent } from './recibos/modalItemsConsultar/modalItemsConsultar.component';
import { ModalRecibosComponent } from './recibos/modalRecibos/modalRecibos.component';
import { ModalRecibosCorreoComponent } from './recibos/modalRecibosCorreo/modalRecibosCorreo.component';
import { ModalRecibosCorreoPersoComponent } from './recibos/modalRecibosCorreoPerso/modalRecibosCorreoPerso.component';
import { ModalRecibosItemsComponent } from './recibos/modalRecibosItems/modalRecibosItems.component';
import { ModalRecibosMedioPagosComponent } from './recibos/modalRecibosMedioPagos/modalRecibosMedioPagos.component';
import { ModalRecibosPDFComponent } from './recibos/modalRecibosPDF/modalRecibosPDF.component';
import { ModalconvertirkilosComponent } from './recibos/modalconvertirkilos/modalconvertirkilos.component';
import { ModaleditarrecibosComponent } from './recibos/modaleditarrecibos/modaleditarrecibos.component';
import { RecibosComponent } from './recibos/recibos.component';

export const VENTAS_RUTAS_COMPONENTES = [
  RecibosComponent, ModalRecibosPDFComponent, ModalRecibosMedioPagosComponent, ModalRecibosItemsComponent,
  ModalRecibosCorreoComponent, ModalRecibosCorreoPersoComponent, ModalRecibosComponent, CotizacionComponent,
  ModalCotizacionComponent, ModalItemsComponent, DownloadPDFComponent, DevolucionesComponent,
  ModalconvertirkilosComponent, ModaleditarrecibosComponent, ModalItemsConsultarComponent
];

const routes: Routes = [
  {
    path: "ventas",
    component: ContainerInsideComponent,
    canActivate: [Oauth2Guard],
    children: [
      {
        path: "tickets",
        component: RecibosComponent,
        data: {titulo: 'Tickets'}
      },
      {
        path: "registrar-ticket",
        component: ModalRecibosComponent,
        data: {titulo: 'Venta de Productos'}
      },
      {
        path: "pedidos",
        component: CotizacionComponent,
        data: {titulo: 'Pedidos'}
      },
      {
        path: "devoluciones",
        component: DevolucionesComponent,
        data: {titulo: 'Devoluciones'}
      },
      {
        path: "apertura-cierre-caja",
        component: CierrecajaComponent,
        data: {titulo: 'Apertura y Cierre de Caja'}
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
export class VentasRutasModule { }
