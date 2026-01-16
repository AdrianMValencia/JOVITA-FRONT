import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BreadcrumbsComponent } from 'src/app/shared/components/breadcrumbs/breadcrumbs.component';
import { ContainerInsideComponent } from 'src/app/shared/components/container-inside/container-inside.component';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { SidebarComponent } from 'src/app/shared/components/sidebar/sidebar.component';

export const ROUTING_COMPONENTS = [
  ContainerInsideComponent,
  HeaderComponent,
  SidebarComponent,
  BreadcrumbsComponent,
  FooterComponent
];

const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppRoutingModule {}
