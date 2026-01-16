import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { LoginComponent } from "./login/login.component";
import { containerLoginComponent } from "./containerLogin/containerLogin.component";

export const SEGURIDAD_RUTAS_COMPONENTES = [
  LoginComponent,
  containerLoginComponent
];

const routes: Routes = [
  {
    path: "",
    component: containerLoginComponent,
    children: [
      {
        path: "login",
        component: LoginComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule],
  declarations: [],
})
export class SeguridadRutasModule {}
