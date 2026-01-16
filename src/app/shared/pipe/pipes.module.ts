import { NgModule } from '@angular/core';

import { DomseguroPipe } from './domseguro.pipe';
import { MayusculaPipe } from './mayuscula.pipe';
import { MesesPipe } from './meses.pipe';

@NgModule({
  imports: [],
  declarations: [
    DomseguroPipe,
      MayusculaPipe,
      MesesPipe
   ],
  exports: [
    DomseguroPipe,
    MayusculaPipe,
    MesesPipe
  ]
})
export class PipesModule { }
