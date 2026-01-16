import { Component, OnInit, Type, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModalOptions, NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FuncionesService } from '../../../../shared/services/funciones.service';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { Productos } from 'src/app/modulos/almacen/productos/model/productos';
import { ModalPedidosProductosComponent } from '../modalPedidosProductos/modalPedidosProductos.component';
import { PedidosService } from '../service/pedidos.service';
import { Pedidos } from '../model/pedidos';
import { Usuarios } from 'src/app/modulos/Usuarios/models/Usurarios';
import { PedidosDetalles } from '../model/pedidosDetalles';
declare var $: any;

// Modals
const MODALS: { [name: string]: Type<any> } = {
  items: ModalPedidosProductosComponent
};

@Component({
  selector: 'app-modalPedidos',
  templateUrl: './modalPedidos.component.html',
  providers: [ PedidosService ]
})
export class ModalPedidosComponent implements OnInit {

  @Input() fromParent: any;

  pedidos: Pedidos = new Pedidos(0, '', '', '0', '', '', '', true, '', '', '');
  productos: Productos = new Productos(0, '', '0', '', '0', '', '', '', '', '', '', true, 1, '', '', false);
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  progressBar: boolean | any;

  // FormGroup
  formGroup: FormGroup | any;
  titulo: string = '';
  selectedRowIndex: any = 0;

  //Combos
  cboUsuarios: Usuarios[] = [];
  cboProductos: Productos[] = [];
  cboPuntoVentas: PuntosVenta[] = [];

  displayedColumns: string[] = [ 'codigoBarra', 'nombre', 'precioCompra', 'tipoPresentacion', 'cantidadPaquetes', 'cantidad', 'total', 'existencia', 'acciones'];
  dataSource: MatTableDataSource<PedidosDetalles> = new MatTableDataSource<PedidosDetalles>();
  items: PedidosDetalles = new PedidosDetalles(0, '', '', '', '', '', '', '', '');
  opcion: number = 1;
  detalles: PedidosDetalles[] = [];
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
    public pedidosService: PedidosService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private _modalService: NgbModal
  ) {
    this.new_Modal();
  }

  new_Modal() {
    this.formGroup = this.fb.group({
      id: 0,
      idPuntoVenta: ['', [Validators.required]],
      puntoventa: ['', [Validators.required]],
      idPuntoVentaLlegada: [''],
      puntoVentaLlegada: [''],
      idUsuario: ['', [Validators.required]],
      vendedor: ['', [Validators.required]],
      total: ['', [Validators.required, Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      observaciones: [''],
      status: [true],
      puntoventas: '',
      usuarios: ''
    });
  }

  get getModal() { return this.formGroup.controls; }

  ngOnInit() {
    $("#codigoBarra").focus();
    const opc = this.fromParent.opcion;
    const array = this.fromParent.pedidos;
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.formGroup.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.formGroup.get('puntoventa').setValue(this.puntoVentas.nombre);
    this.cboProductos = this.fromParent.productos;
    this.cboUsuarios = this.fromParent.usuarios;
    this.cboPuntoVentas = this.fromParent.puntoVentas;

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        idPuntoVenta: parseInt(array.idPuntoVenta),
        puntoventa: array.puntoventa,
        idPuntoVentaLlegada: array.idPuntoVentaLlegada,
        puntoVentaLlegada: array.puntoVentaLlegada,
        idUsuario: array.idUsuario,
        vendedor: array.vendedor,
        total: parseFloat(array.total).toFixed(2),
        observaciones: array.observaciones,
        status: array.status,
        created_at: array.created_at,
        usuarios: array.usuarios
      });

      let usuarios: Usuarios = new Usuarios();
      usuarios.id = array.idUsuario;
      usuarios.nombre = array.vendedor;
      this.formGroup.get('usuarios').setValue(usuarios);

      let puntoVentaLlegada: PuntosVenta = new PuntosVenta();
      puntoVentaLlegada.id = array.idPuntoVentaLlegada;
      puntoVentaLlegada.nombre = array.puntoVentaLlegada;
      this.formGroup.get('puntoventas').setValue(puntoVentaLlegada);

      this.titulo = 'Modificar Pedido ' + array.id.toString().padStart(4, '0');

      if(array.detalles !== null){
        this.detalles = array.detalles;

        let total: any = 0;
        this.detalles.forEach(element => {
          total = parseFloat(total) + parseFloat(element.total);
        });
        this.formGroup.get('total').setValue(total);
        this.dataSource = new MatTableDataSource<PedidosDetalles>(this.detalles);
      }
    }else{
       this.titulo = 'Agregar Pedido';
    }
  }

  selectEventUsuarios(event: Usuarios){
    this.formGroup.get('idUsuario').setValue(event.id);
    this.formGroup.get('vendedor').setValue(event.nombre);
  }

  selectEventPuntoVenta(puntoVenta: PuntosVenta){
    this.formGroup.get('idPuntoVentaLlegada').setValue(puntoVenta.id);
    this.formGroup.get('puntoVentaLlegada').setValue(puntoVenta.nombre);
  }

  eliminarItem(index: number){
    this.funcionesService.mensajeConfirmar('', '¿Desea quitar este producto de la lista?', (result: any) => {
      if (result.isConfirmed) {
        this.detalles.splice(index, 1);
        let total: any = 0;
        this.detalles.forEach(element => {
          total = parseFloat(total) + parseFloat(element.total);
        });
        total = parseFloat(total);
        this.formGroup.get('total').setValue(total);
        this.dataSource = new MatTableDataSource<PedidosDetalles>(this.detalles);
      }
    });
  }

  savePedidos(form: FormGroup): any {

    if (form.invalid) {
      this.funcionesService.swalError('Información incorrecta o incompleta');
    }else{
      let titulo: string = '';
      if (this.fromParent.opcion === '1' || this.fromParent.opcion === 1) {
        titulo = '¿Estas seguro de generar el Pedido?';
      }else{
        titulo = '¿Estas seguro de modificar el Pedido?';
      }

      this.funcionesService.mensajeConfirmar(titulo, '', (resultado: any): any => {
        if (resultado.isConfirmed) {

          let vfbModal = form.value;
          this.pedidos.id = vfbModal.id;
          this.pedidos.idPuntoVenta = vfbModal.idPuntoVenta == null ? '': vfbModal.idPuntoVenta;
          this.pedidos.puntoventa = vfbModal.puntoventa !== null ? vfbModal.puntoventa: '',
          this.pedidos.idPuntoVentaLlegada = vfbModal.idPuntoVentaLlegada == null ? '': vfbModal.idPuntoVentaLlegada;
          this.pedidos.puntoVentaLlegada = vfbModal.puntoVentaLlegada !== null ? vfbModal.puntoVentaLlegada: '',
          this.pedidos.idUsuario = vfbModal.idUsuario !== null ? vfbModal.idUsuario: '',
          this.pedidos.vendedor = vfbModal.vendedor !== null ? vfbModal.vendedor: '',
          this.pedidos.total = vfbModal.total !== null ? vfbModal.total: '',
          this.pedidos.observaciones = vfbModal.observaciones !== null ? vfbModal.observaciones: '',
          this.pedidos.status = vfbModal.status !== null ? vfbModal.status: '',
          this.pedidos.opcion = this.fromParent.opcion;

          let total: any = 0;
          this.detalles.forEach(element => {
            element.idPedido = parseInt(this.fromParent.pedidos.id);
            element.cantidadPaquetes = parseFloat($("#cantidadPaquetes-" + element.codigoBarra).val()).toFixed(2);
            element.cantidad = parseFloat($("#cantidad-" + element.codigoBarra).val()).toFixed(2);
            element.total = parseFloat(element.total).toFixed(2);
            total = (parseFloat(total) + parseFloat(element.total)).toFixed(2);
          });

          this.pedidos.total = total;
          this.pedidos.detalles = this.detalles;

          if(this.detalles.length === 0){
            this.funcionesService.showError('Ingrese por lo menos un producto');
            this.funcionesService.hideLoading();
            this.progressBar = false;
            return false;
          }

          this.funcionesService.showLoading();
          this.progressBar = false;
          this.pedidosService.crudPedidos(this.pedidos).subscribe((response: any) => {

            if (response.status === 200) {

              this.funcionesService.showSuccess(response.message);
              const oReturn: any = new Object();

              oReturn['modal'] = 'pedidos';
              oReturn['value'] = 'loadAgain';

              this.activeModal.close(oReturn);
              this.funcionesService.hideLoading();
              this.progressBar = false;
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

  agregarItem(){
    this.opcion = 1;
    this.openModal('items');
  }

  viewDetail(element: any, index: number) {
    this.opcion = 2;
    this.items = element;
    this.items.cantidad = $("#cantidad-" + element.codigoBarra).val();
    this.items.cantidadPaquetes = $("#cantidadPaquetes-" + element.codigoBarra).val();

    let productos: Productos = this.cboProductos.filter(x => parseInt(x.id) === parseInt(element.idProducto))[0];
    this.items.precioCompra = parseFloat(productos.precioCompra).toFixed(4);

    this.indexEliminar = index;
    this.openModal('items');
  }

  openModal(name: string) {

    const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
    const obj: any = new Object();

    switch (name) {
      case 'items':
        obj['opcion'] = this.opcion;
        obj['items'] = this.items;
        obj['productos'] = this.cboProductos;
        modalRef.componentInstance.fromParent = obj;
      break;
      case 'kilos':
        obj['productos'] = this.productos;
        modalRef.componentInstance.fromParent = obj;
      break;
    }

    modalRef.result.then(async (result) => {

      switch (result.modal) {
        case 'items':
          this.funcionesService.showLoading();
          this.progressBar = true;
          if (result.value === 'loadAgain') {

            if(parseInt(result.opcion) === 1){
              this.detalles.push({
                id: result.items.id,
                idPedido: this.fromParent.pedidos.id,
                idProducto: result.items.idProducto,
                nombre: result.items.nombre,
                codigoBarra: result.items.codigoBarra,
                precioCompra: parseFloat(result.items.precioCompra).toFixed(2),
                tipoPresentacion: result.items.tipoPresentacion,
                cantidadPaquetes: result.items.cantidadPaquetes,
                cantidad: result.items.cantidad,
                total: result.items.total,
                existencia: result.items.existencia
              });
            }

            if(parseInt(result.opcion) === 2){
              this.detalles.forEach((element, index) => {
                if(index === this.indexEliminar){
                  element.id = result.items.id,
                  element.idPedido = this.fromParent.pedidos.id;
                  element.idProducto = result.items.idProducto,
                  element.nombre = result.items.nombre,
                  element.codigoBarra = result.items.codigoBarra,
                  element.precioCompra = result.items.precioCompra,
                  element.tipoPresentacion = result.items.tipoPresentacion,
                  element.cantidadPaquetes = result.items.cantidadPaquetes,
                  element.cantidad = result.items.cantidad,
                  element.total = result.items.total,
                  element.existencia = result.items.stockActual
                }
              });
            }

            if(parseInt(result.opcion) === 3){
              this.detalles.splice(this.indexEliminar, 1);
            }

            let total: any = 0;
            this.detalles.forEach(element => {
              total = parseFloat(total) + parseFloat(element.total);
            });
            this.formGroup.get('total').setValue(total);
            this.dataSource = new MatTableDataSource<PedidosDetalles>(this.detalles);
          }

          this.funcionesService.hideLoading();
          this.progressBar = false;
          break;
      }

    }, (reason) => { });
  }

  onEnter(event: any){

    if (event.value !== '') {
      let productosLista: Productos[] = this.cboProductos;
      productosLista = productosLista.filter(x => x.codigoBarra === event.value && parseInt(x.idPuntoVenta) === this.puntoVentas.id);

      if(productosLista.length > 0){
          let productos: Productos = productosLista[0];

          let detalles: PedidosDetalles[] = [];
          detalles = this.detalles.filter(x => parseInt(x.idProducto) === parseInt(productos.id));
          this.selectedRowIndex = productos.codigoBarra;

          if(detalles.length === 0){
            this.detalles.push({
              idPedido: 0,
              idProducto: productos.id,
              codigoBarra: productos.codigoBarra,
              nombre: productos.nombre,
              precioCompra: parseFloat(productos.precioCompra).toFixed(4),
              tipoPresentacion: 'UND',
              cantidadPaquetes: 0,
              cantidad: 1,
              total: parseFloat(productos.precioCompra) * 1,
              existencia: parseFloat(productos.stockActual).toFixed(4)
            });
          }else{

            this.detalles.forEach(element => {
              if(element.idProducto === productos.id){
                element.cantidad = 1 + parseFloat(element.cantidad);
                element.total = (element.cantidad * parseFloat(productos.precioCompra)).toFixed(4);
                element.existencia = parseFloat(productos.stockActual).toFixed(4),
                element.precioCompra = parseFloat(productos.precioCompra).toFixed(4)
              }
            });
          }

          $("#codigoBarra").val('');
          this.dataSource = new MatTableDataSource<PedidosDetalles>(this.detalles);

          let total: any = 0;
          this.detalles.forEach(element => {
            total += parseFloat(element.total);
          });
          this.formGroup.get("total").setValue(parseFloat(total).toFixed(2));
      }
    }
  }

  habilitarPaquete(event: any, element: PedidosDetalles){
    if (event.value === 'UND') {
      $("#cantidadPaquetes-" + element.codigoBarra).attr('readonly', true);
      element.cantidadPaquetes = '0';
      element.total = (parseFloat($("#cantidad-" + element.codigoBarra).val()) * parseFloat(element.precioCompra)).toFixed(2);

      let total: any = 0;
      this.detalles.forEach(element => {
        total += parseFloat(element.total);
      });

      this.formGroup.get("total").setValue(parseFloat(total).toFixed(2));
    }else{
      $("#cantidadPaquetes-" + element.codigoBarra).attr('readonly', false);
    }
  }

  calcular(detalle:PedidosDetalles){
    let productosLista: Productos[] = this.cboProductos;
    productosLista = productosLista.filter(x => x.codigoBarra === detalle.codigoBarra && parseInt(x.idPuntoVenta) === this.puntoVentas.id);
    let productos: Productos = productosLista[0];
    let stockActual: any = parseFloat(productos.stockActual) - parseFloat($("#cantidad-" + detalle.codigoBarra).val());

    if(parseInt(stockActual) > 0 && parseInt(stockActual) <= parseInt(productos.stockAlerta)){
      this.funcionesService.showError('El producto ' + productos.nombre + ' se esta quedando sin stock. Stock Actual: ' + productos.stockActual);
    }

    this.detalles.forEach(element => {
      if(element.idProducto === productos.id){
        if ($("#tipoPresentacion-" + detalle.codigoBarra).val() === 'UND') {
          element.total = (parseFloat($("#cantidad-" + detalle.codigoBarra).val()) * parseFloat(detalle.precioCompra)).toFixed(2);
        }else{
          element.total = ((parseFloat($("#cantidad-" + detalle.codigoBarra).val()) * parseFloat($("#cantidadPaquetes-" + detalle.codigoBarra).val())) * parseFloat(detalle.precioCompra)).toFixed(2);
        }
      }
    });

    let total: any = 0;
      this.detalles.forEach(element => {
        total += parseFloat(element.total);
      });

      this.formGroup.get("total").setValue(parseFloat(total).toFixed(2));
  }

  calcularPaquetes(detalle:PedidosDetalles){
    let productosLista: Productos[] = this.cboProductos;
    productosLista = productosLista.filter(x => x.codigoBarra === detalle.codigoBarra && parseInt(x.idPuntoVenta) === this.puntoVentas.id);
    let productos: Productos = productosLista[0];
    let stockActual: any = parseFloat(productos.stockActual) - parseFloat($("#cantidad-" + detalle.codigoBarra).val());

    if(parseInt(stockActual) > 0 && parseInt(stockActual) <= parseInt(productos.stockAlerta)){
      this.funcionesService.showError('El producto ' + productos.nombre + ' se esta quedando sin stock. Stock Actual: ' + productos.stockActual);
    }

    this.detalles.forEach(element => {
      if(element.idProducto === productos.id){
        element.total = ((parseFloat($("#cantidad-" + detalle.codigoBarra).val()) * parseFloat($("#cantidadPaquetes-" + detalle.codigoBarra).val())) * parseFloat(detalle.precioCompra)).toFixed(2);
      }
    });

    let total: any = 0;
      this.detalles.forEach(element => {
        total += parseFloat(element.total);
      });

      this.formGroup.get("total").setValue(parseFloat(total).toFixed(2));
  }

}
