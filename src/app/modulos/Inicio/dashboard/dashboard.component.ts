import { Component, OnInit } from '@angular/core';

import { ChartConfiguration, ChartOptions } from 'chart.js';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { ReporteVentas } from 'src/app/modulos/reportes/model/reporteVentas';
import { ReporteVentasTotales } from 'src/app/modulos/reportes/model/reporteVentasTotales';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

import { Barras } from '../model/barras';
import { Lineal } from '../model/lineal';
import { DashboardService } from '../service/dashboard.service';
declare var $: any;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css', './dashboard.component.scss'],
  providers: [DashboardService],
})
export class DashboardComponent implements OnInit {
  reporteVentasTotales: ReporteVentas = new ReporteVentas('', '', '', '', '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  lineal: Lineal = new Lineal();
  barras: Barras = new Barras();

  fecha: Date = new Date();
  ventasTotales: ReporteVentasTotales[] = [];
  ventasTotalesAnio: ReporteVentasTotales[] = [];

  //DASHBOARD LINEAL
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      { data: [], label: 'VENTAS' },
      { data: [], label: 'COMPRAS' },
    ],
  };

  public lineChartDataAnio: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      { data: [], label: 'VENTAS' },
      { data: [], label: 'COMPRAS' },
    ],
  };

  lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
  };

  lineChartOptionsAnio: ChartOptions<'line'> = {
    responsive: true,
  };

  lineChartLegend = true;
  lineChartLegendAnio = true;

  // DASHBOARD BARRAS
  barChartLegend = true;
  barChartLegendAnio = true;

  barChartPlugins = [];
  barChartPluginsAnio = [];

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      { data: [], label: 'VENTAS' },
      { data: [], label: 'COMPRAS' },
    ],
  };

  public barChartDataAnio: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      { data: [], label: 'VENTAS' },
      { data: [], label: 'COMPRAS' },
    ],
  };

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
  };
  barChartOptionsAnio: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
  };

  fechaIni: string = '';
  fechaFin: string = '';
  fechaMesAno: number | any = this.fecha.getFullYear();

  constructor(
    public service: DashboardService,
    public funcionesService: FuncionesService
  ) {}

  ngOnInit() {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);

    this.fechaIni = this.funcionesService.primerDiaMes();
    this.fechaFin = this.funcionesService.ultimoDiaMes();

    this.cargarDashboardMes();
    this.cargarDashboardAnio();
  }

  cargarDashboardMes() {
    this.funcionesService.showLoading();
    this.reporteVentasTotales.idPuntoVenta = this.puntoVentas.id;
    this.reporteVentasTotales.fechaInicio = this.fechaIni;
    this.reporteVentasTotales.fechaFin = this.fechaFin;
    this.service
      .cargarReporteVentasTotales(this.reporteVentasTotales)
      .subscribe((response) => {
        if (response.status === 200) {
          this.funcionesService.hideLoading();
          this.cargarLinealVentasTotalesMes(response.ventasTotales);
          this.cargarBarrasVentasTotalesMes(response.ventasTotales);
        } else {
          this.funcionesService.showWarning(response.status);
          this.funcionesService.hideLoading();
        }
      }, () => this.funcionesService.hideLoading());
  }

  cargarDashboardAnio() {
    this.funcionesService.showLoading();
    this.reporteVentasTotales.idPuntoVenta = this.puntoVentas.id;
    this.reporteVentasTotales.fecha = this.fechaMesAno;
    this.service
      .cargarReporteVentasTotalesAnio(this.reporteVentasTotales)
      .subscribe((response) => {
        if (response.status === 200) {
          this.funcionesService.hideLoading();
          this.cargarLinealVentasTotalesAnio(response.ventasTotales);
          this.cargarBarrasVentasTotalesAnio(response.ventasTotales);
        } else {
          this.funcionesService.showWarning(response.status);
          this.funcionesService.hideLoading();
        }
      }, () => this.funcionesService.hideLoading());
  }

  cargarLinealVentasTotalesMes(ventasTotales: ReporteVentasTotales[]) {
    this.lineChartData = {
      labels: [],
      datasets: [
        { data: [], label: 'VENTAS' },
        { data: [], label: 'COMPRAS' },
      ],
    };

    ventasTotales = ventasTotales.sort(
      this.funcionesService.orderBy2(['fecha', 'venta'])
    );
    this.lineChartData.datasets.forEach((element: any) => {
      ventasTotales.forEach((result) => {
        if (element.label === 'COMPRAS') {
          element.data.push(parseFloat(result.compra).toFixed(2));
        }
        if (element.label === 'VENTAS') {
          element.data.push(parseFloat(result.venta).toFixed(2));
        }

        this.lineChartData.labels?.push(result.fecha);
      });
    });

    var arraySinDuplicados = $.grep(
      this.lineChartData.labels,
      (elemento: any, indice: any) => {
        return $.inArray(elemento, this.lineChartData.labels) === indice;
      }
    );
    this.lineChartData.labels = arraySinDuplicados;
  }

  cargarBarrasVentasTotalesMes(ventasTotales: ReporteVentasTotales[]) {
    this.barChartData = {
      labels: [],
      datasets: [
        { data: [], label: 'VENTAS' },
        { data: [], label: 'COMPRAS' },
      ],
    };

    ventasTotales = ventasTotales.sort(
      this.funcionesService.orderBy2(['fecha', 'venta'])
    );
    this.barChartData.datasets.forEach((element: any) => {
      ventasTotales.forEach((result) => {
        if (element.label === 'COMPRAS') {
          element.data.push(parseFloat(result.compra).toFixed(2));
        }
        if (element.label === 'VENTAS') {
          element.data.push(parseFloat(result.venta).toFixed(2));
        }

        this.barChartData.labels?.push(result.fecha);
      });
    });

    var arraySinDuplicados = $.grep(
      this.barChartData.labels,
      (elemento: any, indice: any) => {
        return $.inArray(elemento, this.barChartData.labels) === indice;
      }
    );
    this.barChartData.labels = arraySinDuplicados;
  }

  cargarLinealVentasTotalesAnio(ventasTotales: ReporteVentasTotales[]) {
    this.lineChartDataAnio = {
      labels: [],
      datasets: [
        { data: [], label: 'VENTAS' },
        { data: [], label: 'COMPRAS' },
      ],
    };

    ventasTotales = ventasTotales.sort(
      this.funcionesService.orderBy2(['ano', 'mes'])
    );
    this.lineChartDataAnio.datasets.forEach((element: any) => {
      ventasTotales.forEach((result: any) => {
        if (element.label === 'COMPRAS') {
          element.data.push(parseFloat(result.compra).toFixed(2));
        }
        if (element.label === 'VENTAS') {
          element.data.push(parseFloat(result.venta).toFixed(2));
        }

        this.lineChartDataAnio.labels?.push(
          this.funcionesService.meses(result.mes) + '-' + result.ano
        );
      });
    });

    var arraySinDuplicados = $.grep(
      this.lineChartDataAnio.labels,
      (elemento: any, indice: any) => {
        return $.inArray(elemento, this.lineChartDataAnio.labels) === indice;
      }
    );
    this.lineChartDataAnio.labels = arraySinDuplicados;
  }

  cargarBarrasVentasTotalesAnio(ventasTotales: ReporteVentasTotales[]) {
    this.barChartDataAnio = {
      labels: [],
      datasets: [
        { data: [], label: 'VENTAS' },
        { data: [], label: 'COMPRAS' },
      ],
    };

    ventasTotales = ventasTotales.sort(
      this.funcionesService.orderBy2(['ano', 'mes'])
    );
    this.barChartDataAnio.datasets.forEach((element: any) => {
      ventasTotales.forEach((result: any) => {
        if (element.label === 'COMPRAS') {
          element.data.push(parseFloat(result.compra).toFixed(2));
        }
        if (element.label === 'VENTAS') {
          element.data.push(parseFloat(result.venta).toFixed(2));
        }

        this.barChartDataAnio.labels?.push(
          this.funcionesService.meses(result.mes) + '-' + result.ano
        );
      });
    });

    var arraySinDuplicados = $.grep(
      this.barChartDataAnio.labels,
      (elemento: any, indice: any) => {
        return $.inArray(elemento, this.barChartDataAnio.labels) === indice;
      }
    );
    this.barChartDataAnio.labels = arraySinDuplicados;
  }
}
