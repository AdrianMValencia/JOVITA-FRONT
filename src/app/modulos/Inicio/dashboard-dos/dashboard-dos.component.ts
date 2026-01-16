import { Component, OnInit } from '@angular/core';

import { ChartConfiguration, ChartOptions } from 'chart.js';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { ReporteVentasTotalesNew } from 'src/app/modulos/reportes/model/reporteVentasTotalesNew';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

import { Lineal } from '../model/lineal';
import { DashboardService } from '../service/dashboard.service';
declare var $: any;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard-dos.component.html',
  styleUrls: [
    './dashboard-dos.component.css',
    './dashboard-dos.component.scss',
  ],
  providers: [DashboardService],
})
export class DashboardDosComponent implements OnInit {
  reporteVentasTotales: ReporteVentasTotalesNew = new ReporteVentasTotalesNew(
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  lineal: Lineal = new Lineal();

  fecha: Date = new Date();
  ventasTotalesAnio: ReporteVentasTotalesNew[] = [];

  diaDesde: string | any = parseInt(
    this.funcionesService.primerDiaMes().split('-')[2]
  );
  mesDesde: string | any = parseInt(
    this.funcionesService.primerDiaMes().split('-')[1]
  );
  anioDesde: string | any =
    parseInt(this.funcionesService.primerDiaMes().split('-')[0]) - 1;

  diaHasta: string | any = parseInt(
    this.funcionesService.ultimoDiaMes().split('-')[2]
  );
  mesHasta: string | any = parseInt(
    this.funcionesService.ultimoDiaMes().split('-')[1]
  );
  anioHasta: string | any = parseInt(
    this.funcionesService.ultimoDiaMes().split('-')[0]
  );

  anioDesdeNew: string | any =
    parseInt(this.funcionesService.primerDiaMes().split('-')[0]) - 1;

  anioHastaNew: string | any = parseInt(
    this.funcionesService.ultimoDiaMes().split('-')[0]
  );

  fechaMesAno: number | any = this.fecha.getFullYear();

  //DASHBOARD LINEAL
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      { data: [], label: 'VENTAS ' + this.anioDesde },
      { data: [], label: 'VENTAS ' + this.anioHasta },
    ],
  };

  public lineChartDataAnio: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      { data: [], label: 'VENTAS ' + this.anioDesde },
      { data: [], label: 'VENTAS ' + this.anioHasta },
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

  constructor(
    public service: DashboardService,
    public funcionesService: FuncionesService
  ) {}

  ngOnInit() {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.cargarDashboardMes();
    this.cargarDashboardAnio();
  }

  cargarDashboardMes() {
    this.funcionesService.showLoading();

    this.reporteVentasTotales.anioDesde = this.anioDesde;
    this.reporteVentasTotales.mesDesde = this.mesDesde;
    this.reporteVentasTotales.diaDesde = this.diaDesde;

    this.reporteVentasTotales.anioHasta = this.anioHasta;
    this.reporteVentasTotales.mesHasta = this.mesHasta;
    this.reporteVentasTotales.diaHasta = this.diaHasta;

    this.reporteVentasTotales.idPuntoVenta = this.puntoVentas.id;
    this.service
      .cargarReporteVentasTotalesNew(this.reporteVentasTotales)
      .subscribe((response) => {
        if (response.status === 200) {
          this.funcionesService.hideLoading();
          this.cargarLinealVentasTotalesMes(response.ventasTotales);
        } else {
          this.funcionesService.showWarning(response.status);
          this.funcionesService.hideLoading();
        }
      });
  }

  cargarDashboardAnio() {
    this.funcionesService.showLoading();
    this.reporteVentasTotales.anioDesde = this.anioDesdeNew;
    this.reporteVentasTotales.anioHasta = this.anioHastaNew;
    this.service
      .cargarReporteVentasTotalesNewAnio(this.reporteVentasTotales)
      .subscribe((response) => {
        if (response.status === 200) {
          this.funcionesService.hideLoading();
          this.cargarLinealVentasTotalesAnio(response.ventasTotales);
        } else {
          this.funcionesService.showWarning(response.status);
          this.funcionesService.hideLoading();
        }
      });
  }

  cargarLinealVentasTotalesMes(ventasTotales: ReporteVentasTotalesNew[]) {
    // Ordenar los datos por día ascendente
    ventasTotales.sort((a, b) => a.dia - b.dia);

    // Inicializar datos y etiquetas
    const labels: string[] = [];
    const dataAnioDesde: number[] = [];
    const dataAnioHasta: number[] = [];

    ventasTotales.forEach((venta) => {
      // Usar el día real para formar la etiqueta DD/MM
      const dia = venta.dia.toString().padStart(2, '0');
      const mes = this.mesDesde.toString().padStart(2, '0');
      labels.push(`${dia}/${mes}`);

      // Añadir datos de cada año a su respectivo arreglo
      dataAnioDesde.push(parseFloat(venta.ventas1));
      dataAnioHasta.push(parseFloat(venta.ventas2));
    });

    // Asignar los datos al gráfico
    this.lineChartData = {
      labels,
      datasets: [
        {
          data: dataAnioDesde,
          label: 'VENTAS ' + this.anioDesde,
          fill: false,
          borderColor: '#F6D261',
          backgroundColor: '#F6D261',
        },
        {
          data: dataAnioHasta,
          label: 'VENTAS ' + this.anioHasta,
          fill: false,
          borderColor: 'blue',
          backgroundColor: 'blue'
        },
      ],
    };
  }

  cargarLinealVentasTotalesAnio(ventasTotales: ReporteVentasTotalesNew[]) {
    const meses = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];

    const dataAnioDesde = new Array(12).fill(0);
    const dataAnioHasta = new Array(12).fill(0);

    this.anioDesdeNew = +this.anioDesdeNew;
    this.anioHastaNew = +this.anioHastaNew;

    ventasTotales.forEach((venta) => {
      const anio = venta.anio;
      const mesIndex = venta.mes - 1;
      const total = parseFloat(venta.total_ventas);

      if (anio === this.anioDesdeNew) {
        dataAnioDesde[mesIndex] = total;
      } else if (anio === this.anioHastaNew) {
        dataAnioHasta[mesIndex] = total;
      }
    });

    this.lineChartDataAnio = {
      labels: meses,
      datasets: [
        {
          data: dataAnioDesde,
          label: 'VENTAS ' + this.anioDesdeNew,
          fill: false,
          borderColor: '#F6D261',
          backgroundColor: '#F6D261',
        },
        {
          data: dataAnioHasta,
          label: 'VENTAS ' + this.anioHastaNew,
          fill: false,
          borderColor: 'blue',
          backgroundColor: 'blue'
        },
      ],
    };
  }
}
