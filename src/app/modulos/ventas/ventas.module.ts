import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule,FormsModule } from "@angular/forms";

import { AppMaterialModule } from "../../shared/material/app-material.module";
import { NgxSpinnerModule } from 'ngx-spinner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InterceptorModule } from '../../shared/interceptors/interceptor.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { VentasRutasModule, VENTAS_RUTAS_COMPONENTES } from './ventas-rutas.module';
import { PipesModule } from '../../shared/pipe/pipes.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';

const libreria = [
  AppMaterialModule,
  BrowserAnimationsModule,
  NgxSpinnerModule.forRoot({ type: 'ball-scale-multiple' }),
  NgSelectModule,
  NgbModule,
  AutocompleteLibModule
];

@NgModule({
  imports: [
    CommonModule,
    VentasRutasModule,
    ReactiveFormsModule,
    FormsModule  ,
    BrowserAnimationsModule,
    libreria,
    InterceptorModule,
    PipesModule
  ],
  declarations: [VENTAS_RUTAS_COMPONENTES],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class VentasModule {}
