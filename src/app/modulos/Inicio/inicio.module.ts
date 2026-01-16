import { FormsModule } from '@angular/forms';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from "@angular/common";
import { NgChartsModule } from 'ng2-charts';

import {
  InicioRutasModule,
  INICIO_RUTAS_COMPOMENTES,
} from "./inicio-rutas.module";

@NgModule({
  imports: [CommonModule, InicioRutasModule, NgChartsModule, FormsModule],
  declarations: [INICIO_RUTAS_COMPOMENTES],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class InicioModule {}
