import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.prod';
import { Observable } from 'rxjs-compat';
import { SeriesTickets } from '../models/seriesTickets';

@Injectable()
export class SeriesticketsService {
  urlBase = environment.BASE_URL + 'seriesTickets';

  constructor(private http: HttpClient){}

  cargarSeriesTickets(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  obtenerSeriesTickets(id: number): Observable<any> {
    return this.http.get(this.urlBase + '/' + id);
  }

  crudSeriesTickets(seriesTickets: SeriesTickets): Observable<any> {
    if(seriesTickets.id === 0){
      return this.http.post(this.urlBase, seriesTickets);
    }else{
      return this.http.put(this.urlBase + '/' + seriesTickets.id, seriesTickets);
    }
  }

  deleteSeriesTickets(seriesTickets: SeriesTickets): Observable<any> {
    return this.http.delete(this.urlBase + '/' + seriesTickets.id, { body: seriesTickets });
  }
}
