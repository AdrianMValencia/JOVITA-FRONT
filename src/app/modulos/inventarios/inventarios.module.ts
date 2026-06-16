import { CommonModule } from '@angular/common';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule,FormsModule } from '@angular/forms';

import { NgSelectModule } from '@ng-select/ng-select';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';
import { NgxSpinnerModule } from 'ngx-spinner';
import { InterceptorModule } from 'src/app/shared/interceptors/interceptor.module';
import { AppMaterialModule } from 'src/app/shared/material/app-material.module';

import { INVENTARIOS_RUTAS_COMPONENTES, InventariosRutasModule } from './inventarios-rutas.module';

const libreria = [
  AppMaterialModule,
  NgxSpinnerModule,
  NgSelectModule,
  AutocompleteLibModule,
  InterceptorModule,
];

@NgModule({
  imports: [
    CommonModule,
    InventariosRutasModule,
    ReactiveFormsModule,
    FormsModule,
    libreria,
  ],
  declarations: [INVENTARIOS_RUTAS_COMPONENTES],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class InventariosModule {}
