import { Component, OnInit } from '@angular/core';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { Abastecimiento } from './models/abastecimiento';
import { Productos } from '../productos/model/productos';
import { ProductosService } from '../productos/service/Productos.service';
import { PuntosventaService } from '../../mantenimientos/puntosventa/service/puntosventa.service';
import { AbastacimientoService } from './service/abastacimiento.service';
import { MatTableDataSource } from '@angular/material/table';
declare var $: any;

@Component({
  selector: 'app-abastecimiento',
  templateUrl: './abastecimiento.component.html',
  providers: [ProductosService, PuntosventaService, AbastacimientoService]
})
export class AbastecimientoComponent implements OnInit{

  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  selectedRowIndex: any;

  productosLista: Productos[] = [];
  //Combos
  cboPuntoVenta: PuntosVenta[] = [];

  displayedColumns: string[] = ['codigoBarra', 'puntoVenta', 'nombre', 'precioCompra', 'stockActual', 'puntoVentaNew', 'cantidad', 'stockEnviar', 'total', 'acciones'];
  dataSource: MatTableDataSource<Abastecimiento> = new MatTableDataSource<Abastecimiento>();
  abastecimientos: Abastecimiento[] = [];
  numeroEnvio: string | any;

  constructor(
    public funcionesService: FuncionesService,
    private productosService: ProductosService,
    private abastecimientoService: AbastacimientoService,
    private puntosVentaService: PuntosventaService
  ){}

  ngOnInit(): void {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.cargarProductos();
    this.cargarPuntoVenta();
    $("#codigoBarra").focus();
    this.cargarNumeroEnvio();
  }

  cargarNumeroEnvio(){
    this.abastecimientoService.cargarNumeroEnvio(this.puntoVentas.id).subscribe(response => {
      this.numeroEnvio = response.numeroEnvio;
    });
  }

  selectGeneralPuntoVenta(event: any){
    if(parseInt(event.value) > 0){
      if(this.dataSource.filteredData.length > 0){
        let lista: PuntosVenta[] = this.cboPuntoVenta.filter(x => parseInt(x.id) === parseInt(event.value));
        let producto: Productos[] = [];
        this.productosService.cargarProductosVentas(event.value).subscribe(response => {
          producto = response.productos;
          this.dataSource.filteredData.forEach(element => {
            element.idPuntoVentaNew = event.value;
            element.puntoVentaNew = lista[0].nombre;
            element.stockEnviar = producto[0].stockActual;
            element.numeroEnvio = this.numeroEnvio;
          });

          if(lista.length > 0){
            this.abastecimientos.forEach((element, index) => {
              element.puntoVentaNew = lista[0].nombre;
              element.stockEnviar = producto[0].stockActual;
              element.numeroEnvio = this.numeroEnvio;
            });
          }
        });
      }else{
        this.funcionesService.showInfo('No se encontraron productos en la tabla');
      }
    }
  }

  selectEventPuntoVenta(event: any, indice: number){
    let lista: PuntosVenta[] = this.cboPuntoVenta.filter(x => parseInt(x.id) === parseInt(event.value));
    let producto: Productos[] = [];
    this.productosService.cargarProductosVentas(event.value).subscribe(response => {
      producto = response.productos;
      if(lista.length > 0){
        this.abastecimientos.forEach((element, index) => {
           if(indice === index){
            element.puntoVentaNew = lista[0].nombre;
            element.stockEnviar = producto[0].stockActual;
            element.numeroEnvio = this.numeroEnvio;
           }
        });
      }
    });
  }

  selectEventProductos(event: Productos){

    let productosLista: Productos[] = this.productosLista;
    productosLista = productosLista.filter(x => x.nombre === event.nombre && parseInt(x.idPuntoVenta) === this.puntoVentas.id);
    if(productosLista.length > 0){
      let productos: Productos = productosLista[0];
      // let productos: Productos = response.productos;
      this.selectedRowIndex = productos.codigoBarra;

      this.abastecimientos.push({
        idPuntoVenta: this.puntoVentas.id,
        puntoVenta: this.puntoVentas.nombre,
        idProducto: productos.id,
        nombre: productos.nombre,
        precioCompra: productos.precioCompra,
        stockActual: productos.stockActual,
        codigoBarra: productos.codigoBarra,
        idPuntoVentaNew: 0,
        puntoVentaNew: '',
        cantidad: 1
      });

      this.dataSource = new MatTableDataSource<Abastecimiento>(this.abastecimientos);
      $("#codigoBarra").focus();
      $("#codigoBarra").val('');
    }
  }

  cargarProductos(){
    this.funcionesService.showLoading();
    this.productosService.cargarProductosVentas(this.puntoVentas.id).subscribe(response => {
      this.funcionesService.hideLoading();
      this.productosLista = response.productos;
      this.productosLista = this.productosLista.filter(x => parseInt(x.status) === 1);
    });
  }

  cargarPuntoVenta(){
    this.funcionesService.showLoading();
    this.puntosVentaService.cargarPuntosVentaAbastecimiento(this.puntoVentas.id).subscribe(response => {
      this.funcionesService.hideLoading();
      this.cboPuntoVenta = response.puntosVenta;
      this.cboPuntoVenta = this.cboPuntoVenta.filter(x => parseInt(x.status) === 1);
    });
  }

  onEnter(event: any){

  // this.productosService.obtenerProductosCodigoBarra(codigoBarra, this.puntoVentas.id).subscribe(response => {
    if(event.value !== ''){
      let productosLista: Productos[] = this.productosLista;
      productosLista = productosLista.filter(x => x.codigoBarra === event.value && parseInt(x.idPuntoVenta) === this.puntoVentas.id);
      if(productosLista.length > 0){
        let productos: Productos = productosLista[0];
        // let productos: Productos = response.productos;
        this.selectedRowIndex = productos.codigoBarra;

        this.abastecimientos.push({
          idPuntoVenta: this.puntoVentas.id,
          puntoVenta: this.puntoVentas.nombre,
          idProducto: productos.id,
          nombre: productos.nombre,
          precioCompra: productos.precioCompra,
          stockActual: productos.stockActual,
          codigoBarra: productos.codigoBarra,
          idPuntoVentaNew: 0,
          puntoVentaNew: '',
          cantidad: 1
        });

        this.dataSource = new MatTableDataSource<Abastecimiento>(this.abastecimientos);
        $("#codigoBarra").focus();
        $("#codigoBarra").val('');
      }
    }
  // });
  }

  validarCantidad(event: any, element: Abastecimiento){
    element.total = parseFloat(event.value) * parseFloat(element.precioCompra);

    if(parseFloat(event.value) > parseFloat(element.stockActual)){
      this.funcionesService.showError('La cantidad ha enviar no puede ser mayor que la stock actual');
      element.cantidad = '';
    }
  }

  agregarAbastecimiento(): any{
    if(this.abastecimientos.length === 0){
      this.funcionesService.showError('Ingrese un producto');
      return false;
    }

    let contador : number = 0;
    let totalGeneral: any = "0";

    this.abastecimientos.forEach((element: Abastecimiento, index: number) => {
        if(parseInt(element.idPuntoVentaNew) === 0){
           this.funcionesService.showError('Seleccione el nuevo punto de venta ha asignar en la fila: ' + (index + 1));
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

        totalGeneral = parseFloat(totalGeneral) + parseFloat(element.total);
    });

    this.abastecimientos[0].totalGeneral = parseFloat(totalGeneral).toFixed(2);

    if(contador === 0){
      this.funcionesService.mensajeConfirmar('¿Desea asignar este producto?', '', (result: any) => {
       if(result.isConfirmed){
        this.funcionesService.showLoading();
        this.abastecimientoService.crudAbastecimiento(this.abastecimientos).subscribe(response => {
          if(response.status === 200 && response.error === 0){
            this.funcionesService.showSuccess(response.message);
            this.abastecimientos = [];
            this.dataSource = new MatTableDataSource<Abastecimiento>(this.abastecimientos);
            this.cargarNumeroEnvio();
            $("#codigoBarra").focus();
            $("#codigoBarra").val('');
            this.funcionesService.hideLoading();
          }else{
            this.funcionesService.showError(response.message);
            this.funcionesService.hideLoading();
          }
        });
       }
      },(error: any) => {
        this.funcionesService.showError(error.message);
        this.funcionesService.hideLoading();
      });
    }
  }

  eliminarItem(index: number){
    this.funcionesService.mensajeConfirmar('', '¿Desea quitar este producto de la lista?', (result: any) => {
      if (result.isConfirmed) {
        this.abastecimientos.splice(index, 1);

        this.dataSource = new MatTableDataSource<Abastecimiento>(this.abastecimientos);
        $("#codigoBarra").focus();
        $("#codigoBarra").val('');
      }
    });
  }

}
