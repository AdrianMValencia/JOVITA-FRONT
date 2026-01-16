import { Component, OnInit, Input } from '@angular/core';
import { Ubigeo } from '../../clientes/Model/ubigeo';
import { ProveedorService } from '../service/proveedor.service';
import { Proveedor } from '../model/proveedor';
import { FuncionesService } from '../../../../shared/services/funciones.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UbigeoService } from 'src/app/shared/services/ubigeo/ubigeo.service';
import { PuntosventaService } from '../../puntosventa/service/puntosventa.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PuntosVenta } from '../../puntosventa/model/puntosVenta';
import { TipoDoiService } from 'src/app/shared/services/tipoDoi/tipoDoi.service';
import { TipoDoi } from 'src/app/shared/services/tipoDoi/tipoDoi';
import { SubirArchivoService } from 'src/app/shared/subirArchivo/subir-archivo.service';

@Component({
  selector: 'app-modalProveedor',
  templateUrl: './modalProveedor.component.html',
  providers: [ ProveedorService, PuntosventaService, UbigeoService, TipoDoiService, SubirArchivoService ]
})
export class ModalProveedorComponent implements OnInit {

  @Input() fromParent: any;
  proveedor: Proveedor = new Proveedor(0, '', 1, '', '', '', 'Perú', 1249, '', '', '', '', '', '', true);
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  tipoDoi: TipoDoi = new TipoDoi(2, '6', 'RUC - REGISTRO ÚNICO DE CONTRIBUYENTE');
  ubigeos: Ubigeo = new Ubigeo(1249, '150101', 'LIMA-LIMA-LIMA');

  // Progress Bar
  progressBar: boolean | any = false;

  // FormGroup
  formGroup: FormGroup | any;
  titulo: string = '';

  //Combos
  cboPuntoVentas: PuntosVenta[] = [];
  cboUbigeo: Ubigeo[] = [];
  cboTipoDoi: TipoDoi[] = [];

  textoImagen: string = 'Seleccione una imágen';
  sinFoto:string = 'assets/img/sinFoto.png';
  imagenSubir: File | any = null;
  imagenTemp: any;

  constructor(
    public proveedorService: ProveedorService,
    public ubigeoService: UbigeoService,
    public puntosventaService: PuntosventaService,
    public tipoDoiService: TipoDoiService,
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
      idPuntoVenta: [''],
      idTipoDoi: [1],
      numeroDoi: ['', [Validators.required, Validators.pattern(/^-?(0|[1-9]\d*)?$/), Validators.maxLength(15)]],
      nombre: ['', [Validators.required]],
      razonsocial: ['', [Validators.required]],
      pais: ['Perú'],
      idUbigeo: [1249],
      direccion: [''],
      correo: ['', [Validators.email, Validators.maxLength(50)]],
      celular: ['', [Validators.maxLength(15)]],
      telefono: ['', [Validators.maxLength(10)]],
      imagen: [''],
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

    const opc = this.fromParent.opcion;
    const array = this.fromParent.proveedor;

    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.formGroup.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.formGroup.get('puntoventa').setValue(this.puntoVentas.nombre);
    this.cargarUbigeo();
    this.cargarPuntosVenta();
    this.cargarTipoDoi();

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        idPuntoVenta: array.idPuntoVenta,
        idTipoDoi: array.idTipoDoi,
        numeroDoi: array.numeroDoi,
        nombre: array.nombre,
        razonsocial: array.razonsocial,
        pais: array.pais,
        idUbigeo: array.idUbigeo,
        direccion: array.direccion,
        correo: array.correo,
        celular: array.celular,
        telefono: array.telefono,
        imagen: array.imagen,
        observaciones: array.observaciones,
        status: array.status,
        puntoventa: array.puntoventa.nombre,
        ubigeos: array.ubigeos,
        tipodoi: array.tipodoi
      });

      // this.selectEvent(array.puntoventa);
      this.selectEventTipoDoi(array.tipodoi);
      this.selectEventUbigeo(array.ubigeos);

      this.titulo = 'Modificar Proveedor ' + array.serie;
    }else{
      this.titulo = 'Agregar Proveedor';
      this.formGroup.get('tipodoi').setValue(this.tipoDoi);
      this.selectEventTipoDoi(this.tipoDoi);
      this.formGroup.get('ubigeos').setValue(this.ubigeos);
      this.selectEventUbigeo(this.ubigeos);
    }

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  cargarPuntosVenta(){
    this.puntosventaService.cargarPuntosVenta().subscribe(response => {
      this.cboPuntoVentas = response.puntosVenta;
    });
  }
  cargarTipoDoi(){
    this.tipoDoiService.cargarTipoDoi().subscribe(response => {
      this.cboTipoDoi = response.tipos;
    });
  }
  cargarUbigeo(){
    this.ubigeoService.cargarUbigeo().subscribe(response => {
      this.cboUbigeo = response.ubigeo;
    });
  }

  selectEvent(event: PuntosVenta){
    this.formGroup.get('idPuntoVenta').setValue(event.id);
  }
  selectEventTipoDoi(event: TipoDoi){
    this.formGroup.get('idTipoDoi').setValue(event.id);
  }
  selectEventUbigeo(event: Ubigeo){
    this.formGroup.get('idUbigeo').setValue(event.id);
  }

  saveProveedor(form: FormGroup): any {

    if (form.invalid) {
      this.funcionesService.swalError('Información incorrecta o incompleta');
    }else{
      if(form.value.idPuntoVenta === ''){
        this.funcionesService.showError('Seleccione el Punto de Venta');
        return false;
      }
      if(form.value.idTipoDoi === ''){
        this.funcionesService.showError('Seleccione el Tipo de Documento');
        return false;
      }

      let titulo: string = '';
      if (this.fromParent.opcion === '1' || this.fromParent.opcion === 1) {
        titulo = '¿Estas seguro de guardar el registro?';
      }else{
        titulo = '¿Estas seguro de modificar el registro?';
      }

      this.funcionesService.mensajeConfirmar(titulo, '', (resultado: any) => {
        if (resultado.isConfirmed) {

          let vfbModal = this.formGroup.value;
          this.proveedor.id = vfbModal.id;
          this.proveedor.idPuntoVenta = vfbModal.idPuntoVenta == null ? '': vfbModal.idPuntoVenta;
          this.proveedor.idTipoDoi = vfbModal.idTipoDoi == null ? '': vfbModal.idTipoDoi;
          this.proveedor.numeroDoi = vfbModal.numeroDoi == null ? '': vfbModal.numeroDoi;
          this.proveedor.nombre = vfbModal.nombre == null ? '': vfbModal.nombre;
          this.proveedor.razonsocial = vfbModal.razonsocial == null ? '' : vfbModal.razonsocial;
          this.proveedor.pais = vfbModal.pais == null ? '' : vfbModal.pais;
          this.proveedor.idUbigeo = vfbModal.idUbigeo == null ? '' : vfbModal.idUbigeo;
          this.proveedor.direccion = vfbModal.direccion == null ? '' : vfbModal.direccion;
          this.proveedor.correo = vfbModal.correo == null ? '' : vfbModal.correo;
          this.proveedor.celular = vfbModal.celular == null ? '' : vfbModal.celular;
          this.proveedor.telefono = vfbModal.telefono == null ? '' : vfbModal.telefono;
          this.proveedor.imagen = vfbModal.imagen == null ? '' : vfbModal.imagen;
          this.proveedor.observaciones = vfbModal.observaciones == null ? '' : vfbModal.observaciones;
          this.proveedor.status = vfbModal.status == null ? '' : vfbModal.status;
          this.proveedor.opcion = this.fromParent.opcion;

          this.progressBar = true;
          this.funcionesService.showLoading();
          this.proveedorService.crudProveedor(this.proveedor).subscribe((response: any) => {

            if (response.status === 200) {
              this.funcionesService.showSuccess(response.message);

              if(this.imagenSubir !== null){
                this.subirArchivo.subirArchivo(this.imagenSubir, 'proveedor', response.proveedores.id).then(() => {
                  this.funcionesService.hideLoading();
                  this.progressBar = false;
                  const oReturn: any = new Object();
                  oReturn['modal'] = 'proveedor';
                  oReturn['value'] = 'loadAgain';
                  this.activeModal.close(oReturn);
                  return;
                });
              }else{
                this.funcionesService.hideLoading();
                this.progressBar = false;
                const oReturn: any = new Object();
                oReturn['modal'] = 'proveedor';
                oReturn['value'] = 'loadAgain';
                this.activeModal.close(oReturn);
                return;
              }
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

}
