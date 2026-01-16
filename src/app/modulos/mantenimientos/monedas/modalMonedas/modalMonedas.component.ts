import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MonedasService } from '../service/monedas.service';
import { Monedas } from '../model/monedas';
import { FuncionesService } from '../../../../shared/services/funciones.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PuntosVenta } from '../../puntosventa/model/puntosVenta';

@Component({
  selector: 'app-modalMonedas',
  templateUrl: './modalMonedas.component.html',
  providers: [MonedasService]
})
export class ModalMonedasComponent implements OnInit {

  @Input() fromParent: any;

  monedas: Monedas = new Monedas(0, '', '', '', '', true, 1, '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  progressBar: boolean | any;

  // FormGroup
  formGroup: FormGroup | any;
  titulo: string = '';

  constructor(
    public monedasService: MonedasService,
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
      moneda: ['', [Validators.required]],
      abreviatura: ['', [Validators.required]],
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
    const array = this.fromParent.monedas;

    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.formGroup.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.formGroup.get('puntoventa').setValue(this.puntoVentas.nombre);

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        idPuntoVenta: parseInt(array.idPuntoVenta),
        moneda: array.moneda,
        abreviatura: array.abreviatura,
        observaciones: array.observaciones,
        status: array.status
      });
      this.titulo = 'Modificar Moneda ' + array.moneda;
    }else{
      this.titulo = 'Agregar Moneda';
    }

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  saveMonedas(form: FormGroup) {

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

          this.progressBar = false;
          this.funcionesService.showLoading();

         let vfbModal = form.value;
         this.monedas.id = vfbModal.id;
         this.monedas.idPuntoVenta = vfbModal.idPuntoVenta == null ? '': vfbModal.idPuntoVenta;
         this.monedas.moneda = vfbModal.moneda != null ? vfbModal.moneda: '';
         this.monedas.abreviatura = vfbModal.abreviatura != null ? vfbModal.abreviatura: '';
         this.monedas.observaciones = vfbModal.observaciones == null ? '' : vfbModal.observaciones;
         this.monedas.status = vfbModal.status == null ? '' : vfbModal.status;
         this.monedas.opcion = this.fromParent.opcion;

         const lista: Monedas[] = this.fromParent.lista;
         let count: number = 0;

         if(this.fromParent.opcion === '1'){
           lista.forEach(element => {
             if(element.moneda === this.monedas.moneda){
               count += 1;
             }
           });

         }else{

           lista.forEach(element => {
             if(element.moneda === this.monedas.moneda){
               if(element.id !== this.monedas.id){
                 count += 1;
               }
             }
           });
         }

         if (count === 0) {

           this.monedasService.crudMonedas(this.monedas).subscribe((response: any) => {

             if (response.status === 200) {
               this.funcionesService.showSuccess(response.message);

               const oReturn: any = new Object();

               oReturn['modal'] = 'monedas';
               oReturn['value'] = 'loadAgain';

               this.activeModal.close(oReturn);
               this.funcionesService.hideLoading();
               this.progressBar = false;
               return;
             }
             else {
               this.funcionesService.showError(response.message);
               this.funcionesService.hideLoading();
                this.progressBar = false;
               return;
             }
           }, (err: any) => {
             console.log(err);
             this.funcionesService.hideLoading();
              this.progressBar = false;
           });
         }else{
           this.funcionesService.showError('Moneda ya existe');
           this.funcionesService.hideLoading();
            this.progressBar = false;
         }
        }
      });
    }
  }

  async delay(ms: number) {
    await new Promise<void>(resolve => setTimeout(() => resolve(), ms)).then();
  }


}
