import { Component, OnInit, Input, Type } from '@angular/core';
import { RecibosService } from '../service/recibos.service';
import { FuncionesService } from '../../../../shared/services/funciones.service';
import { NgbActiveModal, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Recibos } from '../model/recibos';
import { RecibosMedioPago } from '../model/recibosMedioPago';
import { Medio } from '../model/medio';
import { MediopagoService } from 'src/app/shared/services/mediopago/mediopago.service';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { ModalRecibosPDFComponent } from '../modalRecibosPDF/modalRecibosPDF.component';

// Modals
const MODALS: { [name: string]: Type<any> } = {
  downloadPDF: ModalRecibosPDFComponent,
};

@Component({
  selector: 'app-modalRecibosMedioPagos',
  templateUrl: './modalRecibosMedioPagos.component.html',
  providers: [RecibosService, MediopagoService]
})
export class ModalRecibosMedioPagosComponent implements OnInit {

  @Input() fromParent: any;

  recibos: Recibos = new Recibos(0, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', true, '', '');
  medioPago: RecibosMedioPago = new RecibosMedioPago(0, 0,  1, '', '', '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  progressBar: boolean | any = false;

   //Combos
   cboMedio: Medio[] = [];
   cantidad: string | any = 0;
   vuelto?: string | any;
   opcion: string | any = '';

   NgbModalOptions: NgbModalOptions = {
    size: 'xl',
    centered: true,
    scrollable: true,
    keyboard: false,
    backdrop: 'static',
    windowClass: 'modal-holder'
  };

  constructor(
    public service: RecibosService,
    private mediopagoService: MediopagoService,
    public funcionesService: FuncionesService,
    public activeModal: NgbActiveModal,
    private _modalService: NgbModal
  ) {}

  ngOnInit() {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.cargarMedio();

    this.recibos = this.fromParent.recibos;
    this.opcion = this.fromParent.opcion;
    this.medioPago.importe = this.recibos.total;

    this.recibos.detalles.forEach((element: any) => {
       this.cantidad = (parseFloat(this.cantidad) + parseFloat(element.cantidad)).toFixed(2);
    });
  }

  selectEventMedios(event: any){
    this.medioPago.idMedioPago = event.value;
  }

  cargarMedio(){
    this.funcionesService.showLoading();
    this.mediopagoService.cargarMedioPago(this.puntoVentas.id).subscribe(response => {
      this.cboMedio = response.tiposPago;
      this.cboMedio = this.cboMedio.filter(x => parseInt(x.status) === 1);
      this.medioPago.idMedioPago = this.cboMedio.filter(x => x.nombre === 'Efectivo')[0].id;
      this.calcularTotales();
      this.funcionesService.hideLoading();
    });
  }

  cargarMedioPago(){
    this.service.cargarMedioPago(this.recibos.id).subscribe(response => {
      this.medioPago = response.recibosMedioPago;
      this.calcularTotales();
    });
  }

  calcularTotales(){
    this.vuelto = (parseFloat(this.medioPago.importe) - parseFloat(this.recibos.total)).toFixed(2);

    document.addEventListener("keydown", (event: any) =>{
      if (event.code === "Escape")
      {
          event.preventDefault();
          this.activeModal.dismiss();
      }
      // if (event.code === "F2")
      // {
      //     event.preventDefault();
      //     this.crearDocumentoPDF();
      // }
      // if (event.code === "F3")
      // {
      //   event.preventDefault();
      //   this.crearDocumento();
      // }
    });
  }

  crearDocumento(): any{
    this.recibos.pagado = parseFloat(this.medioPago.importe);
    this.recibos.vuelto = parseFloat(this.vuelto);
    this.recibos.medioPagos = this.medioPago;
    this.recibos.tipoCambio = parseFloat(this.recibos.tipoCambio);
    this.recibos.montoDesc = this.recibos.montoDesc == '' ? 0.00: parseFloat(this.recibos.montoDesc).toFixed(2);;
    this.recibos.totalGravada = parseFloat(this.recibos.totalGravada).toFixed(2);
    this.recibos.totalIgv = parseFloat(this.recibos.totalIgv).toFixed(2);
    this.recibos.total = parseFloat(this.recibos.total).toFixed(2);
    this.recibos.otrosCargo = this.recibos.otrosCargo == '' ? 0.00: parseFloat(this.recibos.otrosCargo).toFixed(2);
    this.recibos.idSeries = this.recibos.idSeries;

    let porcentajeDesc: any = 0;
    let totalDesc: any = 0;

    this.recibos.detalles.forEach((element: any) => {
      element.id = 0;
      element.idRecibo = 0;
      element.cantidad = parseFloat(element.cantidad);
      element.igv = parseFloat(element.igv);
      element.subtotal = parseFloat(element.subtotal);
      element.total = parseFloat(element.total);
      element.porcentajeDesc = parseFloat(element.porcentajeDesc);
      element.totalDesc = parseFloat(element.totalDesc);

      porcentajeDesc = porcentajeDesc + parseFloat(element.porcentajeDesc);
      totalDesc = totalDesc + parseFloat(element.totalDesc);
    });

    this.recibos.porcentajeDesc = parseFloat(porcentajeDesc);
    this.recibos.montoDesc = parseFloat(totalDesc);

    this.recibos.medioPagos.importe = parseFloat(this.recibos.total).toFixed(2);

    this.funcionesService.showLoading();
    this.progressBar = true;
    this.service.emitirRecibo(this.recibos).subscribe(response => {
      if (response.status === 200) {
        this.funcionesService.showSuccess(response.message);

        const oReturn: any = new Object();

        oReturn['modal'] = 'medioPago';
        oReturn['value'] = 'loadAgain';

        this.activeModal.close(oReturn);
        this.funcionesService.hideLoading();
        this.progressBar = false;
        return false;
      } else {
        this.funcionesService.showError(response.message);
        this.funcionesService.hideLoading();
        this.progressBar = false;
        return false;
      }
    }, (err: any) => {
      console.log(err);
      this.funcionesService.hideLoading();
      this.progressBar = false;
    });
  }

  crearDocumentoPDF(): any{
    this.recibos.pagado = parseFloat(this.medioPago.importe);
    this.recibos.vuelto = parseFloat(this.vuelto);
    this.recibos.medioPagos = this.medioPago;
    this.recibos.tipoCambio = parseFloat(this.recibos.tipoCambio);
    this.recibos.montoDesc = this.recibos.montoDesc == '' ? 0.00: parseFloat(this.recibos.montoDesc).toFixed(2);
    this.recibos.totalGravada = parseFloat(this.recibos.totalGravada).toFixed(2);
    this.recibos.totalIgv = parseFloat(this.recibos.totalIgv).toFixed(2);
    this.recibos.total = parseFloat(this.recibos.total).toFixed(2);
    this.recibos.otrosCargo = this.recibos.otrosCargo == '' ? 0.00: parseFloat(this.recibos.otrosCargo).toFixed(2);
    this.recibos.idSeries = this.recibos.idSeries;

    let porcentajeDesc: any = 0;
    let totalDesc: any = 0;

    this.recibos.detalles.forEach((element: any) => {
      element.id = 0;
      element.idRecibo = 0;
      element.cantidad = parseFloat(element.cantidad);
      element.igv = parseFloat(element.igv);
      element.subtotal = parseFloat(element.subtotal);
      element.total = parseFloat(element.total);
      element.porcentajeDesc = parseFloat(element.porcentajeDesc);
      element.totalDesc = parseFloat(element.totalDesc);

      porcentajeDesc = porcentajeDesc + parseFloat(element.porcentajeDesc);
      totalDesc = totalDesc + parseFloat(element.totalDesc);
    });

    this.recibos.porcentajeDesc = parseFloat(porcentajeDesc);
    this.recibos.montoDesc = parseFloat(totalDesc);

    this.recibos.medioPagos.importe = parseFloat(this.recibos.total).toFixed(2);

    this.funcionesService.showLoading();
    this.progressBar = true;
    this.service.emitirRecibo(this.recibos).subscribe(response => {
      if (response.status === 200) {
        this.funcionesService.showSuccess(response.message);

        const oReturn: any = new Object();

        oReturn['modal'] = 'medioPago';
        oReturn['value'] = 'loadAgain';

        this.activeModal.close(oReturn);

        const modalRef = this._modalService.open(MODALS['downloadPDF'], this.NgbModalOptions);
        const obj: any = new Object();
        obj['recibos'] = response.recibos;
        modalRef.componentInstance.fromParent = obj;

        this.funcionesService.hideLoading();
        this.progressBar = false;
        return false;
      }
      else {
        this.funcionesService.showError(response.message);
        this.funcionesService.hideLoading();
        this.progressBar = false;
        return false;
      }
    }, (err: any) => {
      console.log(err);
      this.funcionesService.hideLoading();
      this.progressBar = false;
    });
  }

}
