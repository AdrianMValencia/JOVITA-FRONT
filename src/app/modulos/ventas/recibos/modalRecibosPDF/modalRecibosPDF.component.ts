import { Component, OnInit, Input } from '@angular/core';
import { RecibosService } from '../service/recibos.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FuncionesService } from '../../../../shared/services/funciones.service';
import { Recibos } from '../model/recibos';
declare var $: any;

@Component({
  selector: 'app-modalRecibosPDF',
  templateUrl: './modalRecibosPDF.component.html',
  providers: [RecibosService],
})
export class ModalRecibosPDFComponent implements OnInit {

  @Input() fromParent: any;

  recibos: Recibos = new Recibos(0, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', true, '', '');

  // Progress Bar
  progressBar: boolean | any;

  constructor(
    public activeModal: NgbActiveModal,
    public funcionesService: FuncionesService,
    public service: RecibosService
  ) { }

  ngOnInit() {
    this.recibos = this.fromParent.recibos;
    this.cargarPDF();
  }

  cargarPDF(){
    this.progressBar = true;
    this.funcionesService.showLoading();

    this.service.cargarPDF(this.recibos.id).subscribe(data => {
      const blob = new Blob([data], {type: 'application/pdf;charset=utf-8'});
      const fileURL = URL.createObjectURL(blob);
      $('#viewer').html('<iframe src="' + fileURL + '" width="100%" height="380px" frameborder="0"></iframe>');
      this.progressBar = false;
      this.funcionesService.hideLoading();
    });
  }

  verNavegador(){
    this.progressBar = true;
    this.funcionesService.showLoading();

    this.service.cargarPDF(this.recibos.id).subscribe(data => {
      const blob = new Blob([data], {type: 'application/pdf;charset=utf-8'});
      const fileURL = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = fileURL;
      link.download = `RECIBO N° ${this.recibos.series + '-' + this.recibos.numeracion}`;
      link.click();
      this.progressBar = false;
      this.funcionesService.hideLoading();
    });
  }

  ImprimirPDF(){
    this.progressBar = true;
    this.funcionesService.showLoading();

    this.service.cargarPDF(this.recibos.id).subscribe(data => {
      const blob = new Blob([data], {type: 'application/pdf;charset=utf-8'});
      const fileURL = URL.createObjectURL(blob);
      const iframe: any = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = fileURL;
      document.body.appendChild(iframe);
      iframe.contentWindow.print();
      this.progressBar = false;
      this.funcionesService.hideLoading();
    });
  }
}
