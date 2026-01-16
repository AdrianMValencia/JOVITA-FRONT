import { Component, OnInit, Input } from '@angular/core';
import { RecibosService } from '../service/recibos.service';
import { FuncionesService } from '../../../../shared/services/funciones.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { RecibosDetalles } from '../model/recibosDetalles';
import { Productos } from 'src/app/modulos/almacen/productos/model/productos';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { ProductosService } from 'src/app/modulos/almacen/productos/service/Productos.service';
declare var $: any;

@Component({
  selector: 'app-modalRecibosItems',
  templateUrl: './modalRecibosItems.component.html',
  providers: [RecibosService, ProductosService]
})
export class ModalRecibosItemsComponent implements OnInit {

  @Input() fromParent: any;

  detalles: RecibosDetalles = new RecibosDetalles(0, '0', '0', '', '', '', '', '', '', '', '', '', '');
  productos: Productos = new Productos();
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  progressBar: boolean | any;

  //Combos
  cboProductos: Productos[] = [];

  constructor(
    public reciboService: RecibosService,
    private productosService: ProductosService,
    public funcionesService: FuncionesService,
    public activeModal: NgbActiveModal
  ) {
  }

  ngOnInit() {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    $("#nombre").focus();
    this.cargarProductos();

    document.addEventListener("keydown", (event: any) =>{
      if (event.code === "Escape")
      {
          event.preventDefault();
          this.activeModal.dismiss();
      }
      // if (event.code === "Enter")
      // {
      //     event.preventDefault();
      //     this.saveItems();
      // }
    });

  }

  buscarProductos(event: any){
    if(event !== ''){
      if(event.length === 3){
        this.funcionesService.showLoading();
        this.productosService.buscarProductos(this.puntoVentas.id, event).subscribe(response => {
          this.cboProductos = response.productos;
          this.funcionesService.hideLoading();
        });
      }
    }
  }

  selectEventProductos(event: Productos){

    if(parseFloat(event.stockActual) <= 0){
      this.funcionesService.showError('El producto ' + event.nombre + ' no tiene stock.');
      this.productos.id = 0;
    }else{

      if(parseFloat(event.stockActual) <= parseFloat(event.stockAlerta)){
        this.funcionesService.showError('El producto ' + event.nombre + ' se esta quedando sin stock.');
        this.productos.id = 0;
      }
      this.productos.id = event.id;
      this.productos.codigoBarra = event.codigoBarra;
      this.productos.nombre = event.nombre;
      this.productos.precio = event.precio;
      this.productos.observaciones = event.observaciones;
      this.productos.stockActual = event.stockActual;
      this.productos.nombreUm = event.nombreUm;
      this.productos.precioMayor = event.precioMaximo;
    }
  }

  saveItems(): any{

    if(this.productos.id === 0){
      this.funcionesService.showError('Seleccione un producto');
      return false;
    }

    this.funcionesService.showLoading();
    this.progressBar = true;

    this.detalles.idProducto = this.productos.id;
    this.detalles.codigoBarra = this.productos.codigoBarra;
    this.detalles.nombre = this.productos.nombre;
    this.detalles.detalle = this.productos.observaciones;
    this.detalles.precio = this.productos.precio;
    this.detalles.cantidad = 1.00;
    this.detalles.porcentajeDesc = 0.00;
    this.detalles.montoDesc = 0.00;
    this.detalles.existencia = parseFloat(this.productos.stockActual) - 1;
    this.detalles.totalDesc = this.detalles.totalDesc == null ? 0.00 : this.detalles.totalDesc;

    this.detalles.total = (1 * parseFloat(this.productos.precio)).toFixed(2);
    this.detalles.subtotal = (parseFloat(this.detalles.total) / 1.18).toFixed(2);
    this.detalles.igv = (parseFloat(this.detalles.total) - parseFloat(this.detalles.subtotal)).toFixed(2);

    if(parseInt(this.detalles.cantidad) === 0){
      this.funcionesService.showError('La cantidad no puede ser 0');
    }else{
      const oReturn: any = new Object();
      oReturn['modal'] = 'items';
      oReturn['value'] = 'loadAgain';
      oReturn['opcion'] = this.fromParent.opcion;
      oReturn['items'] = this.detalles;
      oReturn['productos'] = this.productos;
      this.activeModal.close(oReturn);
      this.progressBar = false;
      this.funcionesService.hideLoading();
      return;
    }
  }

  cargarProductos(){
    // let productosStorage: string | any = localStorage.getItem('productos');
    // this.cboProductos = JSON.parse(productosStorage);
    this.productosService.cargarProductosVentas(this.puntoVentas.id).subscribe(response => {
      this.cboProductos = response.productos;
    });
  }

  calcularTotales(value: any){
    this.detalles.subtotal = ((parseFloat(value) * parseFloat(this.productos.precio))/1.18).toFixed(2);
    this.detalles.igv = (this.detalles.subtotal * 0.18).toFixed(2);
    this.detalles.total = (parseFloat(this.detalles.subtotal) + parseFloat(this.detalles.igv)).toFixed(2);
  }
}
