import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule,FormsModule } from "@angular/forms";

import { AppMaterialModule } from "../../shared/material/app-material.module";
import { NgxSpinnerModule } from 'ngx-spinner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InterceptorModule } from '../../shared/interceptors/interceptor.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';

const libreria = [
  AppMaterialModule,
  NgxSpinnerModule,
  NgSelectModule,
  AutocompleteLibModule
];

import {
  MantenimientoRutasModule,
  MANTENIMIENTO_RUTAS_COMPONENTES
} from "./mantenimiento-rutas.module";

@NgModule({
  imports: [
    CommonModule,
    MantenimientoRutasModule,
    ReactiveFormsModule,
    FormsModule,
    BrowserAnimationsModule,
    libreria,
    InterceptorModule
  ],
  declarations: [MANTENIMIENTO_RUTAS_COMPONENTES],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MantenimientoModule {}
