import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Productos } from 'src/app/modulos/almacen/productos/model/productos';
import { ProductosService } from 'src/app/modulos/almacen/productos/service/Productos.service';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

import { ComprasDetalles } from '../model/comprasDetalles';
import { ComprasService } from '../service/compras.service';

@Component({
  selector: 'app-modalIngresosProductos',
  templateUrl: './modalIngresosProductos.component.html',
  providers: [ ComprasService, ProductosService ]
})
export class ModalIngresosProductosComponent implements OnInit {

  @Input() fromParent: any;

  detalles: ComprasDetalles = new ComprasDetalles(0, '', '', '', '', '', '', '', '', '', true, '', '', '', '', '', '', '', false );
  productos: Productos = new Productos();
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  @ViewChild('cantidadInput') cantidadInput!: ElementRef;

  cantidad: any;
  subTotal: any;

  // Progress Bar
  progressBar: boolean | any;

  // FormGroup
  formGroup: FormGroup | any;

  //Combos
  cboProductos: Productos[] = [];

  constructor(
    public comprasService: ComprasService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal
  ) {
    this.new_Modal();
  }

  new_Modal() {
    this.formGroup = this.fb.group({
      id: 0,
      idCompra: 0,
      idProducto: ['', [Validators.required]],
      nombre: ['', [Validators.required]],
      codigoBarra: [''],
      fechaVencimiento: [''],
      loteProducto: [''],
      cantidad: ['', [Validators.required, Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      precio: ['', [Validators.required, Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      precioVenta: ['', [Validators.required, Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      total: ['', [Validators.required, Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      precioMinimo: ['', [Validators.required, Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      precioMaximo: ['', [Validators.required, Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      precioMayor: ['', [Validators.required, Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      observaciones: [''],
      productos: '',
      stockActual: '',
      bonificacion: [false]
    });
  }

  get getModal() { return this.formGroup.controls; }

  ngOnInit() {
    const opc = this.fromParent.opcion;
    const array = this.fromParent.items;
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.formGroup.get("fechaVencimiento").setValue(this.funcionesService.generarFechaLocal(new Date()));
    this.cboProductos = [];
    this.cargarProductos();
    // Forzar filtrado inicial por nombre
    this.filtrarPorCodigoBarra(this.fromParent.items.codigoBarra);

    // MODIFICAR
    if (opc === 2 || opc === 5) {
      this.formGroup.patchValue({
        id: array.id,
        idCompra: array.idCompra,
        idProducto: array.idProducto,
        nombre: array.nombre,
        codigoBarra: array.codigoBarra,
        fechaVencimiento: this.funcionesService.generarFechaLocal(new Date()),
        loteProducto: array.loteProducto,
        cantidad: parseFloat(array.cantidad).toFixed(5),
        precio: parseFloat(array.precioVenta).toFixed(5),
        precioCompra: parseFloat(array.precio == undefined ? 0.00 : array.precio).toFixed(5),
        precioMinimo: parseFloat(array.precioMinimo == undefined ? 0.00 : array.precioMinimo).toFixed(5),
        precioMaximo: parseFloat(array.precioMaximo == undefined ? 0.00 : array.precioMaximo).toFixed(5),
        precioMayor: parseFloat(array.precioMayor == undefined ? 0.00 : array.precioMayor).toFixed(5),
        total: array.bonificacion == true ? '0.00' : parseFloat(array.total).toFixed(5),
        stockActual: parseFloat(array.existencia).toFixed(5),
        bonificacion: array.bonificacion,
        observaciones: array.observaciones,
        productos: array
      });

      this.productos.id = array.idProducto;
      this.productos.nombre = array.nombre;
      this.productos.precio = parseFloat(array.precioVenta).toFixed(5);
      this.productos.codigoBarra = array.codigoBarra;
      this.productos.precio = array.precioVenta;
      this.productos.precioCompra = parseFloat(array.precio).toFixed(5);
      this.productos.precioMinimo = parseFloat(array.precioMinimo).toFixed(5);
      this.productos.precioMaximo = parseFloat(array.precioMaximo).toFixed(5);
      this.productos.precioMayor = parseFloat(array.precioMayor).toFixed(5);
      this.productos.stockActual = parseFloat(array.existencia).toFixed(5);
      this.selectEventProductos(this.productos);
      this.calcularTotales(array.cantidad);
    }

    this.formGroup.get('idCompra').setValue(array.idCompra);
    this.cantidad = this.formGroup.get('cantidad');

    // Suscribirse a cambios en el input de código de barra para filtrar en tiempo real
    this.formGroup.get('codigoBarra').valueChanges.subscribe((codigo: string) => {
      this.filtrarPorCodigoBarra(codigo);
    });

    setTimeout(() => {
      this.cantidadInput.nativeElement.focus();
    }, 100);
  }

  filtrarPorCodigoBarra(codigo: string) {
    const productosOriginal: Productos[] = this.fromParent.productos;
    this.cboProductos = [];
    if (codigo && codigo.trim() !== '' && parseInt(this.fromParent.opcion) === 5) {
      // Solo el producto con ese código de barra
      this.cboProductos = productosOriginal.filter(prod => prod.codigoBarra === codigo);
    } else {
      // Si no hay código, mostrar solo el primer producto por nombre (ignora código de barra)
      const nombresUnicos = new Set<string>();
      productosOriginal.forEach(prod => {
        if (!nombresUnicos.has(prod.nombre)) {
          nombresUnicos.add(prod.nombre);
          this.cboProductos.push(prod);
        }
      });
    }
  }
  ngAfterViewInit(): void {
    // Espera un poco para que el modal termine de animarse/renderizarse
    setTimeout(() => {
      this.cantidadInput.nativeElement.focus();
    }, 200);
  }

  selectEventProductos(event: Productos){
    this.formGroup.get('idProducto').setValue(event.id);
    this.formGroup.get('nombre').setValue(event.nombre);
    this.formGroup.get('codigoBarra').setValue(event.codigoBarra);

    this.formGroup.get('precio').setValue(event.precioCompra == null ? 0.0000 : parseFloat(event.precioCompra).toFixed(5));
    this.formGroup.get('precioVenta').setValue(event.precio == null ? 0.00 : parseFloat(event.precio).toFixed(5));
    this.formGroup.get('precioMinimo').setValue(event.precioMinimo == null ? 0.0000 : parseFloat(event.precioMinimo).toFixed(5));
    this.formGroup.get('precioMaximo').setValue(event.precioMaximo == null ? 0.0000 : parseFloat(event.precioMaximo).toFixed(5));
    this.formGroup.get('precioMayor').setValue(event.precioMayor == null ? 0.0000 : parseFloat(event.precioMayor).toFixed(5));
    this.formGroup.get('stockActual').setValue(event.stockActual == null ? 0.0000 : parseFloat(event.stockActual).toFixed(5));

    // Recalcular el total considerando la bonificación
    this.calcularTotales(this.formGroup.get('cantidad').value);
  }

  saveItems(form: FormGroup){

    if (form.invalid) {
      this.funcionesService.swalError('Información incorrecta o incompleta');
    }else{

      let vfbModal = this.formGroup.value;
      this.detalles.id = vfbModal.id;
      this.detalles.idCompra = vfbModal.idCompra;
      this.detalles.idProducto = vfbModal.idProducto;
      this.detalles.nombre =  this.formGroup.get("nombre").value;
      this.detalles.codigoBarra = vfbModal.codigoBarra;
      this.detalles.fechaVencimiento = vfbModal.fechaVencimiento;
      this.detalles.loteProducto = vfbModal.loteProducto;
      this.detalles.cantidad = vfbModal.cantidad;
      this.detalles.precio = parseFloat(vfbModal.precio).toFixed(5);
      this.detalles.precioVenta = parseFloat(vfbModal.precioVenta).toFixed(5);
      this.detalles.precioMinimo = parseFloat(vfbModal.precioMinimo).toFixed(5);
      this.detalles.precioMaximo = parseFloat(vfbModal.precioMaximo).toFixed(5);
      this.detalles.precioMayor = parseFloat(vfbModal.precioMayor).toFixed(5);
      this.detalles.total = vfbModal.bonificacion == true ? '0.00' : this.formGroup.get("total").value;
      this.detalles.observaciones = vfbModal.observaciones;
      this.detalles.stockActual = parseFloat(vfbModal.stockActual).toFixed(5);
      this.detalles.bonificacion = vfbModal.bonificacion;

      // if(parseInt(this.detalles.cantidad) === 0){
      //   this.funcionesService.showError('La cantidad no puede ser 0');
      // }else{
      // }
      const oReturn: any = new Object();
      oReturn['modal'] = 'items';
      oReturn['value'] = 'loadAgain';
      oReturn['opcion'] = this.fromParent.opcion;
      oReturn['items'] = this.detalles;
      this.new_Modal();
      this.activeModal.close(oReturn);
    }
  }

  cargarProductos(){
    // let productosStorage: string | any = localStorage.getItem('productos');
    // this.cboProductos = JSON.parse(productosStorage);
    // this.funcionesService.showLoading();
    // this.progressBar = true;
    // this.productosService.cargarProductosVentas(this.puntoVentas.id).subscribe(response => {
      // Si hay un código de barra en el form, filtra solo ese producto
      const productosOriginal: Productos[] = this.fromParent.productos;
      const codigoBarraBuscado = this.fromParent.items.codigoBarra;
      if (codigoBarraBuscado && codigoBarraBuscado.trim() !== '' && parseInt(this.fromParent.opcion) === 5) {
        this.cboProductos = productosOriginal.filter(prod => prod.codigoBarra === codigoBarraBuscado);
      } else {
        // Si no hay código, muestra solo productos con código de barra único
        const codigosUnicos = new Set<string>();
        this.cboProductos = productosOriginal.filter(prod => {
          if (!codigosUnicos.has(prod.codigoBarra)) {
            codigosUnicos.add(prod.codigoBarra);
            return true;
          }
          return false;
        });
      }
    //   this.funcionesService.hideLoading();
    //   this.progressBar = false;
    // });
  }

  calcularTotales(value: any){
    if(value !== ''){
      if(this.formGroup.get('bonificacion').value){
        this.formGroup.get('total').setValue('0.00');
      }else{
        this.formGroup.get("total").setValue((parseFloat(value) * parseFloat(this.formGroup.get("precio").value == '' ? 0 : this.formGroup.get("precio").value)).toFixed(5));
      }
    }
  }

  calcularBonificacion(event: any){
    if(event.checked){
      this.formGroup.get('total').setValue('0.00');
    }else{
      this.formGroup.get("total").setValue((parseFloat(this.formGroup.get("cantidad").value) * parseFloat(this.formGroup.get("precio").value == '' ? 0 : this.formGroup.get("precio").value)).toFixed(5));
    }
  }

}
