import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

import { UnidadMedidas } from '../models/unidadmedidas';
import { UnidadmedidasService } from '../service/unidadmedidas.service';

@Component({
  selector: 'app-modalunidadmedidas',
  templateUrl: './modalunidadmedidas.component.html',
  providers: [UnidadmedidasService]
})
export class ModalunidadmedidasComponent implements OnInit {
  @Input() fromParent: any;

  unidadMedidas: UnidadMedidas = new UnidadMedidas(0, '', '', '', '', true, 1, '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  progressBar: boolean | any;

  // FormGroup
  formGroup: FormGroup | any;
  titulo: string = '';

  constructor(
    public unidadmedidasService: UnidadmedidasService,
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
      nombre: ['', [Validators.required]],
      abreviatura: [''],
      observaciones: [''],
      status: [true, [Validators.required]],
      puntoventa: ['']
    });
  }

  get getModal() { return this.formGroup.controls; }

  ngOnInit() {
    this.funcionesService.showLoading();
    this.progressBar = true;

    const opc = this.fromParent.opcion;
    const array = this.fromParent.unidadMedidas;

    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.formGroup.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.formGroup.get('puntoventa').setValue(this.puntoVentas.nombre);

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        idPuntoVenta: parseInt(array.idPuntoVenta),
        nombre: array.nombre,
        abreviatura: array.abreviatura,
        observaciones: array.observaciones,
        status: array.status
      });
      this.titulo = 'Modificar Unidad de Medida ' + array.nombre;
    }else{
      this.titulo = 'Agregar Unidad de Medida';
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

         let vfbModal = this.formGroup.value;
         this.unidadMedidas.id = vfbModal.id;
         this.unidadMedidas.idPuntoVenta = vfbModal.idPuntoVenta == null ? '': vfbModal.idPuntoVenta;
         this.unidadMedidas.nombre = vfbModal.nombre != null ? vfbModal.nombre: '';
         this.unidadMedidas.abreviatura = vfbModal.abreviatura != null ? vfbModal.abreviatura: '';
         this.unidadMedidas.observaciones = vfbModal.observaciones == null ? '' : vfbModal.observaciones;
         this.unidadMedidas.status = vfbModal.status == null ? '' : vfbModal.status;
         this.unidadMedidas.opcion = this.fromParent.opcion;

         const lista: UnidadMedidas[] = this.fromParent.lista;
         let count: number = 0;

         if(this.fromParent.opcion === '1'){
           lista.forEach(element => {
             if(element.nombre === this.unidadMedidas.nombre){
               count += 1;
             }
           });

         }else{

           lista.forEach(element => {
             if(element.nombre === this.unidadMedidas.nombre){
               if(element.id !== this.unidadMedidas.id){
                 count += 1;
               }
             }
           });
         }

         if (count === 0) {

           this.unidadmedidasService.crudUnidadMedidas(this.unidadMedidas).subscribe((response: any) => {

             if (response.status === 200) {
               this.funcionesService.showSuccess(response.message);

               const oReturn: any = new Object();

               oReturn['modal'] = 'unidadMedidas';
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
           this.funcionesService.showError('Unidad de Medida ya existe');
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
