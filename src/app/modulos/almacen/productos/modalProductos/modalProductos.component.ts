import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from 'src/app/modulos/Seguridad/services/user.service';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

import { Categorias } from '../../categorias/model/categorias';
import { CategoriasService } from '../../categorias/service/categorias.service';
import { UnidadMedidas } from '../../unidadmedidas/models/unidadmedidas';
import { UnidadmedidasService } from '../../unidadmedidas/service/unidadmedidas.service';
import { Productos } from '../model/productos';
import { ProductosService } from '../service/Productos.service';

@Component({
  selector: 'app-modalProductos',
  templateUrl: './modalProductos.component.html',
  providers: [ ProductosService, CategoriasService, UnidadmedidasService ]
})
export class ModalProductosComponent implements OnInit {

  esTiendaWeb: boolean = false;

  @Input() fromParent: any;

  productos: Productos = new Productos(0, '', '0', '', '0', '', '', '', '', '', '', true, 1, '', '', false, '', '', '', 1, '', 1, '', '', '' );
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  progressBar: boolean | any = false;

  // FormGroup
  formGroup: FormGroup | any;
  titulo: string = '';

  //Combos
  cboCategorias: Categorias[] = [];
  cboUnidadMedidas: UnidadMedidas[] = [];

  constructor(
    public productosService: ProductosService,
    public categoriasService: CategoriasService,
    public unidadmedidasService: UnidadmedidasService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    public userService: UserService
  ) {
    this.new_Modal();
  }

  new_Modal() {
  this.formGroup = this.fb.group({
      id: 0,
      idPuntoVenta: ['', [Validators.required]],
      nombrePuntoVenta: [''],
      nombre: ['', [Validators.required]],
      codigoAntiguo: [''],
      codigoBarra: ['', [Validators.required]],
      idCategoria: ['', [Validators.required]],
      nombreCategoria: [''],
      idUm: ['', [Validators.required]],
      nombreUm: [''],
      stockMinimo: ['', [Validators.pattern(/^-?\d*[.,]?\d{0,4}$/)]],
      stockMaximo: ['', [Validators.pattern(/^-?\d*[.,]?\d{0,4}$/)]],
      stockActual: ['', [Validators.required, Validators.pattern(/^-?\d*[.,]?\d{0,4}$/)]],
      stockAlerta: ['', [Validators.pattern(/^-?\d*[.,]?\d{0,4}$/)]],
      precio: ['', [Validators.required, Validators.pattern(/^-?\d*[.,]?\d{0,4}$/)]],
      precioMinimo: ['', [Validators.pattern(/^-?\d*[.,]?\d{0,4}$/)]],
      precioMaximo: ['', [Validators.pattern(/^-?\d*[.,]?\d{0,4}$/)]],
      precioMayor: ['', [Validators.pattern(/^-?\d*[.,]?\d{0,4}$/)]],
      observaciones: [''],
      status: [true],
      puntoventa: [''],
      categorias: '',
      unidadMedidas: '',
      precioCompra: ['', [Validators.pattern(/^-?\d*[.,]?\d{0,4}$/)]],
      slider: [false],
      banner: [''],
     descuento: ['', [Validators.pattern(/^\d+$/)]]
    });
  }

  get getModal() { return this.formGroup.controls; }

  ngOnInit() {
    this.funcionesService.showLoading();
    this.progressBar = true;

    const opc = this.fromParent.opcion;
    const array = this.fromParent.productos;
  this.puntoVentas = JSON.parse(this.puntoVentaStorage);
  this.formGroup.get('idPuntoVenta').setValue(this.puntoVentas.id);
  this.formGroup.get('puntoventa').setValue(this.puntoVentas.nombre);
  this.esTiendaWeb = (this.puntoVentas.nombre && this.puntoVentas.nombre.trim().toUpperCase() === 'JOVITA WEB');

    this.cargarCategorias();
    this.cargarUnidadMedidas();

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        idPuntoVenta: parseInt(array.idPuntoVenta),
        nombrePuntoVenta: array.nombrePuntoVenta,
        nombre: array.nombre,
        codigoAntiguo: array.codigoAntiguo,
        codigoBarra: array.codigoBarra,
        idCategoria: parseInt(array.idCategoria),
        nombreCategoria: array.nombreCategoria,
        idUm: parseInt(array.idUm),
        nombreUm: array.nombreUm,
        stockMinimo: array.stockMinimo,
        stockMaximo: array.stockMaximo,
        stockActual: array.stockActual,
        stockAlerta: array.stockAlerta,
        precio: parseFloat(array.precio).toFixed(4),
        precioMinimo: parseFloat(array.precioMinimo).toFixed(4),
        precioMaximo: parseFloat(array.precioMaximo).toFixed(4),
        precioMayor: parseFloat(array.precioMayor).toFixed(4),
        observaciones: array.observaciones,
        status: parseInt(array.status),
        categorias: array.categorias,
        unidadMedidas: array.um,
        precioCompra: array.precioCompra,
        slider: array.slider,
        banner: array.banner ? array.banner + '' : '0',
        descuento: array.descuento
      });

      this.selectEvent(array.categorias);
      this.selectEventUM(array.um);
      this.titulo = 'Modificar Producto ' + array.nombre;
    }else{
      this.titulo = 'Agregar Producto';
    }

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  selectEvent(event: any){
    this.formGroup.get('idCategoria').setValue(event.id);
    this.formGroup.get('nombreCategoria').setValue(event.nombre);
  }
  selectEventUM(event: any){
    this.formGroup.get('idUm').setValue(event.id);
    this.formGroup.get('nombreUm').setValue(event.nombre);
  }

  saveProductos(form: FormGroup) {

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
          this.productos.id = vfbModal.id;
          this.productos.idPuntoVenta = vfbModal.idPuntoVenta !== "" ? vfbModal.idPuntoVenta: '',
          this.productos.nombrePuntoVenta = this.puntoVentas.nombre,
          this.productos.nombre = vfbModal.nombre !== "" ? vfbModal.nombre: '',
          this.productos.codigoAntiguo = vfbModal.codigoAntiguo !== "" ? vfbModal.codigoAntiguo: '',
          this.productos.codigoBarra = vfbModal.codigoBarra !== "" ? vfbModal.codigoBarra: '',
          this.productos.idCategoria = vfbModal.idCategoria !== "" ? vfbModal.idCategoria: '',
          this.productos.nombreCategoria = vfbModal.nombreCategoria !== "" ? vfbModal.nombreCategoria: '',
          this.productos.idUm = vfbModal.idUm !== "" ? vfbModal.idUm: '',
          this.productos.nombreUm = vfbModal.nombreUm !== "" ? vfbModal.nombreUm: '',
          this.productos.stockMinimo = vfbModal.stockMinimo !== "" ? vfbModal.stockMinimo: '',
          this.productos.stockMaximo = vfbModal.stockMaximo !== "" ? vfbModal.stockMaximo: '',
          this.productos.stockActual = vfbModal.stockActual !== "" ? vfbModal.stockActual: '',
          this.productos.stockAlerta = vfbModal.stockAlerta !== "" ? vfbModal.stockAlerta: '',
          this.productos.precio = vfbModal.precio !== "" ? vfbModal.precio: '',
          this.productos.precioMinimo = vfbModal.precioMinimo !== "" ? vfbModal.precioMinimo: '',
          this.productos.precioMaximo = vfbModal.precioMaximo !== "" ? vfbModal.precioMaximo: '',
          this.productos.precioMayor = vfbModal.precioMayor !== "" ? vfbModal.precioMayor: '',
          this.productos.observaciones = vfbModal.observaciones !== "" ? vfbModal.observaciones: '',
          this.productos.precioCompra = vfbModal.precioCompra !== "" ? vfbModal.precioCompra: '0.00',
          this.productos.status = vfbModal.status !== "" ? vfbModal.status: '',
          this.productos.slider = vfbModal.slider !== "" ? vfbModal.slider: false,
          this.productos.banner = vfbModal.banner !== "" ? vfbModal.banner: 0,
          this.productos.descuento = vfbModal.descuento !== "" ? vfbModal.descuento: '0.00',
          this.productos.opcion = this.fromParent.opcion;

          const lista: Productos[] = this.fromParent.lista;
          let count: number = 0;

          if(this.productos.precio === 0){
            this.funcionesService.showError('El Precio no puede ser 0');
            return;
          }

          if(this.fromParent.opcion === '1'){
            lista.forEach(element => {
              if(element.nombre === this.productos.nombre){
                count += 1;
              }
              if(element.codigoBarra === this.productos.codigoBarra){
                count += 1;
              }
            });

          }else{

            lista.forEach(element => {
              if(element.nombre === this.productos.nombre){
                if(element.id !== this.productos.id){
                  count += 1;
                }
                if(element.codigoBarra !== this.productos.codigoBarra){
                  count += 1;
                }
              }
            });
          }

          if (count === 0) {

            this.progressBar = false;
            this.funcionesService.showLoading();
            this.productos.codigoBarra = this.productos.codigoBarra.replace(' ', '');
            this.productosService.crudProductos(this.productos).subscribe((response: any) => {

              if (response.status === 200) {
                this.funcionesService.showSuccess(response.message);

                const oReturn: any = new Object();

                oReturn['modal'] = 'productos';
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
            this.funcionesService.showError('Productos o codigo de barra ya existe');
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

  cargarCategorias(){
    this.categoriasService.obtenerCategorias(this.puntoVentas.id).subscribe(response => {
      if(response.status === 200){
        this.cboCategorias = response.categorias;
      }else{
        this.userService.logout();
      }
    });
  }

  cargarUnidadMedidas(){
    this.unidadmedidasService.obtenerUnidadMedidas(this.puntoVentas.id).subscribe(response => {
      if(response.status === 200){
        this.cboUnidadMedidas = response.unidadMedidas;
      }else{
        this.userService.logout();
      }
    });
  }
}
