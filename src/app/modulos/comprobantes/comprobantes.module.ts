import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';

import { ComprobantesRoutingModule } from './comprobantes-routing.module';
import { ListaComprobantesComponent } from './lista-comprobantes/lista-comprobantes.component';
import { EmisionComprobantesComponent } from './emision-comprobantes/emision-comprobantes.component';
import { InterceptorModule } from 'src/app/shared/interceptors/interceptor.module';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxSpinnerModule } from 'ngx-spinner';
import { AppMaterialModule } from 'src/app/shared/material/app-material.module';

export const COMPROBANTES_RUTAS_COMPONENTES = [
    ListaComprobantesComponent,
    EmisionComprobantesComponent
];

const libreria = [
  AppMaterialModule,
  NgxSpinnerModule,
  NgSelectModule,
  AutocompleteLibModule,
  InterceptorModule,
];

@NgModule({
  declarations: [COMPROBANTES_RUTAS_COMPONENTES],
  imports: [
    CommonModule,
    ComprobantesRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    ...libreria
  ]
})
export class ComprobantesModule {}
