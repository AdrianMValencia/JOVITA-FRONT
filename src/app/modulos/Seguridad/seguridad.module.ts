import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule,FormsModule } from "@angular/forms";

import { AppMaterialModule } from "../../shared/material/app-material.module";
import { NgxSpinnerModule } from 'ngx-spinner';
import { SeguridadRutasModule, SEGURIDAD_RUTAS_COMPONENTES } from './seguridad-rutas.module';
import { UserService } from "./services/user.service";

const libreria = [
  AppMaterialModule,
  NgxSpinnerModule
];

@NgModule({
  imports: [
    CommonModule,
    SeguridadRutasModule,
    FormsModule,
    ReactiveFormsModule,
    libreria
  ],
  providers: [UserService],
  declarations: [SEGURIDAD_RUTAS_COMPONENTES],
})
export class SeguridadModule {}
