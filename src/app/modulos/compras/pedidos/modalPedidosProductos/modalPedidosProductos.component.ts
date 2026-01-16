import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { FuncionesService } from '../../../../shared/services/funciones.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Productos } from 'src/app/modulos/almacen/productos/model/productos';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { PedidosDetalles } from '../model/pedidosDetalles';
import { Usuarios } from 'src/app/modulos/Usuarios/models/Usurarios';

@Component({
  selector: 'app-modalPedidosProductos',
  templateUrl: './modalPedidosProductos.component.html',
})
export class ModalPedidosProductosComponent implements OnInit {

  @Input() fromParent: any;

  detalles: PedidosDetalles = new PedidosDetalles(0, '', '', '', '', '', '', '', '', '', '');
  productos: Productos = new Productos();
  usuarios: Usuarios = new Usuarios();
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  readonly: boolean = true;

  cantidad: any = 0;
  cantidadPaquetes: any = 0;
  subTotal: any = 0;

  // Progress Bar
  progressBar: boolean | any;

  // FormGroup
  formGroup: FormGroup | any;

  //Combos
  cboProductos: Productos[] = [];

  constructor(
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal
  ) {
    this.new_Modal();
  }

  new_Modal() {
    this.formGroup = this.fb.group({
      id: 0,
      idPedido: 0,
      idProducto: ['', [Validators.required]],
      nombre: ['', [Validators.required]],
      codigoBarra: ['', [Validators.required]],
      precioCompra: ['', [Validators.required, Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      tipoPresentacion: ['0', [Validators.required]],
      cantidadPaquetes: ['', [Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      cantidad: ['', [Validators.required, Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      total: ['', [Validators.required, Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      existencia: [''],
      productos: ''
    });
  }

  get getModal() { return this.formGroup.controls; }

  ngOnInit() {
    const opc = this.fromParent.opcion;
    const array = this.fromParent.items;
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.cboProductos = this.fromParent.productos;
    this.formGroup.get('cantidadPaquetes').setValue(0);
    this.formGroup.get('tipoPresentacion').setValue('0');

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        idPedido: array.idPedido,
        idProducto: array.idProducto,
        nombre: array.nombre,
        codigoBarra: array.codigoBarra,
        precioCompra: parseFloat(array.precioCompra == undefined ? 0.00 : array.precioCompra).toFixed(4),
        tipoPresentacion: parseFloat(array.tipoPresentacion).toFixed(4),
        cantidadPaquetes: parseFloat(array.cantidadPaquetes).toFixed(4),
        cantidad: parseFloat(array.cantidad).toFixed(4),
        total: parseFloat(array.total).toFixed(4),
        existencia: parseFloat(array.existencia).toFixed(4),
        productos: array
      });

      this.productos.id = array.idProducto;
      this.productos.nombre = array.nombre;
      this.productos.precio = parseFloat(array.precioVenta).toFixed(4);
      this.productos.codigoBarra = array.codigoBarra;
      this.productos.precioCompra = parseFloat(array.precioCompra).toFixed(4);
      this.selectEventProductos(this.productos);
      this.calcularTotales(array.cantidad);

      this.usuarios.id = array.idUsuario;
      this.usuarios.nombre = array.vendedor;
      this.selectEventUsuarios(this.usuarios);
    }

    this.formGroup.get('idPedido').setValue(array.idPedido);
    this.cantidad = this.formGroup.get('cantidad');
    this.cantidadPaquetes = this.formGroup.get('cantidadPaquetes');
  }

  selectEventUsuarios(event: Usuarios){
    this.formGroup.get('idUsuario').setValue(event.id);
    this.formGroup.get('vendedor').setValue(event.nombre);
  }

  calcularPaquete(event: any){
    if (event.value === 'UND') {
      this.readonly = true;
    }else if (event.value === 'PQTE') {
      this.readonly = false;
    }
  }

  selectEventProductos(event: Productos){
    this.formGroup.get('idProducto').setValue(event.id);
    this.formGroup.get('nombre').setValue(event.nombre);
    this.formGroup.get('codigoBarra').setValue(event.codigoBarra);

    this.formGroup.get('precioCompra').setValue(event.precioCompra == null ? 0.0000 : parseFloat(event.precioCompra).toFixed(4));
    this.formGroup.get('existencia').setValue(event.stockActual == null ? 0.0000 : parseFloat(event.stockActual).toFixed(4));
  }

  saveItems(form: FormGroup){

    if (form.invalid) {
      this.funcionesService.swalError('Información incorrecta o incompleta');
    }else{

      let vfbModal = this.formGroup.value;
      this.detalles.id = vfbModal.id;
      this.detalles.idPedido = vfbModal.idPedido;
      this.detalles.idProducto = vfbModal.idProducto;
      this.detalles.nombre =  this.formGroup.get("nombre").value;
      this.detalles.codigoBarra = vfbModal.codigoBarra;
      this.detalles.precioCompra = parseFloat(vfbModal.precioCompra).toFixed(4);
      this.detalles.tipoPresentacion = vfbModal.tipoPresentacion;
      this.detalles.cantidadPaquetes = vfbModal.cantidadPaquetes;
      this.detalles.cantidad = vfbModal.cantidad;
      this.detalles.total = this.formGroup.get("total").value;
      this.detalles.existencia = parseFloat(vfbModal.existencia).toFixed(4);

      const oReturn: any = new Object();
      oReturn['modal'] = 'items';
      oReturn['value'] = 'loadAgain';
      oReturn['opcion'] = this.fromParent.opcion;
      oReturn['items'] = this.detalles;
      this.new_Modal();
      this.activeModal.close(oReturn);
    }
  }

  calcularTotales(value: any){
    if(value !== ''){
      if(this.formGroup.get("tipoPresentacion").value === "UND"){
        this.formGroup.get("total").setValue((parseFloat(value) * parseFloat(this.formGroup.get("precioCompra").value == '' ? 0 : this.formGroup.get("precioCompra").value)).toFixed(4));
      }else{
        this.formGroup.get("total").setValue(((parseFloat(value) * parseFloat(this.formGroup.get("cantidadPaquetes").value)) * parseFloat(this.formGroup.get("precioCompra").value == '' ? 0 : this.formGroup.get("precioCompra").value)).toFixed(4));
      }
    }
  }

  calcularTotalesPaquete(value: any){
    if(value !== ''){
      this.formGroup.get("total").setValue(((parseFloat(value) * parseFloat(this.formGroup.get("cantidad").value)) * parseFloat(this.formGroup.get("precioCompra").value == '' ? 0 : this.formGroup.get("precioCompra").value)).toFixed(4));
    }
  }

}
