import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule,FormsModule } from "@angular/forms";

import { AppMaterialModule } from "../../shared/material/app-material.module";
import { NgxSpinnerModule } from 'ngx-spinner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InterceptorModule } from '../../shared/interceptors/interceptor.module';
import { NgSelectModule } from '@ng-select/ng-select';

const libreria = [
  AppMaterialModule,
  NgxSpinnerModule,
  NgSelectModule
];

import {
  ConfiguracionRutasModule,
  CONFIGURACION_RUTAS_COMPONENTES
} from "./configuracion-rutas.module";

@NgModule({
  imports: [
    CommonModule,
    ConfiguracionRutasModule,
    ReactiveFormsModule,
    FormsModule  ,
    BrowserAnimationsModule,
    libreria,
    InterceptorModule
  ],
  declarations: [CONFIGURACION_RUTAS_COMPONENTES],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ConfiguracionModule {}
