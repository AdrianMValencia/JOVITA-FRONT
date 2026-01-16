import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ClientesService } from '../Service/clientes.service';
import { Clientes } from '../Model/clientes';
import { FuncionesService } from '../../../../shared/services/funciones.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TipoCliente } from '../Model/tipoCliente';
import { Ubigeo } from '../Model/ubigeo';
import { UbigeoService } from 'src/app/shared/services/ubigeo/ubigeo.service';
import { PuntosVenta } from '../../puntosventa/model/puntosVenta';
import { SubirArchivoService } from 'src/app/shared/subirArchivo/subir-archivo.service';

@Component({
  selector: 'app-ModalClientes',
  templateUrl: './ModalClientes.component.html',
  providers: [ClientesService, UbigeoService],
})
export class ModalClientesComponent implements OnInit {

  @Input() fromParent: any;

  clientes: Clientes = new Clientes(0, '', 0, '', 'VARIOS', '', 1249, 'Perú', '', '', '', '', '', '1', true);
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  ubigeos: Ubigeo = new Ubigeo(1249, '150101', 'LIMA-LIMA-LIMA');
  maxlength: number = 20;

  // Progress Bar
  progressBar: boolean | any;

  // FormGroup
  formGroup: FormGroup | any;
  titulo: string = '';

  //Combos
  cboTipoCliente: TipoCliente[] = [];
  cboUbigeo: Ubigeo[] = [];

  textoImagen: string = 'Seleccione una imágen';
  sinFoto:string = 'assets/img/sinFoto.png';
  imagenSubir: File | any = null;
  imagenTemp: any;
  readonly: boolean = true;

  constructor(
    public clientesService: ClientesService,
    public funcionesService: FuncionesService,
    private ubigeoService: UbigeoService,
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
      idTipoDoi: [0, [Validators.required]],
      numeroDoi: ['', [Validators.required, Validators.maxLength(this.maxlength)]],
      nombre: ['VARIOS', [Validators.required]],
      direccion: [''],
      idUbigeo: [1249, [Validators.required]],
      pais: ['Perú'],
      correo: ['', Validators.email],
      celular: ['', [Validators.pattern(/^-?(0|[1-9]\d*)?$/)]],
      telefono: ['', [Validators.pattern(/^-?(0|[1-9]\d*)?$/)]],
      imagen: '',
      observaciones: [''],
      status: [true],
      puntoventa: [''],
      ubigeos: [''],
      tipodoi: ['']
    });
  }

  get getModal() { return this.formGroup.controls; }

  ngOnInit() {
    this.funcionesService.showLoading();
    this.progressBar = true;

    this.cargarTipoCliente();
    this.cargarUbigeoCliente();

    const opc = this.fromParent.opcion;
    const array = this.fromParent.clientes;

    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.formGroup.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.formGroup.get('puntoventa').setValue(this.puntoVentas.nombre);

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        idPuntoVenta: parseInt(array.idPuntoVenta),
        idTipoDoi: parseInt(array.idTipoDoi),
        numeroDoi: array.numeroDoi,
        nombre: array.nombre,
        direccion: array.direccion,
        idUbigeo: parseInt(array.idUbigeo),
        pais: array.pais,
        correo: array.correo,
        celular: array.celular,
        telefono: array.telefono,
        imagen: array.imagen,
        observaciones: array.observaciones,
        status: array.status,
        ubigeos: array.ubigeos
      });

      this.imagenTemp = this.clientesService.urlUpload + array.imagen;
      this.textoImagen = array.imagen;
      this.selectEventUbigeo(array.ubigeos);
      this.titulo = 'Modificar Cliente ' + array.nombre;
    }else{
      this.titulo = 'Agregar Cliente';
      this.formGroup.get('ubigeos').setValue(this.ubigeos);
      this.selectEventUbigeo(this.ubigeos);
    }
    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  selectEventUbigeo(event: Ubigeo){
    this.formGroup.get('idUbigeo').setValue(event.id);
  }

  saveRegistro(form: FormGroup) {

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
          this.clientes.id = vfbModal.id;
          this.clientes.idPuntoVenta = vfbModal.idPuntoVenta == null ? '': vfbModal.idPuntoVenta;
          this.clientes.idTipoDoi = vfbModal.idTipoDoi == null ? '': vfbModal.idTipoDoi;
          this.clientes.numeroDoi = vfbModal.numeroDoi == null ? '': vfbModal.numeroDoi;
          this.clientes.nombre = vfbModal.nombre == null ? '' : vfbModal.nombre;
          this.clientes.direccion = vfbModal.direccion == null ? '' : vfbModal.direccion;
          this.clientes.idUbigeo = vfbModal.idUbigeo == null ? '': vfbModal.idUbigeo;
          this.clientes.pais = vfbModal.pais == null ? '' : vfbModal.pais;
          this.clientes.correo = vfbModal.correo == null ? '' : vfbModal.correo;
          this.clientes.celular = vfbModal.celular == null ? '' : vfbModal.celular;
          this.clientes.telefono = vfbModal.telefono == null ? '' : vfbModal.telefono;
          this.clientes.imagen = vfbModal.imagen == null ? '' : vfbModal.imagen;
          this.clientes.observaciones = vfbModal.observaciones == null ? '' : vfbModal.observaciones;
          this.clientes.status = vfbModal.status == null ? '' : vfbModal.status;
          this.clientes.opcion = this.fromParent.opcion;

          this.clientesService.crudClientes(this.clientes).subscribe((response: any) => {

            if (response.status === 200) {
              this.funcionesService.showSuccess(response.message);

              if(this.imagenSubir !== null){
                this.subirArchivo.subirArchivo(this.imagenSubir, 'clientes', response.clientes.id).then(() => {
                  this.funcionesService.hideLoading();
                });
              }

              const oReturn: any = new Object();

              oReturn['modal'] = 'clientes';
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
        }
      });
    }
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

  cargarTipoCliente(){
    this.clientesService.cargarTipoCliente().subscribe(response => {
      this.cboTipoCliente = response.tipos;
    });
  }

  cargarUbigeoCliente(){
    this.ubigeoService.cargarUbigeo().subscribe(response => {
      this.cboUbigeo = response.ubigeo;
    });
  }

  cambiarMaxLength(){
    let vfbModal = this.formGroup.value;
    this.formGroup.get('numeroDoi').setValue('');

    if(vfbModal.idTipoDoi === 1){
      this.maxlength = 8;
    }

    if(vfbModal.idTipoDoi === 2){
      this.maxlength = 11;
    }

    if(vfbModal.idTipoDoi === 3 || vfbModal.idTipoDoi === 4){
      this.maxlength = 12;
    }

    if(vfbModal.idTipoDoi === 5 || vfbModal.idTipoDoi === 6){
      this.maxlength = 15;
    }
  }

  consultaSUNAT(): any{

    this.funcionesService.showLoading();
    this.progressBar = true;

    if(this.formGroup.get('numeroDoi').value.length === 0){
      this.funcionesService.showError('Ingrese su número de documento');
      this.funcionesService.hideLoading();
      this.progressBar = false;
    }else{

      this.clientesService.consultasSUNAT(this.formGroup.get('numeroDoi').value, this.formGroup.get('idPuntoVenta').value).subscribe((response: any) => {
        if(response.status === 200){
          this.formGroup.get('nombre').setValue(response.clientes.nombre);
          this.formGroup.get('numeroDoi').setValue(response.clientes.numeroDoi);

          let tipos: number = 0;
          if(parseInt(response.clientes.idTipoDoi) === 1){
            tipos = 1;
          }
          if(parseInt(response.clientes.idTipoDoi) === 6){
            tipos = 2;
          }
          this.formGroup.get('direccion').setValue(response.clientes.direccion);
          this.ubigeos.id = response.clientes.idUbigeo;
          this.ubigeos.idUbigeo = response.clientes.codigo;
          this.ubigeos.ubigeo = response.clientes.ubigeo;

          this.formGroup.get('ubigeos').setValue(this.ubigeos);
          this.selectEventUbigeo(this.ubigeos);

          this.formGroup.get('pais').setValue(response.clientes.pais);
          this.formGroup.get('idTipoDoi').setValue(tipos);
          this.readonly = true;

          this.funcionesService.hideLoading();
          this.progressBar = false;

        }else{
          this.readonly = false;

          this.funcionesService.hideLoading();
          this.progressBar = false;
        }
      }, error => {

        this.funcionesService.showError(error.error.message);
        this.funcionesService.hideLoading();
        this.progressBar = false;
      });
    }
  }
}
