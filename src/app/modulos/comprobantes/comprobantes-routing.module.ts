import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ContainerInsideComponent } from 'src/app/shared/components/container-inside/container-inside.component';
import { Oauth2Guard } from 'src/app/shared/guards/oauth2.guard';
import { ListaComprobantesComponent } from './lista-comprobantes/lista-comprobantes.component';
import { EmisionComprobantesComponent } from './emision-comprobantes/emision-comprobantes.component';

const routes: Routes = [
    {
        // module is already mounted at '/comprobantes' by the lazy loader,
        // so use empty path here to avoid duplicating the segment.
        path: "",
        component: ContainerInsideComponent,
        canActivate: [Oauth2Guard],
        children:[
          {
              path: "lista-comprobantes",
              component: ListaComprobantesComponent,
              data: { titulo: "Lista de Comprobantes" }
          },
          {
              path: "emision-comprobantes",
              component: EmisionComprobantesComponent,
              data: { titulo: "Emisión de Comprobantes" }
          },
          // redirect bare module URL to the default child
          { path: "", redirectTo: "lista-comprobantes", pathMatch: "full" }
        ]
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ComprobantesRoutingModule {}