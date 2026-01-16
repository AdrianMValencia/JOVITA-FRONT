import { Component, OnInit, Input } from '@angular/core';
import { UbicacionesService } from '../service/ubicaciones.service';
import { ProductosService } from '../../productos/service/Productos.service';
import { AlmacenesService } from '../../almacenes/service/almacenes.service';
import { Ubicaciones } from '../models/ubicaciones';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Productos } from '../../productos/model/productos';
import { Almacenes } from '../../almacenes/models/almacenes';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-modalubicaciones',
  templateUrl: './modalubicaciones.component.html',
  providers: [UbicacionesService, ProductosService, AlmacenesService]
})
export class ModalubicacionesComponent implements OnInit {
  @Input() fromParent: any;

  ubicaciones: Ubicaciones = new Ubicaciones(0, '', '0', '', '0', '', '', '', '', '', '', '', '', '', '', true, '', 1, '', '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  progressBar: boolean | any;

  // FormGroup
  formGroup: FormGroup | any;

  //Combos
  cboProducto: Productos[] = [];
  cboAlmacenes: Almacenes[] = [];
  titulo: string = '';

  constructor(
    public ubicacionesService: UbicacionesService,
    private productosService: ProductosService,
    private almacenesService: AlmacenesService,
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
      idProducto: ['', [Validators.required]],
      nombre: ['', [Validators.required]],
      idAlmacen: ['', [Validators.required]],
      nombreAlmacen: ['', [Validators.required]],
      ubicacion1: [''],
      anaquel1: [''],
      gaveta1: [''],
      numeroGaveta1: [''],
      ubicacion2: [''],
      anaquel2: [''],
      gaveta2: [''],
      numeroGaveta2: [''],
      observaciones: [''],
      status: [true],
      puntoventa: [''],
      productos: [''],
      almacenes: ['']
    });
  }

  get getModal() { return this.formGroup.controls; }

  ngOnInit() {
    this.funcionesService.showLoading();
    this.progressBar = true;

    const opc = this.fromParent.opcion;
    const array = this.fromParent.ubicaciones;
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.formGroup.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.formGroup.get('puntoventa').setValue(this.puntoVentas.nombre);

    this.cargarProducto();
    this.cargarAlmacenes();

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        idPuntoVenta: array.idPuntoVenta,
        idProducto: array.idProducto,
        nombre: array.nombre,
        idAlmacen: array.idAlmacen,
        nombreAlmacen: array.nombreAlmacen,
        ubicacion1: array.ubicacion1,
        anaquel1: array.anaquel1,
        gaveta1: array.gaveta1,
        numeroGaveta1: array.numeroGaveta1,
        ubicacion2: array.ubicacion2,
        anaquel2: array.anaquel2,
        gaveta2: array.gaveta2,
        numeroGaveta2: array.numeroGaveta2,
        observaciones: array.observaciones,
        status: array.status,
        productos: array.productos,
        almacenes: array.almacenes
      });

      this.selectEvent(array.productos);
      this.selectEventAlmacen(array.almacenes);
      this.titulo = 'Modificar Ubicación ' + array.nombre;
    }else{
      this.titulo = 'Agregar Ubicación';
    }

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  selectEvent(event: Productos){
    this.formGroup.get('idProducto').setValue(event.id);
    this.formGroup.get('nombre').setValue(event.nombre);
  }

  selectEventAlmacen(event: Almacenes){
    this.formGroup.get('idAlmacen').setValue(event.id);
    this.formGroup.get('nombreAlmacen').setValue(event.nombre);
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
          this.ubicaciones.id = vfbModal.id;
          this.ubicaciones.idPuntoVenta = vfbModal.idPuntoVenta !== null ? vfbModal.idPuntoVenta : null,
          this.ubicaciones.idProducto = vfbModal.idProducto !== null ? vfbModal.idProducto : null,
          this.ubicaciones.nombre = vfbModal.nombre !== null ? vfbModal.nombre : null,
          this.ubicaciones.idAlmacen = vfbModal.idAlmacen !== null ? vfbModal.idAlmacen : null,
          this.ubicaciones.nombreAlmacen = vfbModal.nombreAlmacen !== null ? vfbModal.nombreAlmacen : null,
          this.ubicaciones.ubicacion1 = vfbModal.ubicacion1 !== null ? vfbModal.ubicacion1 : null,
          this.ubicaciones.anaquel1 = vfbModal.anaquel1 !== null ? vfbModal.anaquel1 : '',
          this.ubicaciones.gaveta1 = vfbModal.gaveta1 !== null ? vfbModal.gaveta1 : '',
          this.ubicaciones.numeroGaveta1 = vfbModal.numeroGaveta1 !== null ? vfbModal.numeroGaveta1 : '',
          this.ubicaciones.ubicacion2 = vfbModal.ubicacion2 !== null ? vfbModal.ubicacion2 : null,
          this.ubicaciones.anaquel2 = vfbModal.anaquel2 !== null ? vfbModal.anaquel2 : '',
          this.ubicaciones.gaveta2 = vfbModal.gaveta2 !== null ? vfbModal.gaveta2 : '',
          this.ubicaciones.numeroGaveta2 = vfbModal.numeroGaveta2 !== null ? vfbModal.numeroGaveta2 : '',
          this.ubicaciones.observaciones = vfbModal.observaciones !== null ? vfbModal.observaciones : '',
          this.ubicaciones.status = vfbModal.status,
          this.ubicaciones.opcion = this.fromParent.opcion;

          this.funcionesService.showLoading()
          this.progressBar = false;
          this.ubicacionesService.crudUbicaciones(this.ubicaciones).subscribe((response: any) => {

            if (response.status === 200) {
              this.funcionesService.showSuccess(response.message);

              const oReturn: any = new Object();

              oReturn['modal'] = 'ubicaciones';
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

  cargarProducto(){
    this.productosService.cargarProductosVentas(this.puntoVentas.id).subscribe(response => {
      this.cboProducto = response.productos;
    });
  }

  cargarAlmacenes(){
    this.almacenesService.obtenerAlmacenes(this.puntoVentas.id).subscribe(response => {
      this.cboAlmacenes = response.almacenes;
    });
  }
}
