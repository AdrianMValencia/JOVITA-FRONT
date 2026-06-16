import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ContainerInsideComponent } from 'src/app/shared/components/container-inside/container-inside.component';
import { Oauth2Guard } from 'src/app/shared/guards/oauth2.guard';

import { ProductosStockMinimoComponent } from './productos-stock-minimo/productos-stock-minimo.component';
import { ReporetemovimientoComponent } from './reporetemovimiento/reporetemovimiento.component';
import { ReporteComprasResumidasComponent } from './reporteComprasResumidas/reporteComprasResumidas.component';
import { ReporteInventarioComponent } from './reporteInventario/reporteInventario.component';
import { ReporteMensualporVendedorComponent } from './reporteMensualporVendedor/reporteMensualporVendedor.component';
import { ReporteProveedoresXProductosComponent } from './reporteProveedoresXProductos/reporteProveedoresXProductos.component';
import { ReporteSobrantesVsFaltantesComponent } from './reporteSobrantesVsFaltantes/reporteSobrantesVsFaltantes.component';
import { ReporteVentaComprasDiariasComponent } from './reporteVentaComprasDiarias/reporteVentaComprasDiarias.component';
import { ReportecomparacionventasvendedoresComponent } from './reportecomparacionventasvendedores/reportecomparacionventasvendedores.component';
import { ReporteflujoinversionComponent } from './reporteflujoinversion/reporteflujoinversion.component';
import { ReportegananciatiendasComponent } from './reportegananciatiendas/reportegananciatiendas.component';
import { ReporteproductospuntoventaComponent } from './reporteproductospuntoventa/reporteproductospuntoventa.component';
import { ReportevalorizaciondiariaComponent } from './reportevalorizaciondiaria/reportevalorizaciondiaria.component';
import { ReportevalorizacionproductosComponent } from './reportevalorizacionproductos/reportevalorizacionproductos.component';
import { ReporteventastotalesComponent } from './reporteventastotales/reporteventastotales.component';
import { ReporteventastotalesanioComponent } from './reporteventastotalesanio/reporteventastotalesanio.component';
import { ReporteVentasCategoriasDetalladoComponent } from './ventas-categorias-detallado/ventas-categorias-detallado.component';

export const REPORTES_RUTAS_COMPONENTES = [
  ReporteInventarioComponent, ReporetemovimientoComponent, ReporteventastotalesComponent, ReporteventastotalesanioComponent,
  ReportecomparacionventasvendedoresComponent, ReporteproductospuntoventaComponent, ReportegananciatiendasComponent,
  ReportevalorizacionproductosComponent, ReporteflujoinversionComponent, ReportevalorizaciondiariaComponent, ReporteMensualporVendedorComponent,
  ReporteComprasResumidasComponent, ReporteVentaComprasDiariasComponent, ReporteSobrantesVsFaltantesComponent, ReporteProveedoresXProductosComponent,
  ProductosStockMinimoComponent, ReporteVentasCategoriasDetalladoComponent
];

const routes: Routes = [
  {
    path: "reportes",
    component: ContainerInsideComponent,
    canActivate: [Oauth2Guard],
    children: [
      {
        path: "reporte-inventario",
        component: ReporteInventarioComponent,
        data: {titulo: 'Reporte de Inventario'}
      },
      {
        path: "historial-movimiento-inventario",
        component: ReporetemovimientoComponent,
        data: {titulo: 'Historial de Movimiento Inventario'}
      },
      {
        path: "ventas-totales-mes",
        component: ReporteventastotalesComponent,
        data: {titulo: 'Ventas Diarias'}
      },
      {
        path: "ventas-totales-anio",
        component: ReporteventastotalesanioComponent,
        data: {titulo: 'Ventas Mensuales'}
      },
      {
        path: "comparacion-ventas-vendedores",
        component: ReportecomparacionventasvendedoresComponent,
        data: {titulo: 'Reporte de Comparación de Ventas de Vendedores'}
      },
      {
        path: "productos-punto-de-venta",
        component: ReporteproductospuntoventaComponent,
        data: {titulo: 'Reporte de Productos por Punto de Venta'}
      },
      {
        path: "ganancia-tiendas",
        component: ReportegananciatiendasComponent,
        data: {titulo: 'Reporte Ganancias por tienda'}
      },
      {
        path: "valorizacion-productos",
        component: ReportevalorizacionproductosComponent,
        data: {titulo: 'Reporte Valorización de Productos'}
      },
      {
        path: "flujo-inversion",
        component: ReporteflujoinversionComponent,
        data: {titulo: 'Reporte Flujo de Inversión'}
      },
      {
        path: "valorizacion-diaria",
        component: ReportevalorizaciondiariaComponent,
        data: { titulo: 'Valorización Diaria'}
      },
      {
        path: "reporte-mensual-por-vendedor",
        component: ReporteMensualporVendedorComponent,
        data: {titulo: 'Venta Mensual por Vendedor'}
      },
      {
        path: "compras-resumidas-por-proveedor",
        component: ReporteComprasResumidasComponent,
        data: {titulo: 'Compras por Proveedor'}
      },
      {
        path: "venta-contra-compras-diarias",
        component: ReporteVentaComprasDiariasComponent,
        data: {titulo: 'Ventas vs Compras'}
      },
      {
        path: "sobrante-vs-faltante",
        component: ReporteSobrantesVsFaltantesComponent,
        data: {titulo: 'Sobrante vs Faltante'}
      },
            {
        path: "proveedores-productos",
        component: ReporteProveedoresXProductosComponent,
        data: {titulo: 'Proveedores por Producto'}
      },
      {
        path: "ventas-categorias-detallado",
        component: ReporteVentasCategoriasDetalladoComponent,
        data: {titulo: 'Ventas por Categorias Detallado'}
      },
      {
        path: "productos-stock-minimo",
        component: ProductosStockMinimoComponent,
        data: {titulo: 'Productos con Stock Mínimo'}
      },
    ],
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule],
   declarations: []
})
export class ReportesRutasModule { }
