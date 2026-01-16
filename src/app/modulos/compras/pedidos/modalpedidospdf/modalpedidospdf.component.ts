import { Component, OnInit, Input } from '@angular/core';
import { PedidosService } from '../service/pedidos.service';
import { Pedidos } from '../model/pedidos';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
declare var $: any;

@Component({
  selector: 'app-modalpedidospdf',
  templateUrl: './modalpedidospdf.component.html',
  providers: [PedidosService]
})
export class ModalpedidospdfComponent implements OnInit {

  @Input() fromParent: any;

  pedidos: Pedidos = new Pedidos(0, '', '', '0', '', '', '', true, '', '', '');

  // Progress Bar
  progressBar: boolean | any;

  constructor(
    public activeModal: NgbActiveModal,
    public funcionesService: FuncionesService,
    public pedidosService: PedidosService
  ) { }

  ngOnInit() {
    this.pedidos = this.fromParent.pedidos;
    this.cargarPDF();
  }

  cargarPDF(){
    this.progressBar = true;
    this.funcionesService.showLoading();

    this.pedidosService.cargarPDF(this.pedidos.id).subscribe(data => {
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

    this.pedidosService.cargarPDF(this.pedidos.id).subscribe(data => {
      const blob = new Blob([data], {type: 'application/pdf;charset=utf-8'});
      const fileURL = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = fileURL;
      link.download = `PEDIDO N° ${this.pedidos.id.toString().padStart(4, '0')}`;
      link.click();
    });

    this.progressBar = false;
    this.funcionesService.hideLoading();
  }

  ImprimirPDF(){
    this.progressBar = true;
    this.funcionesService.showLoading();

    this.pedidosService.cargarPDF(this.pedidos.id).subscribe(data => {
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
