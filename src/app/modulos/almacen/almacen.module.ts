import { CommonModule } from '@angular/common';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule,FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgSelectModule } from '@ng-select/ng-select';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';
import { NgxBarcode6Module } from 'ngx-barcode6';
import { NgxSpinnerModule } from 'ngx-spinner';
import { InterceptorModule } from 'src/app/shared/interceptors/interceptor.module';
import { AppMaterialModule } from 'src/app/shared/material/app-material.module';

const libreria = [
  AppMaterialModule,
  NgxSpinnerModule.forRoot({ type: 'ball-scale-multiple' }),
  NgSelectModule,
  AutocompleteLibModule,
  NgxBarcode6Module
];

import {
  AlmacenRutasModule,
  ALMACEN_RUTAS_COMPONENTES
} from "./almacen-rutas.module";

@NgModule({
  imports: [
    CommonModule,
    AlmacenRutasModule,
    ReactiveFormsModule,
    FormsModule  ,
    BrowserAnimationsModule,
    libreria,
    InterceptorModule
  ],
  exports: [
    NgxSpinnerModule
  ],
  declarations: [ALMACEN_RUTAS_COMPONENTES],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AlmacenModule {}
