import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { RecibosService } from '../service/recibos.service';
import { FuncionesService } from '../../../../shared/services/funciones.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { RecibosDetalles } from '../model/recibosDetalles';
import { Productos } from 'src/app/modulos/almacen/productos/model/productos';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { ProductosService } from 'src/app/modulos/almacen/productos/service/Productos.service';
import { asignarMontosDetalle, resolverCodigoAfectacionLinea } from '../utils/recibos-afectacion-igv.util';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
declare var $: any;

@Component({
  selector: 'app-modalRecibosItems',
  templateUrl: './modalRecibosItems.component.html',
  providers: [RecibosService, ProductosService]
})
export class ModalRecibosItemsComponent implements OnInit, OnDestroy {

  @Input() fromParent: any;

  detalles: RecibosDetalles = new RecibosDetalles(0, '0', '0', '', '', '', '', '', '', '', '', '', '');
  productos: Productos = new Productos();
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  /** Selector SUNAT 07 al agregar ítem (por defecto según producto.igv). */
  codigoAfectacionLinea: string = '10';

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

    if (this.fromParent?.opcion === 2 && this.fromParent?.items) {
      const it = this.fromParent.items as RecibosDetalles & { codigo_afectacion_igv?: string };
      Object.assign(this.detalles, it);
      const sn = it.codigo_afectacion_igv;
      if (sn && !this.detalles.codigoAfectacionIgv) {
        this.detalles.codigoAfectacionIgv = String(sn);
      }
      this.codigoAfectacionLinea = resolverCodigoAfectacionLinea(this.detalles, this.productos);
    }

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

  buscarProductos(event: any): void {
    const raw = typeof event === 'string' ? event : String(event ?? '');
    this.terminosBusqueda$.next(raw);
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
      this.productos.precioMayor = event.precioMayor;
      this.productos.precioMaximo = event.precioMaximo;
      this.productos.igv = event.igv;
      this.codigoAfectacionLinea = resolverCodigoAfectacionLinea({}, event);
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
    this.detalles.existencia = parseFloat(String(this.productos.stockActual)) - 1;
    this.detalles.totalDesc = this.detalles.totalDesc == null ? 0.00 : this.detalles.totalDesc;

    this.detalles.codigoAfectacionIgv = this.codigoAfectacionLinea || resolverCodigoAfectacionLinea({}, this.productos);
    asignarMontosDetalle(
      this.detalles,
      1,
      parseFloat(String(this.productos.precio)),
      this.productos
    );

    if(parseFloat(String(this.detalles.cantidad)) === 0){
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
    this.productosService.cargarProductosVentas(this.puntoVentas.id).subscribe(response => {
      this.cboProductos = response.productos;
      if (this.fromParent?.opcion === 2 && this.fromParent?.items) {
        const id = (this.fromParent.items as RecibosDetalles).idProducto;
        const p = this.cboProductos.find(
          (x) => parseInt(String(x.id), 10) === parseInt(String(id), 10)
        );
        if (p) {
          this.productos = p;
          this.codigoAfectacionLinea = resolverCodigoAfectacionLinea(this.detalles, this.productos);
        }
      }
    });
  }

  calcularTotales(value: any){
    const q = parseFloat(String(value)) || 0;
    this.detalles.codigoAfectacionIgv = this.codigoAfectacionLinea;
    asignarMontosDetalle(
      this.detalles,
      q,
      parseFloat(String(this.productos.precio)),
      this.productos
    );
  }
}
