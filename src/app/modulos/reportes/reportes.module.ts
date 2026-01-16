import { CommonModule } from '@angular/common';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule,FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgSelectModule } from '@ng-select/ng-select';
import { NgxSpinnerModule } from 'ngx-spinner';
import { InterceptorModule } from 'src/app/shared/interceptors/interceptor.module';
import { AppMaterialModule } from 'src/app/shared/material/app-material.module';

const libreria = [
  AppMaterialModule,
  NgxSpinnerModule,
  NgSelectModule,
  AutocompleteLibModule
];

import {
  ReportesRutasModule,
  REPORTES_RUTAS_COMPONENTES
} from "./reportes-rutas.module";
import { AutocompleteLibModule } from 'angular-ng-autocomplete';
import { PipesModule } from "../../shared/pipe/pipes.module";

@NgModule({
  imports: [
    CommonModule,
    ReportesRutasModule,
    ReactiveFormsModule,
    FormsModule,
    BrowserAnimationsModule,
    libreria,
    InterceptorModule,
    PipesModule
],
  declarations: [REPORTES_RUTAS_COMPONENTES],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ReportesModule {}
