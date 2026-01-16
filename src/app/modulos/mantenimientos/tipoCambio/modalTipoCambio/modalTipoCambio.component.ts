import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { TipoCambioService } from '../service/tipoCambio.service';
import { TipoCambio } from '../model/tipoCambio';
import { FuncionesService } from '../../../../shared/services/funciones.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Monedas } from '../../monedas/model/monedas';
import { MonedasService } from '../../monedas/service/monedas.service';
import { PuntosVenta } from '../../puntosventa/model/puntosVenta';

@Component({
  selector: 'app-modalTipoCambio',
  templateUrl: './modalTipoCambio.component.html',
  providers: [TipoCambioService, MonedasService]
})
export class ModalTipoCambioComponent implements OnInit {

  @Input() fromParent: any;

  tipoCambio: TipoCambio = new TipoCambio(0, '', 0, '', '', '', '', 1, '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  progressBar: boolean | any;

  // FormGroup
  formGroup: FormGroup | any;
  titulo: string = '';
  ocultar: boolean = true;
  max = new Date().toISOString().split("T")[0];

  cboMonedas: Monedas[] = [];

  constructor(
    public tipoCambioService: TipoCambioService,
    private monedasService: MonedasService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal
  ) {
    this.new_Modal();
  }

  new_Modal() {
    this.formGroup = this.fb.group({
      id: 0,
      idPuntoVenta: ['', [Validators.required]],
      idMoneda: [0, [Validators.required]],
      fecha: [this.funcionesService.generarFechaLocal(new Date()), [Validators.required]],
      valorCompra: [''],
      valorVenta: [''],
      observaciones: [''],
      status: [true],
      puntoventa: ['']
    });
  }

  get getModal() { return this.formGroup.controls; }

  ngOnInit() {
    this.funcionesService.showLoading();
    this.progressBar = true;

    const opc = this.fromParent.opcion;
    const array = this.fromParent.tipoCambio;

    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.formGroup.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.formGroup.get('puntoventa').setValue(this.puntoVentas.nombre);

    this.cargarMonedas();

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        idPuntoVenta: parseInt(array.idPuntoVenta),
        idMoneda: parseInt(array.idMoneda),
        fecha: array.fecha,
        valorCompra: parseFloat(array.valorCompra).toFixed(3),
        valorVenta: parseFloat(array.valorVenta).toFixed(3),
        observaciones : array.observaciones,
        status: array.status
      });

      this.titulo = 'Modificar Tipo de Cambio ';
      this.ocultar = false;
    }else{
      this.titulo = 'Agregar Tipo de Cambio';
      this.ocultar = true;
    }

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  cargarMonedas(){
    this.monedasService.obtenerMonedas(this.puntoVentas.id).subscribe(response => {
      this.cboMonedas = response.monedas;
      this.cboMonedas = this.cboMonedas.filter(x => parseInt(x.status) === 1).sort(this.funcionesService.orderBy('id'));

      this.cboMonedas.forEach((element, index) => {
        if(index === 0){
          this.formGroup.get('idMoneda').setValue(element.id);
        }
      });
    });
  }

  saveRegistro(form: FormGroup): any {

    if (form.invalid) {
      this.funcionesService.swalError('Información incorrecta o incompleta');
    }else{

      let titulo: string = '';
      if (this.fromParent.opcion === '1' || this.fromParent.opcion === 1) {
        titulo = '¿Estas seguro de guardar el registro?';
      }else{
        titulo = '¿Estas seguro de modificar el registro?';
      }

      this.funcionesService.mensajeConfirmar(titulo, '', (resultado: any) => {
        if (resultado.isConfirmed) {

          let vfbModal = form.value;
          this.tipoCambio.id = vfbModal.id;
          this.tipoCambio.idPuntoVenta = vfbModal.idPuntoVenta == null ? '': vfbModal.idPuntoVenta;
          this.tipoCambio.idMoneda = vfbModal.idMoneda == null ? '': vfbModal.idMoneda;
          this.tipoCambio.fecha = this.formGroup.get('fecha').value == null ? '': this.formGroup.get('fecha').value;
          this.tipoCambio.valorCompra = vfbModal.valorCompra == null ? '': parseFloat(vfbModal.valorCompra).toFixed(3);
          this.tipoCambio.valorVenta = vfbModal.valorVenta == null ? '': parseFloat(vfbModal.valorVenta).toFixed(3);
          this.tipoCambio.observaciones = vfbModal.observaciones == null ? '' : vfbModal.observaciones;
          this.tipoCambio.status = vfbModal.status == null ? '' : vfbModal.status;
          this.tipoCambio.opcion = this.fromParent.opcion;

          if(this.tipoCambio.idMoneda === 0){
            this.funcionesService.showError('Seleccione la moneda');
          }else{

            this.progressBar = false;
            this.funcionesService.showLoading();
            this.tipoCambioService.crudTipoCambio(this.tipoCambio).subscribe((response: any) => {

              if (response.status === 200) {
                this.funcionesService.showSuccess(response.message);

                const oReturn: any = new Object();

                oReturn['modal'] = 'tipoCambio';
                oReturn['value'] = 'loadAgain';

                this.activeModal.close(oReturn);
                this.progressBar = false;
                return;
              }
              else {
                this.funcionesService.showError(response.message);
                return;
              }
            }, (err: any) => {
              console.log(err);
            });
          }
        }
      });
    }
  }
}
