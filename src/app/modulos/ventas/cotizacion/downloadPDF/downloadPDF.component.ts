import { Component, OnInit, Input } from '@angular/core';
import { CotizacionService } from '../service/cotizacion.service';
import { Cotizacion } from '../model/cotizacion';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FuncionesService } from '../../../../shared/services/funciones.service';
declare var $: any;

@Component({
  selector: 'app-downloadPDF',
  templateUrl: './downloadPDF.component.html',
  providers: [CotizacionService]
})
export class DownloadPDFComponent implements OnInit {

  @Input() fromParent: any;

  cotizacion: Cotizacion = new Cotizacion(0, '', '', '', '', '', '', '', '', '', '', '', '', '', '');

  // Progress Bar
  progressBar: boolean | any;

  constructor(
    public activeModal: NgbActiveModal,
    public funcionesService: FuncionesService,
    public service: CotizacionService
  ) { }

  ngOnInit() {
    this.funcionesService.showLoading();
    this.progressBar = true;
    this.cotizacion = this.fromParent.cotizacion;
    this.cargarPDF();

    this.progressBar = false;
    this.funcionesService.hideLoading();
  }

  cargarPDF(){
    this.progressBar = true;
    this.funcionesService.showLoading();

    this.service.cargarPDF(this.cotizacion.id).subscribe(data => {
      const blob = new Blob([data], {type: 'application/pdf;charset=utf-8'});
      const fileURL = URL.createObjectURL(blob);
      $('#viewer').html('<iframe src="' + fileURL + '" width="100%" height="380px" frameborder="0"></iframe>');
    });

    this.progressBar = false;
    this.funcionesService.hideLoading();
  }

  verNavegador(){
    this.progressBar = true;
    this.funcionesService.showLoading();

    this.service.cargarPDF(this.cotizacion.id).subscribe(data => {
      const blob = new Blob([data], {type: 'application/pdf;charset=utf-8'});
      const fileURL = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = fileURL;
      link.download = `PEDIDO N° ${this.cotizacion.numero}`;
      link.click();
    });

    this.progressBar = false;
    this.funcionesService.hideLoading();
  }

  ImprimirPDF(){
    this.progressBar = true;
    this.funcionesService.showLoading();

    this.service.cargarPDF(this.cotizacion.id).subscribe(data => {
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
