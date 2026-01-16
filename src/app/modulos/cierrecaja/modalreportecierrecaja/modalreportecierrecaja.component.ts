import { Component, OnInit, Input } from '@angular/core';
import { CierrecajaService } from '../service/cierrecaja.service';
import { CierreCaja } from '../models/cierreCaja';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { ReportesService } from '../../reportes/service/reportes.service';
import { ReporteVentasTotales } from '../../reportes/model/reporteVentasTotales';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
declare var $: any;

@Component({
  selector: 'app-modalreportecierrecaja',
  templateUrl: './modalreportecierrecaja.component.html',
  providers: [CierrecajaService, ReportesService]
})
export class ModalreportecierrecajaComponent implements OnInit{
  @Input() fromParent: any;

  cierreCajas: CierreCaja = new CierreCaja(0, '', '', '', '', '', '', '', '', '', '', '', '', '', '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  progressBar: boolean | any;

  ventasTotales: ReporteVentasTotales[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    public funcionesService: FuncionesService,
    public cierrecajaService: CierrecajaService,
    private reportesService: ReportesService
  ) { }

  ngOnInit() {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.cierreCajas = this.fromParent.cierreCajas;
    this.cargarPDF();
    this.cargarReporte();
  }

  cargarReporte(){
    this.funcionesService.showLoading();
    this.reportesService.cargarReporteVentasTotales(this.cierreCajas.fecha, this.cierreCajas.fecha, this.puntoVentas.id).subscribe(response => {
      if(response.status === 200){
        this.funcionesService.hideLoading();
        this.ventasTotales = response.ventasTotales;
      }
    });
  }

  cargarPDF(){
    this.progressBar = true;
    this.funcionesService.showLoading();

    this.cierrecajaService.cargarPDF(this.cierreCajas.idPuntoVenta, this.cierreCajas.fecha, this.cierreCajas.idUsuario).subscribe(data => {
      const blob = new Blob([data], {type: 'application/pdf;charset=utf-8'});
      const fileURL = URL.createObjectURL(blob);
      $('#viewer').html('<iframe src="' + fileURL + '" width="100%" height="700px" frameborder="0"></iframe>');
    });

    this.progressBar = false;
    this.funcionesService.hideLoading();
  }

  verNavegador(){
    this.progressBar = true;
    this.funcionesService.showLoading();

    this.cierrecajaService.cargarPDF(this.cierreCajas.idPuntoVenta, this.cierreCajas.fecha, this.cierreCajas.idUsuario).subscribe(data => {
      const blob = new Blob([data], {type: 'application/pdf;charset=utf-8'});
      const fileURL = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = fileURL;
      link.download = `CIERRE DE CAJA - ${this.cierreCajas.fecha}`;
      link.click();
    });

    this.progressBar = false;
    this.funcionesService.hideLoading();
  }

  ImprimirPDF(){
    this.progressBar = true;
    this.funcionesService.showLoading();

    this.cierrecajaService.cargarPDF(this.cierreCajas.idPuntoVenta, this.cierreCajas.fecha, this.cierreCajas.idUsuario).subscribe(data => {
      const blob = new Blob([data], {type: 'application/pdf;charset=utf-8'});
      const fileURL = URL.createObjectURL(blob);
      const iframe: any = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = fileURL;
      document.body.appendChild(iframe);
      iframe.contentWindow.print();
    });

    this.progressBar = false;
    this.funcionesService.hideLoading();
  }
}
