import { Component, OnInit, Type, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';

import { NgbModalOptions, NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Productos } from 'src/app/modulos/almacen/productos/model/productos';
import { ProductosService } from 'src/app/modulos/almacen/productos/service/Productos.service';
import { Proveedor } from 'src/app/modulos/mantenimientos/proveedor/model/proveedor';
import { ProveedorService } from 'src/app/modulos/mantenimientos/proveedor/service/proveedor.service';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { ModalconvertirkilosComponent } from 'src/app/modulos/ventas/recibos/modalconvertirkilos/modalconvertirkilos.component';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { Comprobantes } from 'src/app/shared/services/tipodocumento/comprobantes';
import { TipodocumentoService } from 'src/app/shared/services/tipodocumento/tipodocumento.service';
import { SubirArchivoService } from 'src/app/shared/subirArchivo/subir-archivo.service';

import { ModalIngresosProductosComponent } from '../modalIngresosProductos/modalIngresosProductos.component';
import { Compras } from '../model/compras';
import { ComprasDetalles } from '../model/comprasDetalles';
import { ComprasService } from '../service/compras.service';
declare var $: any;

// Modals
const MODALS: { [name: string]: Type<any> } = {
  items: ModalIngresosProductosComponent,
  kilos: ModalconvertirkilosComponent
};

@Component({
  selector: 'app-modalIngresos',
  templateUrl: './modalIngresos.component.html',
  providers: [ ComprasService, ProveedorService, TipodocumentoService, ProductosService ]
})
export class ModalIngresosComponent implements OnInit {

  @Input() fromParent: any;

  compras: Compras = new Compras(0, '', '', '0', '', '', '', '0', '', '', '', '', '', true, '', 1, '', '', '', '0', '', '0');
  productos: Productos = new Productos(0, '', '0', '', '0', '', '', '', '', '', '', true, 1, '', '', false);
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  progressBar: boolean | any;

  // FormGroup
  formGroup: FormGroup | any;
  titulo: string = '';
  selectedRowIndex: any;

  //Combos
  cboProveedores: Proveedor[] = [];
  cboComprobantes: Comprobantes[] = [];
  productosLista: Productos[] = [];

  textoImagen: string = 'Seleccione un archivo';
  sinFoto:string = 'assets/img/sinFoto.png';
  imagenSubir: File | any = null;
  imagenTemp: any;

  displayedColumns: string[] = [ 'codigoBarra', 'nombre', 'cantidad', 'precio', 'nuevoPrecio', 'total', 'existencia', 'acciones'];
  dataSource: MatTableDataSource<ComprasDetalles> = new MatTableDataSource<ComprasDetalles>();
  items: ComprasDetalles = new ComprasDetalles(0, '', '', '', '', '', '', '', '');
  opcion: number = 1;
  detalles: ComprasDetalles[] = [];
  indexEliminar: number = 0;

  NgbModalOptions: NgbModalOptions = {
    size: 'lg',
    centered: true,
    scrollable: true,
    keyboard: false,
    backdrop: 'static',
    windowClass: 'modal-holder'
  };

  constructor(
    public comprasService: ComprasService,
    private proveedorService: ProveedorService,
    private comprobantesService: TipodocumentoService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private _modalService: NgbModal,
    private subirArchivo: SubirArchivoService,
    private productosService: ProductosService
  ) {
    this.new_Modal();
  }

  new_Modal() {
    this.formGroup = this.fb.group({
      id: 0,
      idPuntoVenta: ['', [Validators.required]],
      fechaCompra: ['', [Validators.required]],
      idProveedor: ['', [Validators.required]],
      rucProveedor: ['', [Validators.required]],
      nombreProveedor: ['', [Validators.required]],
      razonSocial: ['', [Validators.required]],
      idTipoDocumento: ['', [Validators.required]],
      nombreTipoDocumento: ['', [Validators.required]],
      numeroTipoDocumento: ['', [Validators.required]],
      procedencia: [''],
      archivo: [''],
      cantidad: [1, [Validators.required, Validators.pattern(/^-?(0|[1-9]\d*)?$/)]],
      observaciones: [''],
      status: [true],
      puntoventa: '',
      proveedores: '',
      comprobantes: '',
      totalCompras: '',
      percepcion: ['0'],
      codigoBarra: ['']
    });
  }

  get getModal() { return this.formGroup.controls; }

  ngOnInit() {
    $("#codigoBarra").focus();
    const opc = this.fromParent.opcion;
    const array = this.fromParent.compras;
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.formGroup.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.formGroup.get('puntoventa').setValue(this.puntoVentas.nombre);
    this.cargarProductos();
    this.cargarProveedores();
    this.cargarComprobantes();
    this.formGroup.get("fechaCompra").setValue(this.funcionesService.generarFechaLocal3(new Date()));

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        idPuntoVenta: parseInt(array.idPuntoVenta),
        fechaCompra: array.fechaCompra,
        idProveedor: array.idProveedor,
        rucProveedor: array.rucProveedor,
        nombreProveedor: array.nombreProveedor,
        razonSocial: array.razonSocial,
        idTipoDocumento: array.idTipoDocumento,
        nombreTipoDocumento: array.nombreTipoDocumento,
        numeroTipoDocumento: array.numeroTipoDocumento,
        procedencia: array.procedencia,
        archivo: array.archivo,
        observaciones: array.observaciones,
        status: array.status,
        proveedores: array.proveedores,
        comprobantes: array.comprobantes,
        totalCompras: array.totalCompras,
        percepcion: array.percepcion
      });

      this.imagenTemp = this.comprasService.urlUpload + array.archivo;
      this.textoImagen = array.archivo;

      this.titulo = 'Modificar Compra ' + array.numeroTipoDocumento;

      if(array.detalles !== null){
        this.detalles = array.detalles;

        let total: any = 0;
        this.detalles.forEach(element => {
          total = parseFloat(total) + parseFloat(element.total);
        });
        // total = parseFloat(total) + parseFloat(this.formGroup.get('percepcion').value == undefined ? 0 : this.formGroup.get('percepcion').value);
        this.formGroup.get('totalCompras').setValue(total);
        this.dataSource = new MatTableDataSource<ComprasDetalles>(this.detalles);
      }
    }else{
       this.titulo = 'Agregar Compra';
    }
  }

  selectEventProveedores(event: Proveedor){
    this.formGroup.get('idProveedor').setValue(event.id);
    this.formGroup.get('rucProveedor').setValue(event.numeroDoi);
    this.formGroup.get('nombreProveedor').setValue(event.nombre);
    this.formGroup.get('razonSocial').setValue(event.razonsocial);
  }

  selectEventComprobantes(event: Comprobantes){
    this.formGroup.get('idTipoDocumento').setValue(event.id);
    this.formGroup.get('nombreTipoDocumento').setValue(event.documento);
  }

  eliminarItem(index: number){
    this.funcionesService.mensajeConfirmar('', '¿Desea quitar este producto de la lista?', (result: any) => {
      if (result.isConfirmed) {
        this.detalles.splice(index, 1);
        let total: any = 0;
        this.detalles.forEach(element => {
          total = parseFloat(total) + parseFloat(element.total);
        });
        // total = parseFloat(total) + parseFloat(this.formGroup.get('percepcion').value);
        this.formGroup.get('totalCompras').setValue(total);
        this.dataSource = new MatTableDataSource<ComprasDetalles>(this.detalles);
      }
    });
  }

  eliminarImagen(){
    this.imagenSubir = null;
    this.imagenTemp = null;
    this.textoImagen = 'Seleccione un archivo';
    this.formGroup.get("archivo").setValue('');
  }

  public seleccionImagen(event: any){
    let archivo = event.target.files[0];

    if (!archivo) {
      this.imagenSubir = null;
      return;
    }

    this.imagenSubir = archivo;
    this.textoImagen = archivo.name;
    this.formGroup.get("archivo").setValue(archivo.name);

    let reader = new FileReader();
    let urlImagenTemp = reader.readAsDataURL(archivo);
    reader.onloadend = ()=> this.imagenTemp = reader.result;
  }

  saveCompras(form: FormGroup): any {

    if (form.invalid) {
      this.funcionesService.swalError('Información incorrecta o incompleta');
    }else{
      let titulo: string = '';
      if (this.fromParent.opcion === '1' || this.fromParent.opcion === 1) {
        titulo = '¿Estas seguro de guardar el registro?';
      }else{
        titulo = '¿Estas seguro de modificar el registro?';
      }
      this.funcionesService.mensajeConfirmar(titulo, '', (resultado: any): any => {
        if (resultado.isConfirmed) {

          let vfbModal = form.value;
          this.compras.id = vfbModal.id;
          this.compras.idPuntoVenta = vfbModal.idPuntoVenta == null ? '': vfbModal.idPuntoVenta;
          this.compras.fechaCompra = vfbModal.fechaCompra !== null ? vfbModal.fechaCompra: '',
          this.compras.idProveedor = vfbModal.idProveedor !== null ? vfbModal.idProveedor: '',
          this.compras.rucProveedor = vfbModal.rucProveedor !== null ? vfbModal.rucProveedor: '',
          this.compras.nombreProveedor = vfbModal.nombreProveedor !== null ? vfbModal.nombreProveedor: '',
          this.compras.razonSocial = vfbModal.razonSocial !== null ? vfbModal.razonSocial: '',
          this.compras.idTipoDocumento = vfbModal.idTipoDocumento !== null ? vfbModal.idTipoDocumento: '',
          this.compras.nombreTipoDocumento = vfbModal.nombreTipoDocumento !== null ? vfbModal.nombreTipoDocumento: '',
          this.compras.numeroTipoDocumento = vfbModal.numeroTipoDocumento !== null ? vfbModal.numeroTipoDocumento: '',
          this.compras.procedencia = vfbModal.procedencia !== null ? vfbModal.procedencia: '',
          this.compras.archivo = vfbModal.archivo !== null ? vfbModal.archivo: '',
          this.compras.observaciones = vfbModal.observaciones == null ? '' : vfbModal.observaciones;
          this.compras.status = vfbModal.status == null ? '' : vfbModal.status;
          this.compras.percepcion = vfbModal.percepcion == null ? '' : vfbModal.percepcion;
          this.compras.opcion = this.fromParent.opcion;

          let total: any = 0;
          this.detalles.forEach(element => {
            element.idCompra = parseInt(this.fromParent.compras.id);
            element.cantidad = parseFloat($("#cantidad-" + element.codigoBarra).val()).toFixed(5);
            element.precio = parseFloat($("#precio-" + element.codigoBarra).val()).toFixed(5);
            element.nuevoPrecio = parseFloat($("#nuevoPrecio-" + element.codigoBarra).val()).toFixed(5);
            element.total = parseFloat(element.total).toFixed(5);
            element.precioVenta = parseFloat(element.precioVenta).toFixed(5);
            element.precioMinimo = parseFloat(element.precioMinimo).toFixed(5);
            element.precioMaximo = parseFloat(element.precioMaximo).toFixed(5);
            element.precioMayor = parseFloat(element.precioMayor).toFixed(5);
            element.status = 1;
            total = (parseFloat(total) + parseFloat(element.total)).toFixed(5);
          });

          // total = parseFloat(total) + parseFloat(this.formGroup.get('percepcion').value);
          this.compras.totalCompras = total;
          this.compras.detalles = this.detalles;

          if(this.detalles.length === 0){
            this.funcionesService.showError('Ingrese por lo menos un producto');
            this.funcionesService.hideLoading();
            this.progressBar = false;
            return false;
          }

          this.funcionesService.showLoading();
          this.progressBar = false;
          this.comprasService.crudCompras(this.compras).subscribe((response: any) => {

            if (response.status === 200) {

              if(this.imagenSubir !== null){
                this.subirArchivo.subirArchivo(this.imagenSubir, 'compras', response.compras.id).then(() => {
                  this.funcionesService.showSuccess(response.message);
                  const oReturn: any = new Object();

                  oReturn['modal'] = 'compras';
                  oReturn['value'] = 'loadAgain';

                  this.activeModal.close(oReturn);
                  this.funcionesService.hideLoading();
                  this.progressBar = false;
                });
              }else{
                this.funcionesService.showSuccess(response.message);
                const oReturn: any = new Object();

                oReturn['modal'] = 'compras';
                oReturn['value'] = 'loadAgain';

                this.activeModal.close(oReturn);
                this.funcionesService.hideLoading();
                this.progressBar = false;
              }
            }
            else {
              this.funcionesService.showError(response.message);
              this.funcionesService.hideLoading();
              this.progressBar = false;
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

  cargarProductos(){
    // this.funcionesService.showLoading();
    // this.productosService.cargarProductosVentas(this.puntoVentas.id).subscribe(response => {
      this.productosLista = this.fromParent.productos;
    //   this.funcionesService.hideLoading();
    // });
  }

  cargarProveedores(){
    this.proveedorService.obtenerProveedor(this.puntoVentas.id).subscribe(response => {
      this.cboProveedores = this.cboProveedores.filter(x => parseInt(x.status) === 1);
      this.cboProveedores = response.proveedores;

      const array = this.fromParent.compras;
      if (this.cboProveedores.length > 0) {
        let proveedor: Proveedor = new Proveedor();
        proveedor = this.cboProveedores.filter(x => parseInt(x.id) === parseInt(array.idProveedor))[0];
        if (proveedor !== undefined) {
          this.formGroup.get('proveedores').setValue(proveedor);
          this.selectEventProveedores(proveedor);
        }
      }
    });
  }

  cargarComprobantes(){
    this.comprobantesService.cargarTipoDocumento().subscribe(response => {
      this.cboComprobantes = response.tipoDocumento;

      const array = this.fromParent.compras;
      if (this.cboComprobantes.length > 0) {
        let comprobantes: Comprobantes = new Comprobantes();
        comprobantes = this.cboComprobantes.filter(x => parseInt(x.id) === parseInt(array.idTipoDocumento))[0];
        if (comprobantes !== undefined) {
          this.formGroup.get('comprobantes').setValue(comprobantes);
          this.selectEventComprobantes(comprobantes);
        }
      }
    });
  }

  agregarItem(){
    this.opcion = 1;
    this.openModal('items');
  }

  viewDetail(element: any, index: number) {
    this.opcion = 2;
    this.items = element;
    this.items.cantidad = $("#cantidad-" + element.codigoBarra).val();

    let productos: Productos = this.productosLista.filter(x => parseInt(x.id) === parseInt(element.idProducto))[0];
    this.items.precioVenta = parseFloat(productos.precio).toFixed(4);
    this.items.precioMinimo = parseFloat(productos.precioMinimo).toFixed(4);
    this.items.precioMaximo = parseFloat(productos.precioMaximo).toFixed(4);
    this.items.precioMayor = parseFloat(productos.precioMayor).toFixed(4);
    this.items.bonificacion = element.bonificacion;

    this.indexEliminar = index;
    this.openModal('items');
  }

  private modalAbierto = false;

  openModal(name: string) {

    if (this.modalAbierto) return;
    this.modalAbierto = true;

    const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
    const obj: any = new Object();

    switch (name) {
      case 'items':
        obj['opcion'] = this.opcion;
        obj['items'] = this.items;
        obj['productos'] = this.productosLista;
        modalRef.componentInstance.fromParent = obj;
      break;
      case 'kilos':
        obj['productos'] = this.productos;
        modalRef.componentInstance.fromParent = obj;
      break;
    }

    modalRef.result.finally(() => this.modalAbierto = false);
    modalRef.result.then(async (result) => {

      switch (result.modal) {
        case 'items':
          this.funcionesService.showLoading();
          this.progressBar = true;
          if (result.value === 'loadAgain') {

            if(parseInt(result.opcion) === 1){
              this.detalles.push({
                id: result.items.id,
                idCompra: this.fromParent.compras.id,
                idProducto: result.items.idProducto,
                nombre: result.items.nombre,
                codigoBarra: result.items.codigoBarra,
                precio: result.items.precio,
                precioVenta: result.items.precioVenta,
                cantidad: result.items.cantidad,
                fechaVencimiento: result.items.fechaVencimiento,
                loteProducto: result.items.loteProducto,
                total: result.items.total,
                observaciones: result.items.observaciones,
                existencia: result.items.stockActual,
                precioMaximo: result.items.precioMaximo,
                precioMinimo: result.items.precioMinimo,
                precioMayor: result.items.precioMayor,
                bonificacion: result.items.bonificacion,
                status: 1
              });
            }

            if(parseInt(result.opcion) === 2){
              this.detalles.forEach((element, index) => {
                if(index === this.indexEliminar){
                  element.id = result.items.id,
                  element.idCompra = this.fromParent.compras.id;
                  element.idProducto = result.items.idProducto,
                  element.nombre = result.items.nombre,
                  element.codigoBarra = result.items.codigoBarra,
                  element.fechaVencimiento = result.items.fechaVencimiento,
                  element.cantidad = result.items.cantidad,
                  element.precio = result.items.precio,
                  element.precioVenta = result.items.precioVenta,
                  element.total = result.items.total,
                  element.observaciones = result.items.observaciones,
                  element.existencia = result.items.stockActual,
                  element.precioMaximo = result.items.precioMaximo,
                  element.precioMinimo = result.items.precioMinimo,
                  element.precioMayor = result.items.precioMayor,
                  element.bonificacion = result.items.bonificacion
                }
              });
            }

            if(parseInt(result.opcion) === 5){
              this.detalles.push({
                id: result.items.id,
                idCompra: this.fromParent.compras.id,
                idProducto: result.items.idProducto,
                nombre: result.items.nombre,
                codigoBarra: result.items.codigoBarra,
                fechaVencimiento: result.items.fechaVencimiento,
                cantidad: result.items.cantidad,
                precio: result.items.precio,
                precioVenta: result.items.precioVenta,
                total: result.items.total,
                observaciones: result.items.observaciones,
                existencia: result.items.stockActual,
                precioMaximo: result.items.precioMaximo,
                precioMinimo: result.items.precioMinimo,
                precioMayor: result.items.precioMayor,
                bonificacion: result.items.bonificacion,
                loteProducto: result.items.loteProducto == undefined ? '' : result.items.loteProducto
              });
            }

            if(parseInt(result.opcion) === 3){
              this.detalles.splice(this.indexEliminar, 1);
            }

            let total: any = 0;
            let sumCantidad: any = 0;
            this.detalles.forEach(element => {
              sumCantidad += parseFloat(element.cantidad);
            });
            // total = parseFloat(total) + parseFloat(this.formGroup.get('percepcion').value);
            this.detalles.forEach(element => {
              if(element.bonificacion){
                element.total = '0.00';
              } else {
                element.nuevoPrecio = (parseFloat(element.precio) + (parseFloat(this.formGroup.get('percepcion').value) / sumCantidad)).toFixed(5);
                element.total = (parseFloat(element.cantidad) * parseFloat(element.nuevoPrecio)).toFixed(5);
              }
            });

            this.detalles.forEach(element => {
              if(!element.bonificacion){
                total = parseFloat(total) + parseFloat(element.total);
              }
            });
            this.formGroup.get('totalCompras').setValue(total);
            this.dataSource = new MatTableDataSource<ComprasDetalles>(this.detalles);
          }

          this.funcionesService.hideLoading();
          this.progressBar = false;
          break;

        case 'kilos':
          this.funcionesService.showLoading();
          this.progressBar = true;
          if (result.value === 'loadAgain') {
            let productos = result.productos;
            let cantidad = result.cantidad;

            // if(parseInt(productos.stockActual) <= parseInt(productos.stockAlerta)){
            //   this.funcionesService.showError('El producto ' + productos.nombre + ' se esta quedando sin stock. Stock Actual: ' + productos.stockActual);
            // }

            let detalles: ComprasDetalles[] = [];
            detalles = this.detalles.filter(x => parseInt(x.idProducto) === parseInt(productos.id));

            if(detalles.length === 0){
              this.detalles.push({
                idCompra: 0,
                idProducto: productos.id,
                codigoBarra: productos.codigoBarra,
                nombre: productos.nombre,
                precio: productos.precioCompra,
                precioVenta: productos.precio,
                cantidad: cantidad,
                fechaVencimiento: productos.fechaVencimiento,
                total: ((parseFloat(cantidad) * parseFloat(productos.precioCompra)).toFixed(2)),
                observaciones: '',
                existencia: productos.stockActual,
                bonificacion: false
              });
            }else{

              this.detalles.forEach(element => {
                if(element.idProducto === productos.id){
                  element.cantidad = (parseFloat(cantidad) + parseFloat(element.cantidad)).toFixed(2);
                  element.total = (parseFloat(element.cantidad) * parseFloat(productos.precioCompra)).toFixed(2);
                }
              });
            }

            $("#codigoBarra").val('');
            this.selectedRowIndex = productos.codigoBarra;
            this.dataSource = new MatTableDataSource<ComprasDetalles>(this.detalles);

            let total: any = 0;
            this.detalles.forEach(element => {
              total += parseFloat(element.total);
            });
            // total = parseFloat(total) + parseFloat(this.formGroup.get('percepcion').value);
            this.formGroup.get("totalCompras").setValue(parseFloat(total).toFixed(2));
          }
          this.funcionesService.hideLoading();
          this.progressBar = false;
          break;
      }

    }, (reason) => { });
  }


  private buscandoCodigoBarra = false;

  /**
   * Procesa el código de barra: busca el producto y abre el modal correspondiente
   * Se ejecuta al presionar Enter, pegar o cambiar el valor del input
   */
  private procesarCodigoBarra(): void {
    const codigo = this.formGroup.get('codigoBarra')?.value?.trim();
    if (codigo !== '' && codigo !== undefined && !this.buscandoCodigoBarra) {
      this.buscandoCodigoBarra = true;
      this.productosService.obtenerProductosCodigoBarra(codigo, this.puntoVentas.id).subscribe(response => {
        let productos: Productos = response.productos;
        if(productos.nombreUm.toUpperCase() === 'KILOGRAMO'){
          this.productos = productos;
          this.openModal('kilos');
        }else{
          this.items = productos;
          this.opcion = 5;
          this.items.idProducto = productos.id;
          this.items.cantidad = 1;
          this.items.precioVenta = productos.precio;
          this.items.precio = productos.precioCompra;
          this.items.existencia = productos.stockActual;
          this.items.loteProducto = '';
          this.items.bonificacion = '';
          this.openModal('items');
          $("#codigoBarra").focus();
          this.formGroup.get('codigoBarra')?.setValue('');
        }
        $("#codigoBarra").val('');
        this.buscandoCodigoBarra = false;
      }, error => {
        this.buscandoCodigoBarra = false;
      });
    }
  }

  onEnter(event: any): void {
    event.preventDefault();
    this.procesarCodigoBarra();
  }

  /**
   * Se dispara después del evento paste (para códigos pegados)
   */
  onPasteCodigoBarra(): void {
    // Pequeño delay para permitir que el valor se actualice en el input
    setTimeout(() => {
      this.procesarCodigoBarra();
    }, 50);
  }

  /**
   * Se dispara cuando pierdes el foco del input (blur)
   * Útil para pistolas que no envían Enter automáticamente
   */
  onBlurCodigoBarra(): void {
    this.procesarCodigoBarra();
  }

  onKeydown(event: any, indice: number) {
    if (event.key === 'ArrowDown') {
      this.dataSource.filteredData.forEach((element, index) => {
        if (indice === index) {
          this.reducir(element);
        }
      });
    }
    if (event.key === 'ArrowUp') {
      this.dataSource.filteredData.forEach((element, index) => {
        if (indice === index) {
          this.aumentar(element);
        }
      });
    }
    if (event.key === 'Delete') {
      this.eliminarItem(indice);
    }
  }

  aumentar(detalle: ComprasDetalles){
    $("#cantidad-" + detalle.codigoBarra).val(parseFloat($("#cantidad-" + detalle.codigoBarra).val()) + 1);
    detalle.total = parseFloat(((parseFloat($("#cantidad-" + detalle.codigoBarra).val()) * (parseFloat(detalle.precio)))).toFixed(2));

    let total: any = 0;
    this.detalles.forEach(element => {
      if(element.bonificacion){
        total = 0;
        element.total = '0.00';
      }else{
        total += parseFloat(element.total);
      }
    });
    // total = parseFloat(total) + parseFloat(this.formGroup.get('percepcion').value);
    this.formGroup.get("totalCompras").setValue(parseFloat(total).toFixed(2));
  }

  reducir(detalle: ComprasDetalles){
    if($("#cantidad-" + detalle.codigoBarra).val() > 1){
      $("#cantidad-" + detalle.codigoBarra).val(parseFloat($("#cantidad-" + detalle.codigoBarra).val()) - 1);
      detalle.total = parseFloat(((parseFloat($("#cantidad-" + detalle.codigoBarra).val()) * (parseFloat(detalle.precio)))).toFixed(2));

      let total: any = 0;
      this.detalles.forEach(element => {
        if(element.bonificacion){
          total = 0;
          element.total = '0.00';
        }else{
          total += parseFloat(element.total);
        }
      });

      // total = parseFloat(total) + parseFloat(this.formGroup.get('percepcion').value);
      this.formGroup.get("totalCompras").setValue(parseFloat(total).toFixed(2));
    }
  }

  calcular(detalle:ComprasDetalles){
    let productosLista: Productos[] = this.productosLista;
    productosLista = productosLista.filter(x => x.codigoBarra === detalle.codigoBarra && parseInt(x.idPuntoVenta) === this.puntoVentas.id);
    let productos: Productos = productosLista[0];
    let stockActual: any = parseFloat(productos.stockActual) - parseFloat($("#cantidad-" + detalle.codigoBarra).val());

    if(parseInt(stockActual) > 0 && parseInt(stockActual) <= parseInt(productos.stockAlerta)){
      this.funcionesService.showError('El producto ' + productos.nombre + ' se esta quedando sin stock. Stock Actual: ' + productos.stockActual);
    }

    this.detalles.forEach(element => {
      if(element.idProducto === productos.id){
        if(element.bonificacion){
          element.total = '0.00';
        } else {
          element.total = ((parseFloat($("#cantidad-" + detalle.codigoBarra).val()) * parseFloat($("#precio-" + detalle.codigoBarra).val())).toFixed(2));
        }
      }
    });

    let total: any = 0;
      this.detalles.forEach(element => {
        if(!element.bonificacion){
          total += parseFloat(element.total);
        }
      });

      // total = parseFloat(total) + parseFloat(this.formGroup.get('percepcion').value);
      this.formGroup.get("totalCompras").setValue(parseFloat(total).toFixed(2));
  }

  calcularPercepcion(event: any): any{
    if (event.value !== '') {
      let sumCantidad: any = 0;
      this.detalles.forEach(element => {
        sumCantidad += parseFloat(element.cantidad);
      });

      this.detalles.forEach(element => {
        if(element.bonificacion){
          element.total = '0.00';
        } else {
          element.nuevoPrecio = (parseFloat(element.precio) + (parseFloat(event.value) / sumCantidad)).toFixed(5);
          element.total = (parseFloat(element.cantidad) * parseFloat(element.nuevoPrecio)).toFixed(5);
        }
      });
    }

    let total: any = 0;
    this.detalles.forEach(element => {
      if(!element.bonificacion){
        total += parseFloat(element.total);
      }
    });
    this.formGroup.get("totalCompras").setValue(parseFloat(total).toFixed(2));
  }

}
