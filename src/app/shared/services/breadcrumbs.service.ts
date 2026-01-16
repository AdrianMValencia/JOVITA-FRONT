import { Injectable } from '@angular/core';
import { Router, ActivationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})

export class BreadcrumbsService {

  constructor(private router:Router) { }

  getDataRoute(){
    return this.router.events.pipe(
      filter((evento: any) => evento instanceof ActivationEnd),
      filter((evento:ActivationEnd) => evento.snapshot.firstChild === null),
      map( (evento:ActivationEnd)=> evento.snapshot.data)
    )
  }
}
