import { Component, Input, OnInit } from '@angular/core';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Productos } from 'src/app/modulos/almacen/productos/model/productos';
import { ProductosService } from 'src/app/modulos/almacen/productos/service/Productos.service';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

import { RecibosService } from '../service/recibos.service';
declare var $: any;

@Component({
  selector: 'app-modalItemsConsultar',
  templateUrl: './modalItemsConsultar.component.html'
})
export class ModalItemsConsultarComponent implements OnInit {

 @Input() fromParent: any;

  productos: Productos = new Productos();
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  selectedRowIndex: any;

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
    });

  }

    onEnter(event: any){
      if (event.value !== '') {
        let productosLista: Productos[] = this.cboProductos;
        productosLista = productosLista.filter(x => x.codigoBarra === event.value);

        if(productosLista.length > 0){
            let productos: Productos = productosLista[0];
            this.productos = productos;

            if(parseFloat(productos.stockActual) > 0 && parseFloat(productos.stockActual) <= parseFloat(productos.stockAlerta)){
              this.funcionesService.showError('El producto ' + productos.nombre + ' se esta quedando sin stock. Stock Actual: ' + productos.stockActual);
              $("#codigoBarra").val('');
              $("#codigoBarra").focus();
            }

            if(parseFloat(productos.stockActual) <= 0){
              this.funcionesService.showError('El producto ' + productos.nombre + ' no tiene stock');
              $("#codigoBarra").val('');
              $("#codigoBarra").focus();
            }else{

              if(parseFloat(productos.stockActual) <= 0){
                this.funcionesService.showError('El producto ' + productos.nombre + ' no tiene stock.');
                this.productos.id = 0;
              }else{

                if(parseFloat(productos.stockActual) <= parseFloat(productos.stockAlerta)){
                  this.funcionesService.showError('El producto ' + productos.nombre + ' se esta quedando sin stock.');
                  this.productos.id = 0;
                }
              }

              $("#codigoBarra").focus();
              $("#codigoBarra").val('');
            }

            this.productos.id = productos.id;
            this.productos.codigoBarra = productos.codigoBarra;
            this.productos.nombre = productos.nombre;
            this.productos.precio = productos.precio;
            this.productos.observaciones = productos.observaciones;
            this.productos.stockActual = productos.stockActual;
            this.productos.nombreUm = productos.nombreUm;
            this.productos.precioMayor = productos.precioMaximo;
        }
      }
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
    }else if(parseFloat(event.stockActual) <= parseFloat(event.stockAlerta)){
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

  cargarProductos(){
    this.productosService.cargarProductosVentas(this.puntoVentas.id).subscribe(response => {
      this.cboProductos = response.productos;
    });
  }

}
