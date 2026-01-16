import { Component, Input, OnInit } from '@angular/core';
import { AlmacenesService } from '../service/almacenes.service';
import { UbigeoService } from 'src/app/shared/services/ubigeo/ubigeo.service';
import { Almacenes } from '../models/almacenes';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Ubigeo } from 'src/app/shared/services/ubigeo/ubigeo';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-modalalmacenes',
  templateUrl: './modalalmacenes.component.html',
  providers: [AlmacenesService, UbigeoService]
})
export class ModalalmacenesComponent implements OnInit {
  @Input() fromParent: any;

  almacenes: Almacenes = new Almacenes(0, '', '', '', '', '', true, '', 1, '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  progressBar: boolean | any;

  // FormGroup
  formGroup: FormGroup | any;

  //Combos
  cboUbigeos: Ubigeo[] = [];
  titulo: string = '';

  constructor(
    public almacenesService: AlmacenesService,
    private ubigeoService: UbigeoService,
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
      direccion: [''],
      idUbigeo: [''],
      observaciones: [''],
      status: [true],
      puntoventa: [''],
      ubigeos: ['']
    });
  }

  get getModal() { return this.formGroup.controls; }

  ngOnInit() {
    this.funcionesService.showLoading();
    this.progressBar = true;

    const opc = this.fromParent.opcion;
    const array = this.fromParent.almacenes;
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.formGroup.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.formGroup.get('puntoventa').setValue(this.puntoVentas.nombre);

    this.cargarUbigeos();

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        nombre: array.nombre,
        direccion: array.direccion,
        idUbigeo: array.idUbigeo,
        observaciones: array.observaciones,
        status: array.status,
        ubigeos: array.ubigeos,
      });

      this.selectEvent(array.ubigeos);
      this.titulo = 'Modificar Almacén ' + array.nombre;
    }else{
      this.titulo = 'Agregar Almacén';
    }

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  selectEvent(event: Ubigeo){
    this.formGroup.get('idUbigeo').setValue(event.id);
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
          this.almacenes.id = vfbModal.id;
          this.almacenes.idPuntoVenta = vfbModal.idPuntoVenta !== null ? vfbModal.idPuntoVenta : null,
          this.almacenes.nombre = vfbModal.nombre !== null ? vfbModal.nombre : null,
          this.almacenes.direccion = vfbModal.direccion !== null ? vfbModal.direccion : null,
          this.almacenes.idUbigeo = vfbModal.idUbigeo !== null ? vfbModal.idUbigeo : null,
          this.almacenes.observaciones = vfbModal.observaciones !== null ? vfbModal.observaciones : '',
          this.almacenes.status = vfbModal.status,
          this.almacenes.opcion = this.fromParent.opcion;

          this.funcionesService.showLoading()
          this.progressBar = false;
          this.almacenesService.crudAlmacenes(this.almacenes).subscribe((response: any) => {

            if (response.status === 200) {
              this.funcionesService.showSuccess(response.message);

              const oReturn: any = new Object();

              oReturn['modal'] = 'almacenes';
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
        }
      });
    }
  }

  cargarUbigeos(){
    this.ubigeoService.cargarUbigeo().subscribe(response => {
      this.cboUbigeos = response.ubigeo;
    });
  }
}
