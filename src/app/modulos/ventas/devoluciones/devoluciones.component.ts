import { Component, OnInit } from '@angular/core';
declare const require: any;
import { ProductosService } from '../../almacen/productos/service/Productos.service';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { Productos } from '../../almacen/productos/model/productos';
import { MatTableDataSource } from '@angular/material/table';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { PuntosventaService } from '../../mantenimientos/puntosventa/service/puntosventa.service';
import { DevolucionesService } from './service/devoluciones.service';
import { Devoluciones } from './models/devoluciones';
declare var $: any;

@Component({
  selector: 'app-devoluciones',
  templateUrl: './devoluciones.component.html',
  providers: [ProductosService, PuntosventaService, DevolucionesService]
})
export class DevolucionesComponent implements OnInit {
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  selectedRowIndex: any;
  productosLista: Productos[] = [];
  //Combos
  cboPuntoVenta: PuntosVenta[] = [];

  displayedColumns: string[] = ['codigoBarra', 'puntoVenta', 'nombre', 'stockActual', 'puntoVentaNew', 'cantidad', 'motivo'];
  dataSource: MatTableDataSource<Devoluciones> = new MatTableDataSource<Devoluciones>();
  devoluciones: Devoluciones[] = [];

  constructor(
    public funcionesService: FuncionesService,
    private productosService: ProductosService,
    private devolucionesService: DevolucionesService,
    private puntosVentaService: PuntosventaService
  ){}

  ngOnInit(): void {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.cargarProductos();
    this.cargarPuntoVenta();
    $("#codigoBarra").focus();
  }

  selectEventPuntoVenta(event: any, indice: number){
    let lista: PuntosVenta[] = this.cboPuntoVenta.filter(x => parseInt(x.id) === parseInt(event.value));
    if(lista.length > 0){
      this.devoluciones.forEach((element, index) => {
         if(indice === index){
          element.puntoVentaNew = lista[0].nombre;
         }
      });
    }
  }

  cargarProductos(){
    this.funcionesService.showLoading();
    this.productosService.cargarProductosVentas(this.puntoVentas.id).subscribe(response => {
      this.funcionesService.hideLoading();
      this.productosLista = response.productos;
    });
  }

  cargarPuntoVenta(){
    this.puntosVentaService.cargarPuntosVentaDevoluciones(this.puntoVentas.id).subscribe(response => {
      this.cboPuntoVenta = response.puntosVenta;
      this.cboPuntoVenta = this.cboPuntoVenta.filter(x => parseInt(x.status) === 1);
    });
  }

  onEnter(event: any){

  // this.productosService.obtenerProductosCodigoBarra(codigoBarra, this.puntoVentas.id).subscribe(response => {

  let productosLista: Productos[] = this.productosLista;
    productosLista = productosLista.filter(x => x.codigoBarra === event.value && parseInt(x.idPuntoVenta) === this.puntoVentas.id);

    if(productosLista.length > 0){
      let productos: Productos = productosLista[0];
      // let productos: Productos = response.productos;
      this.selectedRowIndex = productos.codigoBarra;

      this.devoluciones.push({
        idPuntoVenta: this.puntoVentas.id,
        puntoVenta: this.puntoVentas.nombre,
        idProducto: productos.id,
        nombre: productos.nombre,
        stockActual: productos.stockActual,
        codigoBarra: productos.codigoBarra,
        idPuntoVentaNew: 0,
        puntoVentaNew: '',
        cantidad: 1
      });

      this.dataSource = new MatTableDataSource<Devoluciones>(this.devoluciones);
      $("#codigoBarra").focus();
      $("#codigoBarra").val('');
    }
  // });
  }

  onBuscar(event: Productos){
    let productosLista: Productos[] = this.productosLista;
      productosLista = productosLista.filter(x => parseInt(x.id) === event.id && parseInt(x.idPuntoVenta) === this.puntoVentas.id);

      if(productosLista.length > 0){
        let productos: Productos = productosLista[0];
        // let productos: Productos = response.productos;
        this.selectedRowIndex = productos.codigoBarra;

        this.devoluciones.push({
          idPuntoVenta: this.puntoVentas.id,
          puntoVenta: this.puntoVentas.nombre,
          idProducto: productos.id,
          nombre: productos.nombre,
          stockActual: productos.stockActual,
          codigoBarra: productos.codigoBarra,
          idPuntoVentaNew: 0,
          puntoVentaNew: '',
          cantidad: 1
        });

        this.dataSource = new MatTableDataSource<Devoluciones>(this.devoluciones);
      }
    }

  agregarDevoluciones(): any{
    if(this.devoluciones.length === 0){
      this.funcionesService.showError('Ingrese un producto');
      return false;
    }

    let contador : number = 0;
    this.devoluciones.forEach((element: any, index: number) => {
        if(parseInt(element.idPuntoVentaNew) === 0){
           this.funcionesService.showError('Seleccione el punto de venta ha devolver en la fila: ' + (index + 1));
           contador = contador + 1;
        }
        if(element.cantidad === ''){
          this.funcionesService.showError('Ingrese una cantidad válida en la fila: ' + (index + 1));
          contador = contador + 1;
        }
        if(parseInt(element.cantidad) === 0){
          this.funcionesService.showError('La cantidad no puede ser 0 en la fila: ' + (index + 1));
          contador = contador + 1;
        }
    });

    if(contador === 0){
      this.funcionesService.mensajeConfirmar('¿Desea devolver este producto?', '', (result: any) => {
       if(result.isConfirmed){
        this.funcionesService.showLoading();
        this.devolucionesService.crudDevoluciones(this.devoluciones).subscribe(response => {
          if(response.status === 200){
            this.funcionesService.showSuccess(response.message);
            this.devoluciones = [];
            this.dataSource = new MatTableDataSource<Devoluciones>(this.devoluciones);
            $("#codigoBarra").focus();
            $("#codigoBarra").val('');
            this.funcionesService.hideLoading();
          }
        });
       }
      });
    }
  }

}
