import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';
import { NgxSpinnerModule } from 'ngx-spinner';
import { InterceptorModule } from 'src/app/shared/interceptors/interceptor.module';
import { AppMaterialModule } from 'src/app/shared/material/app-material.module';
import { PipesModule } from 'src/app/shared/pipe/pipes.module';

import { CIERRECAJA_RUTAS_COMPONENTES, CierrecajaRutasModule } from './cierrecaja-rutas.module';

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
    CierrecajaRutasModule,
    ReactiveFormsModule,
    FormsModule,
    BrowserAnimationsModule,
    libreria,
    InterceptorModule,
    PipesModule
  ],
  exports: [],
  declarations: [CIERRECAJA_RUTAS_COMPONENTES],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CierrecajaModule {}
