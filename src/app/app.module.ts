import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { JwtModule } from '@auth0/angular-jwt';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/moment';
import * as moment from 'moment';
import { NgChartsModule } from 'ng2-charts';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrModule } from 'ngx-toastr';
import { AppRoutingModule, ROUTING_COMPONENTS } from 'src/app/app-routing.module';
import { AppComponent } from 'src/app/app.component';
import { InicioModule } from 'src/app/modulos/Inicio/inicio.module';
import { SeguridadModule } from 'src/app/modulos/Seguridad/seguridad.module';
import { UsuariosModule } from 'src/app/modulos/Usuarios/usuarios.module';
import { AlmacenModule } from 'src/app/modulos/almacen/almacen.module';
import { CierrecajaModule } from 'src/app/modulos/cierrecaja/cierrecaja.module';
import { ComprasModule } from 'src/app/modulos/compras/compras.module';
import { ConfiguracionModule } from 'src/app/modulos/configuracion/configuracion.module';
import { InventariosModule } from 'src/app/modulos/inventarios/inventarios.module';
import { MantenimientoModule } from 'src/app/modulos/mantenimientos/mantenimiento.module';
import { PedidosModule } from 'src/app/modulos/pedidos/pedidos.module';
import { ReportesModule } from 'src/app/modulos/reportes/reportes.module';
import { ContabilidadModule } from 'src/app/modulos/contabilidad/contabilidad.module';
import { ValidacionesModule } from 'src/app/modulos/validaciones/validaciones.module';
import { VentasModule } from 'src/app/modulos/ventas/ventas.module';
import { AppMaterialModule } from 'src/app/shared/material/app-material.module';
import { getSpanishPaginatorIntl } from 'src/app/spanish-paginator-intl';
import { OverlayContainer, FullscreenOverlayContainer } from '@angular/cdk/overlay';

export function momentAdapterFactory() {
  return adapterFactory(moment);
};
export function tokenGetter() {
  return localStorage.getItem("jwt");
}

@NgModule({
  declarations: [
    AppComponent, ROUTING_COMPONENTS
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    SeguridadModule,
    InicioModule,
    FormsModule,
    NgxSpinnerModule.forRoot({ type: 'ball-scale-multiple' }),
    ToastrModule.forRoot({
      timeOut: 4000,
      closeButton: true,
      preventDuplicates: true,
      progressBar: true,
      progressAnimation: 'increasing'
    }),
    JwtModule.forRoot({
      config: {
        tokenGetter:  () => tokenGetter(),
        allowedDomains: ["localhost:4200"],
      }
    }),
    AppMaterialModule,
    NgbModule,
    CalendarModule.forRoot({ provide: DateAdapter, useFactory: momentAdapterFactory }),
    CommonModule,
    NgChartsModule,
    MantenimientoModule,
    VentasModule,
    AlmacenModule,
    ComprasModule,
    ReportesModule,
    ContabilidadModule,
    UsuariosModule,
    ConfiguracionModule,
    CierrecajaModule,
    InventariosModule,
    PedidosModule,
    ValidacionesModule,
    CommonModule
  ],
  exports: [
    NgxSpinnerModule
  ],
  providers: [
    { provide: MatPaginatorIntl, useValue: getSpanishPaginatorIntl() },
    { provide: OverlayContainer, useClass: FullscreenOverlayContainer }
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}
