import { Component, Input, OnInit } from '@angular/core';
import { AbastacimientoService } from '../../abastecimiento/service/abastacimiento.service';
import { Abastecimiento } from '../../abastecimiento/models/abastecimiento';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
declare var $: any;

@Component({
  selector: 'app-modalabastecimientopdf',
  templateUrl: './modalabastecimientopdf.component.html',
  providers: [AbastacimientoService]
})
export class ModalabastecimientopdfComponent implements OnInit {
  @Input() fromParent: any;

  abastecimiento: Abastecimiento = new Abastecimiento();
  // Progress Bar
  progressBar: boolean | any;

  constructor(
    public activeModal: NgbActiveModal,
    public funcionesService: FuncionesService,
    public abastecimientoService: AbastacimientoService
  ) { }

  ngOnInit() {
    this.abastecimiento = this.fromParent.abastecimiento;
    this.cargarPDF();
  }

  cargarPDF(){
    this.progressBar = true;
    this.funcionesService.showLoading();

    this.abastecimientoService.cargarPDF(this.abastecimiento.id).subscribe(data => {
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

    this.abastecimientoService.cargarPDF(this.abastecimiento.id).subscribe(data => {
      const blob = new Blob([data], {type: 'application/pdf;charset=utf-8'});
      const fileURL = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = fileURL;
      link.download = `ABASTECIMIENTO N° ${this.abastecimiento.id.toString().padStart(4, '0')}`;
      link.click();
    });

    this.progressBar = false;
    this.funcionesService.hideLoading();
  }

  ImprimirPDF(){
    this.progressBar = true;
    this.funcionesService.showLoading();

    this.abastecimientoService.cargarPDF(this.abastecimiento.id).subscribe(data => {
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
