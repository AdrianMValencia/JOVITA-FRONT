import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ContainerInsideComponent } from 'src/app/shared/components/container-inside/container-inside.component';
import { Oauth2Guard } from 'src/app/shared/guards/oauth2.guard';

import { AbastecimientoPuntoVentaComponent } from './abastecimiento-punto-venta/abastecimiento-punto-venta.component';
import { ModalabastecimientodetallesComponent } from './abastecimiento-punto-venta/modalabastecimientodetalles/modalabastecimientodetalles.component';
import { ModalabastecimientopdfComponent } from './abastecimiento-punto-venta/modalabastecimientopdf/modalabastecimientopdf.component';
import { AbastecimientoComponent } from './abastecimiento/abastecimiento.component';
import { AlmacenesComponent } from './almacenes/almacenes.component';
import { ModalalmacenesComponent } from './almacenes/modalalmacenes/modalalmacenes.component';
import { CategoriasComponent } from './categorias/categorias.component';
import { ModalCategoriasComponent } from './categorias/modalCategorias/modalCategorias.component';
import { ModalProductosCategorias } from './categorias/modalProductosCategorias/modalProductosCategorias.component';
import { MovimientoInventarioProductosComponent } from './movimiento-inventario-productos/movimiento-inventario-productos.component';
import { ModalAsignarProveedoresComponent } from './productos/modalAsignarProveedores/modalAsignarProveedores.component';
import { ModalProductosComponent } from './productos/modalProductos/modalProductos.component';
import { ProductosComponent } from './productos/productos.component';
import { ModalProductoAjustesComponent } from './repuestosAjustes/modalProductoAjustes/modalProductoAjustes.component';
import { ProductoAjustesComponent } from './repuestosAjustes/productoAjustes.component';
import { StocktiendasComponent } from './stocktiendas/stocktiendas.component';
import { ModalubicacionesComponent } from './ubicaciones/modalubicaciones/modalubicaciones.component';
import { UbicacionesComponent } from './ubicaciones/ubicaciones.component';
import { ModalunidadmedidasComponent } from './unidadmedidas/modalunidadmedidas/modalunidadmedidas.component';
import { UnidadmedidasComponent } from './unidadmedidas/unidadmedidas.component';
import { AjustesInventarioComponent } from './ajustes-inventario/ajustes-inventario.component';
import { CrudAjusteInventarioComponent } from './ajustes-inventario/crud-ajuste-inventario/crud-ajuste-inventario.component';
import { ModalImagenProductoComponent } from './productos/modalImagenProducto/modalImagenProducto.component';
import { ModalImagenCategoriaComponent } from './categorias/modalImagenCategoria/modalImagenCategoria.component';

export const ALMACEN_RUTAS_COMPONENTES = [
  CategoriasComponent, ModalCategoriasComponent, UnidadmedidasComponent, ModalunidadmedidasComponent,
  ProductosComponent, ModalProductosComponent, ProductoAjustesComponent, ModalProductoAjustesComponent,
  UbicacionesComponent, ModalubicacionesComponent, AlmacenesComponent, ModalalmacenesComponent,
  MovimientoInventarioProductosComponent, AbastecimientoComponent, StocktiendasComponent, AbastecimientoPuntoVentaComponent,
  ModalabastecimientopdfComponent, ModalabastecimientodetallesComponent, ModalProductosCategorias, ModalAsignarProveedoresComponent,
  AjustesInventarioComponent, CrudAjusteInventarioComponent, ModalImagenProductoComponent, ModalImagenCategoriaComponent
];

const routes: Routes = [
  {
    path: "almacen",
    component: ContainerInsideComponent,
    canActivate: [Oauth2Guard],
    children: [
      {
        path: "categorias",
        component: CategoriasComponent,
        data: { titulo: "Categorias" }
      },
      {
        path: "unidad-medidas",
        component: UnidadmedidasComponent,
        data: { titulo: "Unidad de Medida" }
      },
      {
        path: "productos",
        component: ProductosComponent,
        data: { titulo: "Productos" }
      },
      {
        path: "producto-ajustes",
        component: ProductoAjustesComponent,
        data: { titulo: "Producto Ajustes" }
      },
      {
        path: "ubicaciones",
        component: UbicacionesComponent,
        data: { titulo: "Ubicaciones" }
      },
      {
        path: "almacenes",
        component: AlmacenesComponent,
        data: { titulo: "Almacenes" }
      },
      {
        path: "movimientos-inventarios-productos",
        component: MovimientoInventarioProductosComponent,
        data: { titulo: "Movimientos de Inventario de Productos" }
      },
      {
        path: "abastecimiento",
        component: AbastecimientoComponent,
        data: { titulo: "Abastecimiento de tiendas" }
      },
      {
        path: "stock-tiendas",
        component: StocktiendasComponent,
        data: { titulo: "Stock de Tiendas" }
      },
      {
        path: "abastecimiento-punto-venta",
        component: AbastecimientoPuntoVentaComponent,
        data: { titulo: "Abastecimiento de Punto de Venta" }
      },
      {
        path: "ajustes-inventario",
        component: AjustesInventarioComponent,
        data: { titulo: "Ajustes por Inventario" }
      }
    ],
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AlmacenRutasModule { }
