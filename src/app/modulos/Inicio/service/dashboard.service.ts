import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs-compat';
import { ReporteVentasTotalesNew } from '../../reportes/model/reporteVentasTotalesNew';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  urlBase = environment.BASE_URL + 'dashboard/';

  constructor(private http: HttpClient) {}

  cargarReporteVentasTotales(reporte: ReporteVentasTotalesNew): Observable<any> {
    return this.http.post(
      environment.BASE_URL + 'ventasTotales/ventasMes', reporte
    );
  }

  cargarReporteVentasTotalesAnio(reporte: ReporteVentasTotalesNew): Observable<any> {
    return this.http.post(
      environment.BASE_URL + 'ventasTotales/ventasAnio', reporte
    );
  }

  cargarReporteVentasTotalesNew(
    reporte: ReporteVentasTotalesNew
  ): Observable<any> {
    return this.http.post(
      environment.BASE_URL + 'ventasTotalesNew/ventasMes',
      reporte
    );
  }

  cargarReporteVentasTotalesNewAnio(reporte: ReporteVentasTotalesNew): Observable<any> {
    return this.http.post(
      environment.BASE_URL + 'ventasTotalesNew/ventasAnio', reporte
    );
  }
}
