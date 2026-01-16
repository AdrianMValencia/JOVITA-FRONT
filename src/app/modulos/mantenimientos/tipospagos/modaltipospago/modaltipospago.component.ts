import { Component, OnInit, Input } from '@angular/core';
import { TipospagoService } from '../service/tipospago.service';
import { TiposPago } from '../models/tiposPago';
import { PuntosVenta } from '../../puntosventa/model/puntosVenta';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-modaltipospago',
  templateUrl: './modaltipospago.component.html',
  providers: [TipospagoService]
})
export class ModaltipospagoComponent implements OnInit {
  @Input() fromParent: any;

  tiposPago: TiposPago = new TiposPago(0, '', '', '', true, '', 1);
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  progressBar: boolean | any;

  // FormGroup
  formGroup: FormGroup | any;
  titulo: string = '';

  constructor(
    public tipospagoService: TipospagoService,
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
    const array = this.fromParent.tiposPago;

    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.formGroup.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.formGroup.get('puntoventa').setValue(this.puntoVentas.nombre);

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        idPuntoVenta: parseInt(array.idPuntoVenta),
        nombre: array.nombre,
        observaciones: array.observaciones,
        status: array.status,
        ubigeos: array.ubigeos
      });

      this.titulo = 'Modificar Tipos de Pago ' + array.nombre;
    }else{
      this.titulo = 'Agregar Tipos de Pago';
    }
    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  saveRegistros(form: FormGroup) {

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
          this.tiposPago.id = vfbModal.id;
          this.tiposPago.idPuntoVenta = vfbModal.idPuntoVenta == null ? '': vfbModal.idPuntoVenta;
          this.tiposPago.nombre = vfbModal.nombre == null ? '' : vfbModal.nombre;
          this.tiposPago.observaciones = vfbModal.observaciones == null ? '' : vfbModal.observaciones;
          this.tiposPago.status = vfbModal.status == null ? '' : vfbModal.status;
          this.tiposPago.opcion = this.fromParent.opcion;

          const lista: TiposPago[] = this.fromParent.lista;
          let count: number = 0;

          if(this.fromParent.opcion === '1'){
            lista.forEach(element => {
              if(element.nombre === this.tiposPago.nombre){
                count += 1;
              }
            });

          }else{

            lista.forEach(element => {
              if(element.nombre === this.tiposPago.nombre){
                if(element.id !== this.tiposPago.id){
                  count += 1;
                }
              }
            });
          }

          if (count === 0) {

            this.tipospagoService.crudTiposPago(this.tiposPago).subscribe((response: any) => {

              if (response.status === 200) {
                this.funcionesService.showSuccess(response.message);

                const oReturn: any = new Object();

                oReturn['modal'] = 'tiposPago';
                oReturn['value'] = 'loadAgain';

                this.activeModal.close(oReturn);
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
            this.funcionesService.showError('Tipo de Pago ya existe');
            this.funcionesService.hideLoading();
            this.progressBar = false;
          }
        }
      });
    }
  }
}
