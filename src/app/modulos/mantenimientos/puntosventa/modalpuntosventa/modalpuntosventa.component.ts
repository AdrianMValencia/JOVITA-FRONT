import { Component, Input, OnInit } from '@angular/core';
import { PuntosventaService } from '../service/puntosventa.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PuntosVenta } from '../model/puntosVenta';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UbigeoService } from 'src/app/shared/services/ubigeo/ubigeo.service';
import { Ubigeo } from 'src/app/shared/services/ubigeo/ubigeo';

@Component({
  selector: 'app-modalpuntosventa',
  templateUrl: './modalpuntosventa.component.html',
  providers: [PuntosventaService, UbigeoService],
})
export class ModalpuntosventaComponent implements OnInit {

  @Input() fromParent: any;

  puntosVenta: PuntosVenta = new PuntosVenta(0, '', '', '0', '', '', '', '', true);

  // Progress Bar
  progressBar: boolean | any = false;

  // FormGroup
  formGroup: FormGroup | any;
  titulo: string = '';
  cboUbigeo: Ubigeo[] = [];

  constructor(
    public puntosVentaService: PuntosventaService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private ubigeoSerive: UbigeoService
  ) {
    this.new_puntosVenta();
  }

  new_puntosVenta() {
    this.formGroup = this.fb.group({
      id: 0,
      nombre: ['', Validators.required],
      direccion: [''],
      idUbigeo: ['0'],
      telefono: [''],
      celular: [''],
      correo: ['', Validators.email],
      observaciones: [''],
      status: [true, Validators.required],
      ubigeos: ['']
    });
  }

  get getPuntosVenta() { return this.formGroup.controls; }

  ngOnInit() {
    this.funcionesService.showLoading();
    this.progressBar = true;

    const opc = this.fromParent.opcion;
    const array = this.fromParent.puntosVenta;

    this.cargarUbigeo();

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        nombre: array.nombre,
        direccion: array.direccion,
        idUbigeo: array.idUbigeo,
        telefono: array.telefono,
        celular: array.celular,
        correo: array.correo,
        observaciones: array.observaciones,
        status: array.status,
        ubigeos: array.ubigeos
      });

      this.selectEvent(array.ubigeos);
      this.titulo = 'Modificar Punto de Vista ' + array.nombre;
    }else{
      this.titulo = 'Agregar Punto de Vista';
    }

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  selectEvent(event: Ubigeo){
    this.formGroup.get('idUbigeo').setValue(event.id);
  }

  cargarUbigeo(){
    this.ubigeoSerive.cargarUbigeo().subscribe(response => {
      this.cboUbigeo = response.ubigeo;
    });
  }

  crudPuntosVenta(form: FormGroup){

    if (form.invalid) {
      this.funcionesService.swalError('Información incorrecta o incompleta');
    }else{

      let titulo: string = '';
      if (this.fromParent.opcion === '1') {
        titulo = '¿Estas seguro de guardar el registro?';
      }else{
        titulo = '¿Estas seguro de modificar el registro?';
      }
      this.funcionesService.mensajeConfirmar(titulo, '', (resultado: any) => {
        if (resultado.isConfirmed) {

          this.progressBar = true;
          this.funcionesService.showLoading();

          let vFormGroup = form.value;
          this.puntosVenta.id = vFormGroup.id;
          this.puntosVenta.nombre = vFormGroup.nombre != null ? vFormGroup.nombre: '';
          this.puntosVenta.direccion = vFormGroup.direccion != null ? vFormGroup.direccion: '';
          this.puntosVenta.idUbigeo = vFormGroup.idUbigeo != null ? vFormGroup.idUbigeo: '';
          this.puntosVenta.telefono = vFormGroup.telefono != null ? vFormGroup.telefono: '';
          this.puntosVenta.celular = vFormGroup.celular != null ? vFormGroup.celular: '';
          this.puntosVenta.correo = vFormGroup.correo != null ? vFormGroup.correo: '';
          this.puntosVenta.observaciones = vFormGroup.observaciones != null ? vFormGroup.observaciones: '';
          this.puntosVenta.status = vFormGroup.status != null ? vFormGroup.status : '';
          this.puntosVenta.opcion = this.fromParent.opcion;

          const lista: PuntosVenta[] = this.fromParent.lista;
          let count: number = 0;

          if(this.fromParent.opcion === '1'){

            lista.forEach(element => {
              if(element.nombre === this.puntosVenta.nombre){
                count += 1;
              }
            });

          }else{

            lista.forEach(element => {
              if(element.nombre === this.puntosVenta.nombre){
                if(element.id !== this.puntosVenta.id){
                  count += 1;
                }
              }
            });
          }

          if (count === 0) {
            this.puntosVentaService.crudPuntosVenta(this.puntosVenta).subscribe((response: any) => {

              if (response.status === 200) {
                this.funcionesService.showSuccess(response.message);

                const oReturn: any = new Object();

                oReturn['modal'] = 'puntosVenta';
                oReturn['value'] = 'loadAgain';

                this.activeModal.close(oReturn);
                this.progressBar = false;
                return;
              }
              else {
                this.funcionesService.showError(response.message);
                this.progressBar = false;
                return;
              }
            }, (err: any) => {
              console.log(err);
              this.funcionesService.hideLoading();
              this.progressBar = false;
            });
          }else{
            this.funcionesService.showError('Nombre de Punto de Vista ya existe');
            this.funcionesService.hideLoading();
            this.progressBar = false;
          }
        }
      });
    }
  }
}
