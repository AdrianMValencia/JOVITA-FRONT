import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ErrorStateMatcher, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DepositosService } from '../service/depositos.service';
import { Depositos } from '../model/depositos';
import { Bancos } from '../../bancos/model/bancos';
import { FuncionesService } from '../../../../shared/services/funciones.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { BancosService } from '../../bancos/service/bancos.service';
import { PuntosVenta } from '../../puntosventa/model/puntosVenta';
import { SubirArchivoService } from 'src/app/shared/subirArchivo/subir-archivo.service';
declare var jQuery: any;

@Component({
  selector: 'app-modalDepositos',
  templateUrl: './modalDepositos.component.html',
  providers: [DepositosService, BancosService]
})
export class ModalDepositosComponent implements OnInit {

  @Input() fromParent: any;

  depositos: Depositos = new Depositos(0, '', '', '0', '', '', true, 1);
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  progressBar: boolean | any;

  // FormGroup
  formGroup: FormGroup | any;
  titulo: string = '';

  //Combos
  cboBancos: Bancos[] = [];

  textoImagen: string = 'Seleccione una imágen';
  sinFoto:string = 'assets/img/sinFoto.png';
  imagenSubir: File | any = null;
  imagenTemp: any;

  constructor(
    public depositosService: DepositosService,
    public bancosService: BancosService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private subirArchivo: SubirArchivoService
  ) {
    this.new_Modal();
  }

  new_Modal() {
    this.formGroup = this.fb.group({
      id: 0,
      idPuntoVenta: ['', [Validators.required]],
      fechaDeposito: ['', [Validators.required]],
      idBanco: [0, [Validators.required]],
      imagen: [''],
      observaciones: [''],
      status: [true],
      puntoventa: ['']
    });
  }

  get getModal() { return this.formGroup.controls; }

  ngOnInit() {
    this.funcionesService.showLoading();
    this.progressBar = true;

    this.cargarBancos();

    const opc = this.fromParent.opcion;
    const array = this.fromParent.depositos;

    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.formGroup.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.formGroup.get('puntoventa').setValue(this.puntoVentas.nombre);

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        idPuntoVenta: parseInt(array.idPuntoVenta),
        fechaDeposito: array.fechaDeposito,
        idBanco: array.idBanco,
        imagen: array.imagen,
        observaciones: array.observaciones,
        status: array.status
      });

      this.imagenTemp = this.depositosService.urlUpload + array.imagen;
      this.textoImagen = array.imagen;
      this.titulo = 'Modificar Desposito ' + array.nombre;
    }else{
      this.titulo = 'Agregar Deposito';
    }

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  saveDepositos(form: FormGroup): any {

     if (form.invalid) {
      this.funcionesService.swalError('Información incorrecta o incompleta');
    }else{

      let titulo: string = '';
      if (this.fromParent.opcion === '1' || this.fromParent.opcion === 1) {
        titulo = '¿Estas seguro de guardar el registro?';
      }else{
        titulo = '¿Estas seguro de modificar el registro?';
      }

      if(this.formGroup.get('idBanco').value === 0){
        this.funcionesService.showError('Seleccione un banco');
        return false;
      }

      this.funcionesService.mensajeConfirmar(titulo, '', (resultado: any) => {
        if (resultado.isConfirmed) {

          this.funcionesService.showLoading();
          this.progressBar = true;

          let vfbModal = form.value;
          this.depositos.id = vfbModal.id;
          this.depositos.idPuntoVenta = vfbModal.idPuntoVenta == null ? '': vfbModal.idPuntoVenta;
          this.depositos.fechaDeposito = vfbModal.fechaDeposito != null ? vfbModal.fechaDeposito: '';
          this.depositos.idBanco = vfbModal.idBanco != null ? vfbModal.idBanco: '';
          this.depositos.imagen = vfbModal.imagen != null ? vfbModal.imagen: '';
          this.depositos.observaciones = vfbModal.observaciones != null ? vfbModal.observaciones: '';
          this.depositos.status = vfbModal.status != null ? vfbModal.status: '';
          this.depositos.opcion = this.fromParent.opcion;

          this.depositosService.crudDepositos(this.depositos).subscribe((response: any) => {

            if (response.status === 200) {
              this.funcionesService.showSuccess(response.message);

              if(this.imagenSubir !== null){
                this.subirArchivo.subirArchivo(this.imagenSubir, 'depositos', response.depositos.id).then(() => {
                  this.funcionesService.hideLoading();
                });
              }

              const oReturn: any = new Object();

              oReturn['modal'] = 'depositos';
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

  cargarBancos(){
    this.bancosService.cargarBancos().subscribe(response => {
      this.cboBancos = response.bancos;
    });
  }

  eliminarImagen(){
    this.imagenSubir = null;
    this.imagenTemp = null;
    this.textoImagen = 'Seleccione una imágen';
    this.formGroup.get("imagen").setValue('');
  }

  public seleccionImagen(event: any){
    let archivo = event.target.files[0];

    if (!archivo) {
      this.imagenSubir = null;
      return;
    }

    if (archivo.type.indexOf('image')) {
      this.funcionesService.showError('El archivo seleccionado no es una imágen.');
      this.imagenSubir = null;
      return;
    }

    this.imagenSubir = archivo;
    this.textoImagen = archivo.name;
    this.formGroup.get("imagen").setValue(archivo.name);

    let reader = new FileReader();
    let urlImagenTemp = reader.readAsDataURL(archivo);
    reader.onloadend = ()=> this.imagenTemp = reader.result;
  }

}
