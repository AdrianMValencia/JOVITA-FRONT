import { Component, Input, OnInit } from '@angular/core';
import { Bancos } from '../model/bancos';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { BancosService } from '../service/bancos.service';
import { FuncionesService } from '../../../../shared/services/funciones.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PuntosVenta } from '../../puntosventa/model/puntosVenta';

@Component({
  selector: 'app-modalBancos',
  templateUrl: './modalBancos.component.html',
  providers: [BancosService]
})
export class ModalBancosComponent implements OnInit {

  @Input() fromParent: any;

  bancos: Bancos = new Bancos(0, '', '', '', '', '', '', '', '', '', true, 1);
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  progressBar: boolean | any;

  // FormGroup
  formGroup: FormGroup | any;
  titulo: string = '';

  constructor(
    public bancosService: BancosService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal
  ) {
    this.new_Bancos();
  }

  new_Bancos() {
    this.formGroup = this.fb.group({
      id: 0,
      idPuntoVenta: ['', [Validators.required]],
      ruc: ['', [Validators.required, Validators.required, Validators.maxLength(11), Validators.minLength(11), Validators.pattern(/^-?(0|[1-9]\d*)?$/)]],
      nombre: ['', Validators.required],
      siglas: ['', Validators.required],
      funcionario: [''],
      telefono: [''],
      celular: [''],
      correo: ['', Validators.email],
      observaciones: [''],
      status: [true],
      puntoventa: ['']
    });
  }

  get getBancos() { return this.formGroup.controls; }

  ngOnInit() {
    this.funcionesService.showLoading();
    this.progressBar = true;

    const opc = this.fromParent.opcion;
    const array = this.fromParent.bancos;

    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.formGroup.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.formGroup.get('puntoventa').setValue(this.puntoVentas.nombre);

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        idPuntoVenta: parseInt(array.idPuntoVenta),
        ruc: array.ruc,
        nombre: array.nombre,
        siglas: array.siglas,
        funcionario: array.funcionario,
        telefono: array.telefono,
        celular: array.celular,
        correo: array.correo,
        observaciones: array.observaciones,
        status: array.status
      });
      this.titulo = 'Modificar Banco ' + array.nombre;
    }else{
      this.titulo = 'Agregar Banco';
    }

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  deleteBancos(bancos: Bancos) {
    this.funcionesService.mensajeConfirmar('¿Desea eliminar este registro?', '', (result: any) => {
      this.bancosService.crudBancos(bancos).subscribe((response: any) => {
        if(response.status === 200){
          this.funcionesService.showSuccess(response.message);
          const oReturn: any = new Object();
          oReturn['modal'] = 'bancos';
          oReturn['value'] = 'loadAgain';
          this.activeModal.close(oReturn);
        }else{
          this.funcionesService.showError(response.message);
          this.funcionesService.hideLoading();
        }
      }, (error: any) => {
        this.funcionesService.mensajeConfirmar('', error.error.errors[0].message);
        this.funcionesService.hideLoading();
      });
    });
  }

  saveBancos(form: FormGroup): any {

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

          this.funcionesService.showLoading();
          this.progressBar = true;

          let vformGroup = form.value;
          this.bancos.id = vformGroup.id;
          this.bancos.idPuntoVenta = vformGroup.idPuntoVenta == null ? '': vformGroup.idPuntoVenta;
          this.bancos.ruc = vformGroup.ruc != null ? vformGroup.ruc: '';
          this.bancos.nombre = vformGroup.nombre != null ? vformGroup.nombre: '';
          this.bancos.siglas = vformGroup.siglas != null ? vformGroup.siglas: '';
          this.bancos.funcionario = vformGroup.funcionario != null ? vformGroup.funcionario: '';
          this.bancos.telefono = vformGroup.telefono != null ? vformGroup.telefono: '';
          this.bancos.celular = vformGroup.celular != null ? vformGroup.celular: '';
          this.bancos.correo = vformGroup.correo == null ? '' : vformGroup.correo;
          this.bancos.observaciones = vformGroup.observaciones == null ? '' : vformGroup.observaciones;
          this.bancos.status = vformGroup.status != null ? vformGroup.status : '';
          this.bancos.opcion = this.fromParent.opcion;

          const lista: Bancos[] = this.fromParent.lista;
          let count: number = 0;

          if(this.fromParent.opcion === '1'){

            lista.forEach(element => {
              if(element.nombre === this.bancos.nombre){
                count += 1;
              }
            });

          }else{

            lista.forEach(element => {
              if(element.nombre === this.bancos.nombre){
                if(element.id !== this.bancos.id){
                  count += 1;
                }
              }
            });
          }

          if (count === 0) {
            this.bancosService.crudBancos(this.bancos).subscribe((response: any) => {

              if (response.status === 200) {
                this.funcionesService.showSuccess(response.message);

                const oReturn: any = new Object();

                oReturn['modal'] = 'bancos';
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
            this.funcionesService.showError('Nombre de Banco ya existe');
            this.funcionesService.hideLoading();
            this.progressBar = false;
          }
        }
      });
    }
  }

  consultaSUNAT(): any{

    this.funcionesService.showLoading();
    this.progressBar = true;

    if(this.formGroup.get('ruc').value.length === 0){
      this.funcionesService.showError('Ingrese su número de documento');
      this.funcionesService.hideLoading();
      this.progressBar = false;
    }else{

      this.bancosService.consultasSUNAT(this.formGroup.get('ruc').value).subscribe((response: any) => {
        this.formGroup.get('nombre').setValue(response.bancos.nombre);

        this.funcionesService.hideLoading();
        this.progressBar = false;
      }, error => {

        this.funcionesService.showError(error.error.message);
        this.funcionesService.hideLoading();
        this.progressBar = false;
      });
    }
  }
}
