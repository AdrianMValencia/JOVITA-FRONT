import { Component, Input, OnDestroy, OnInit } from '@angular/core';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Productos } from 'src/app/modulos/almacen/productos/model/productos';
import { ProductosService } from 'src/app/modulos/almacen/productos/service/Productos.service';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

import { RecibosService } from '../service/recibos.service';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
declare var $: any;

@Component({
  selector: 'app-modalItemsConsultar',
  templateUrl: './modalItemsConsultar.component.html'
})
export class ModalItemsConsultarComponent implements OnInit, OnDestroy {

 @Input() fromParent: any;

  productos: Productos = new Productos();
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  selectedRowIndex: any;

  // Progress Bar
  progressBar: boolean | any;

  //Combos
  cboProductos: Productos[] = [];

  private readonly destroy$ = new Subject<void>();
  private readonly terminosBusqueda$ = new Subject<string>();

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

    this.terminosBusqueda$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((term) => {
          const t = (term ?? '').trim();
          if (t.length < 2) {
            this.cboProductos = [];
            return of(null);
          }
          return this.productosService.buscarProductos(this.puntoVentas.id, t, { limite: 80 });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response?.productos) {
            this.cboProductos = response.productos;
          } else {
            this.cboProductos = [];
          }
        },
        error: () => {
          this.cboProductos = [];
        }
      });

    document.addEventListener("keydown", (event: any) =>{
      if (event.code === "Escape")
      {
          event.preventDefault();
          this.activeModal.dismiss();
      }
    });

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  buscarProductos(event: any): void {
    const raw = typeof event === 'string' ? event : String(event ?? '');
    this.terminosBusqueda$.next(raw);
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
    this.productos.precioMayor = event.precioMayor;
    this.productos.precioMaximo = event.precioMaximo;
    this.productos.igv = event.igv;
  }

  cargarProductos(){
    this.productosService.cargarProductosVentas(this.puntoVentas.id).subscribe(response => {
      this.cboProductos = response.productos;
    });
  }

}
