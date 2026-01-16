import Swal  from 'sweetalert2';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FuncionesService } from './../../../../shared/services/funciones.service';
import { CotizacionService } from './../service/cotizacion.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Component, OnInit, Input } from '@angular/core';
import { DetallesCotizacion } from '../model/detallesCotizacion';
import { Productos } from 'src/app/modulos/almacen/productos/model/productos';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { ProductosService } from 'src/app/modulos/almacen/productos/service/Productos.service';

@Component({
  selector: 'app-modal-items',
  templateUrl: './modal-items.component.html',
  providers: [CotizacionService, ProductosService]
})
export class ModalItemsComponent implements OnInit {

  @Input() fromParent: any;

  detalles: DetallesCotizacion = new DetallesCotizacion(0, 0, '', '', '', '', '', '', '', '', '', '', '');
  productos: Productos = new Productos();
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  cantidad: any;
  subtotal: any;

  // Progress Bar
  pbModal: boolean | any;

  // FormGroup
  formGroup: FormGroup | any;

  //Combos
  cboProductos: Productos[] = [];

  constructor(
    public cotizacionService: CotizacionService,
    private productosService: ProductosService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal
  ) {
    this.new_Modal();
  }

  new_Modal() {
    this.formGroup = this.fb.group({
      id: 0,
      idProducto: ['', [Validators.required]],
      nombre: [''],
      descripcion: [''],
      precio: ['', [Validators.required]],
      cantidad: [1, [Validators.required, Validators.pattern(/^-?(0|[1-9]\d*)?$/)]],
      igv: [0.18, [Validators.required]],
      subtotal: ['', [Validators.required]],
      total: ['', [Validators.required]],
      productos: ''
    });
  }

  get getModal() { return this.formGroup.controls; }

  ngOnInit() {
    this.funcionesService.showLoading();
    this.pbModal = true;

    const opc = this.fromParent.opcion;
    const array = this.fromParent.items;
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.cargarProductos();

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        idProducto: array.idProducto,
        nombre: array.nombre,
        descripcion: array.descripcion,
        precio: array.precio,
        cantidad: array.cantidad,
        subtotal: array.subtotal,
        igv: parseFloat(array.igv).toFixed(2),
        total: array.total,
        productos: array
      });

      this.productos.id = array.idProducto;
      this.productos.nombre = array.nombre;
      this.productos.precio = array.precio;
      this.selectEventProductos(this.productos);
      this.calcularTotales(array.cantidad);

    }

    this.cantidad = this.formGroup.get('cantidad');
    this.subtotal = this.formGroup.get('subtotal');

    this.funcionesService.hideLoading();
    this.pbModal = false;
  }

  selectEventProductos(event: Productos){
    if(parseInt(event.stockActual) <= parseInt(event.stockAlerta)){
      this.funcionesService.showError('El producto ' + event.nombre + ' se esta quedando sin stock.');
      this.formGroup.get('idProducto').setValue('0');
    }

    this.formGroup.get('idProducto').setValue(event.id);
    this.formGroup.get('nombre').setValue(event.nombre);
    this.formGroup.get('precio').setValue(event.precio);
    this.formGroup.get('total').setValue((1 * parseFloat(this.formGroup.get("precio").value)).toFixed(2));
    this.formGroup.get("subtotal").setValue(((parseFloat(this.formGroup.get("total").value) / 1.18)).toFixed(2));
    this.formGroup.get("igv").setValue((parseFloat(this.formGroup.get("total").value) - parseFloat(this.formGroup.get("subtotal").value)).toFixed(2));
  }

  cargarProductos(){
    this.productosService.cargarProductosVentas(this.puntoVentas.id).subscribe(response => {
      this.cboProductos = response.productos;
    });
  }

  saveItems(form: FormGroup){

    if (form.invalid) {
      this.funcionesService.showError('Información incorrecta o incompleta');

    }else{
      this.pbModal = true;
      this.funcionesService.showLoading();

      let vfbModal = this.formGroup.value;
      this.detalles.idProducto = vfbModal.idProducto;
      this.detalles.nombre = vfbModal.nombre;
      this.detalles.descripcion =  vfbModal.descripcion;
      this.detalles.precio = vfbModal.precio;
      this.detalles.cantidad = vfbModal.cantidad;
      this.detalles.subtotal = vfbModal.subtotal;
      this.detalles.igv = this.formGroup.get("igv").value;
      this.detalles.total = this.formGroup.get("total").value;
      this.detalles.porcentajeDesc = vfbModal.porcentajeDesc == null ? 0.00 : vfbModal.porcentajeDesc;
      this.detalles.montoDesc = vfbModal.montoDesc == null ? 0.00 : vfbModal.montoDesc;
      this.detalles.status = 1;

      if(parseInt(this.detalles.cantidad) === 0){
        this.funcionesService.showError('La cantidad no puede ser 0');
      }else{
        const oReturn: any = new Object();
        oReturn['modal'] = 'items';
        oReturn['value'] = 'loadAgain';
        oReturn['opcion'] = this.fromParent.opcion;
        oReturn['items'] = this.detalles;

        this.new_Modal();
        this.activeModal.close(oReturn);

        this.funcionesService.showLoading();
        this.pbModal = false;
        return;
      }
    }

  }

  calcularTotales(value: any){
    if(value !== ''){
      this.formGroup.get("subtotal").setValue(((parseFloat(value) * parseFloat(this.formGroup.get("precio").value))/1.18).toFixed(2));
      this.formGroup.get("igv").setValue((this.formGroup.get("subtotal").value * 0.18).toFixed(2));
      this.formGroup.get("total").setValue((parseFloat(this.formGroup.get("subtotal").value) + parseFloat(this.formGroup.get("igv").value)).toFixed(2));
    }
  }

}
