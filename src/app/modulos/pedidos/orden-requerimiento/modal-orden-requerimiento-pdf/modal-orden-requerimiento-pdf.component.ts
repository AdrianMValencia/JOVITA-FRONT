import { Component, OnInit, Input } from '@angular/core';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { OrdenRequerimiento } from '../model/ordenRequerimiento';
import { OrdenRequerimientoService } from '../service/orden-requerimiento.service';
declare var $: any;

@Component({
  selector: 'app-modal-orden-requerimiento-pdf',
  templateUrl: './modal-orden-requerimiento-pdf.component.html',
    providers: [OrdenRequerimientoService]
})
export class ModalOrdenRequerimientoPdfComponent implements OnInit {

 @Input() fromParent: any;

  ordenRequerimiento: OrdenRequerimiento = new OrdenRequerimiento(0, '', '', '0', '', '', '', true, '', '', '', '', '', '');

  // Progress Bar
  progressBar: boolean | any;

  constructor(
    public activeModal: NgbActiveModal,
    public funcionesService: FuncionesService,
    public ordenRequerimientoService: OrdenRequerimientoService
  ) { }

  ngOnInit() {
    this.ordenRequerimiento = this.fromParent.ordenRequerimiento;
    this.cargarPDF();
  }

  cargarPDF(){
    this.progressBar = true;
    this.funcionesService.showLoading();

    this.ordenRequerimientoService.cargarPDF(this.ordenRequerimiento.id).subscribe(data => {
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

    this.ordenRequerimientoService.cargarPDF(this.ordenRequerimiento.id).subscribe(data => {
      const blob = new Blob([data], {type: 'application/pdf;charset=utf-8'});
      const fileURL = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = fileURL;
      link.download = `PEDIDO N° ${this.ordenRequerimiento.id.toString().padStart(4, '0')}`;
      link.click();
    });

    this.progressBar = false;
    this.funcionesService.hideLoading();
  }

  ImprimirPDF(){
    this.progressBar = true;
    this.funcionesService.showLoading();

    this.ordenRequerimientoService.cargarPDF(this.ordenRequerimiento.id).subscribe(data => {
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
