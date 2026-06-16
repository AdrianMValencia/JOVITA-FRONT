import { CommonModule } from '@angular/common';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { InterceptorModule } from 'src/app/shared/interceptors/interceptor.module';
import { AppMaterialModule } from 'src/app/shared/material/app-material.module';
import { NgxSpinnerModule } from 'ngx-spinner';

import { ContabilidadRutasModule, CONTABILIDAD_RUTAS_COMPONENTES } from './contabilidad-rutas.module';

@NgModule({
  imports: [
    CommonModule,
    ContabilidadRutasModule,
    ReactiveFormsModule,
    FormsModule,
    AppMaterialModule,
    InterceptorModule,
    NgxSpinnerModule
  ],
  declarations: [CONTABILIDAD_RUTAS_COMPONENTES],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ContabilidadModule {}
