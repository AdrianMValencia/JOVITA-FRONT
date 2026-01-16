import { Component, Input, OnInit } from '@angular/core';
import { OrdenRequerimiento } from '../../orden-requerimiento/model/ordenRequerimiento';
import { Productos } from 'src/app/modulos/almacen/productos/model/productos';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Usuarios } from 'src/app/modulos/Usuarios/models/Usurarios';
import { MatTableDataSource } from '@angular/material/table';
import { OrdenRequerimientoDetalles } from '../../orden-requerimiento/model/ordenRequerimientoDetalles';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { OrdenRequerimientoService } from '../../orden-requerimiento/service/orden-requerimiento.service';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
declare var $: any;

@Component({
  selector: 'app-modal-validacion-pedido',
  templateUrl: './modal-validacion-pedido.component.html',
})
export class ModalValidacionPedidoComponent implements OnInit {

@Input() fromParent: any;

  ordenRequerimiento: OrdenRequerimiento = new OrdenRequerimiento(0, '', '', '0', '', '', '', true, '', '', '');
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

  displayedColumns: string[] = [ 'codigoBarra', 'nombre', 'precioCompra', 'tipoPresentacion', 'cantidadPaquetes', 'cantidad', 'total', 'existencia'];
  dataSource: MatTableDataSource<OrdenRequerimientoDetalles> = new MatTableDataSource<OrdenRequerimientoDetalles>();
  items: OrdenRequerimientoDetalles = new OrdenRequerimientoDetalles(0, '', '', '', '', '', '', '', '');
  opcion: number = 1;
  detalles: OrdenRequerimientoDetalles[] = [];
  indexEliminar: number = 0;

  constructor(
    public ordenRequerimientoService: OrdenRequerimientoService,
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
      puntoventa: ['', [Validators.required]],
      idPuntoVentaLlegada: [''],
      puntoVentaLlegada: [''],
      idUsuario: ['', [Validators.required]],
      vendedor: ['', [Validators.required]],
      total: ['', [Validators.required, Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      observaciones: [''],
      status: [true],
      estadoActual: '1',
      puntoventas: '',
      usuarios: ''
    });
  }

  get getModal() { return this.formGroup.controls; }

  ngOnInit() {
    $("#codigoBarra").focus();
    const opc = this.fromParent.opcion;
    const array = this.fromParent.ordenRequerimiento;
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
        estadoActual: array.estadoActual,
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

      this.titulo = 'Modificar Orden de Requerimiento ' + array.id.toString().padStart(4, '0');

      if(array.detalles !== null){
        this.detalles = array.detalles;

        let total: any = 0;
        this.detalles.forEach(element => {
          total = parseFloat(total) + parseFloat(element.total);
        });
        this.formGroup.get('total').setValue(total);
        this.dataSource = new MatTableDataSource<OrdenRequerimientoDetalles>(this.detalles);
      }
    }else{
       this.titulo = 'Agregar Orden de Requerimiento';
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

  calcular(detalle:OrdenRequerimientoDetalles){
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

  calcularPaquetes(detalle:OrdenRequerimientoDetalles){
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
