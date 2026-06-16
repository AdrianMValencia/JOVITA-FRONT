import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ContainerInsideComponent } from 'src/app/shared/components/container-inside/container-inside.component';
import { Oauth2Guard } from 'src/app/shared/guards/oauth2.guard';

import { RceComprasComponent } from './rce-compras/rce-compras.component';
import { RvieVentasComponent } from './rvie-ventas/rvie-ventas.component';
import { InventarioValorizadoSunatComponent } from './inventario-valorizado-sunat/inventario-valorizado-sunat.component';
import { KardexGeneralComponent } from './kardex-general/kardex-general.component';

export const CONTABILIDAD_RUTAS_COMPONENTES = [
  RceComprasComponent,
  RvieVentasComponent,
  InventarioValorizadoSunatComponent,
  KardexGeneralComponent
];

const routes: Routes = [
  {
    path: 'contabilidad',
    component: ContainerInsideComponent,
    canActivate: [Oauth2Guard],
    children: [
      {
        path: 'rce-compras',
        component: RceComprasComponent,
        data: { titulo: 'Reporte de Compras (RCE)' }
      },
      {
        path: 'rce-ventas',
        component: RvieVentasComponent,
        data: { titulo: 'Reporte de Ventas (RVIE)' }
      },
      {
        path: 'inventario-valorizado-sunat',
        component: InventarioValorizadoSunatComponent,
        data: { titulo: 'Inventario valorizado SUNAT' }
      },
      {
        path: 'kardex-general',
        component: KardexGeneralComponent,
        data: { titulo: 'Kardex general' }
      },
      { path: '', pathMatch: 'full', redirectTo: 'rce-compras' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
  declarations: []
})
export class ContabilidadRutasModule {}
