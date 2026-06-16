import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule,FormsModule } from "@angular/forms";

import { AppMaterialModule } from "../../shared/material/app-material.module";
import { NgxSpinnerModule } from 'ngx-spinner';
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
  UsuariosRutasModule,
  USUARIOS_RUTAS_COMPONENTES
} from "./usuarios-rutas.module";

@NgModule({
  imports: [
    CommonModule,
    UsuariosRutasModule,
    ReactiveFormsModule,
    FormsModule  ,
    libreria,
    InterceptorModule
  ],
  declarations: [USUARIOS_RUTAS_COMPONENTES],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UsuariosModule {}
