import { CommonModule } from '@angular/common';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule,FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgSelectModule } from '@ng-select/ng-select';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';
import { NgxSpinnerModule } from 'ngx-spinner';
import { InterceptorModule } from 'src/app/shared/interceptors/interceptor.module';
import { AppMaterialModule } from 'src/app/shared/material/app-material.module';

const libreria = [
  AppMaterialModule,
  BrowserAnimationsModule,
  NgxSpinnerModule.forRoot({ type: 'ball-scale-multiple' }),
  NgSelectModule,
  AutocompleteLibModule
];

import {
  ComprasRutasModule,
  COMPRAS_RUTAS_COMPONENTES
} from "./compras-rutas.module";

@NgModule({
  imports: [
    CommonModule,
    ComprasRutasModule,
    ReactiveFormsModule,
    FormsModule  ,
    BrowserAnimationsModule,
    libreria,
    InterceptorModule
  ],
  declarations: [COMPRAS_RUTAS_COMPONENTES],
  entryComponents: [COMPRAS_RUTAS_COMPONENTES],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ComprasModule {}
