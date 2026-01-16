import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { User } from 'src/app/modulos/Seguridad/models/User';
import { Productos } from 'src/app/modulos/almacen/productos/model/productos';
import { ProductosService } from 'src/app/modulos/almacen/productos/service/Productos.service';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

import { ProductosFaltantes } from '../models/productosFaltantes';
import { ProductosFaltantesService } from '../service/productosFaltantes.service';
declare var $: any;

@Component({
  selector: 'app-crudProductosfaltantes',
  templateUrl: './crudProductosfaltantes.component.html',
  providers: [ProductosFaltantesService, ProductosService]
})
export class CrudProductosfaltantesComponent implements OnInit {

  productosFaltantes: ProductosFaltantes = new ProductosFaltantes(0, '', '', '', '', '', '', '', '', '', '', '', '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  usuarioStorage: string | any = localStorage.getItem('usuario');
  usuarios: User = JSON.parse(this.usuarioStorage);

  cboProductos: Productos[] = [];
  idProductosFaltantes: number = 0;

  constructor(
    private productosFaltantesService: ProductosFaltantesService,
    private productosService: ProductosService,
    private funcionesService: FuncionesService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit() {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.productosFaltantes.idPuntoVenta = this.puntoVentas.id;
    this.productosFaltantes.puntoVenta = this.puntoVentas.nombre;
    this.productosFaltantes.idUsuario = this.usuarios.id;
    this.productosFaltantes.usuario = this.usuarios.nombre;

    let fecha: Date = new Date();
    this.productosFaltantes.fecha = this.funcionesService.generarFechaLocal3(fecha);
    $("#codigoBarra").focus();
    this.cargarProductos();

    this.activatedRoute.params.subscribe(parametros =>{
      this.idProductosFaltantes = parametros['id'];

      if (this.idProductosFaltantes > 0) {
        this.cargarProductosFaltantes(this.idProductosFaltantes);
      }
    });
  }

  cargarProductosFaltantes(idProductosFaltantes: number){
    this.funcionesService.showLoading();
    this.productosFaltantesService.obtenerProductosFaltantesEditar(idProductosFaltantes).subscribe(response =>{
      this.productosFaltantes = response.productosFaltantes;
      this.funcionesService.hideLoading();
    }, error =>{
      this.funcionesService.hideLoading();
    });
  }

  cargarProductos(){
    this.productosService.cargarProductosVentas(this.puntoVentas.id).subscribe(response => {
      this.cboProductos = response.productos;

      if (this.cboProductos.length > 0 && this.idProductosFaltantes > 0) {
        let productos: Productos = this.cboProductos.filter(x => parseInt(x.id) === parseInt(this.productosFaltantes.idProducto))[0];
        this.productosFaltantes.productos = productos;
      }
    });
  }

  selectEventProductos(event: Productos){
    this.productosFaltantes.idProducto = event.id;
    this.productosFaltantes.codigo = event.codigoBarra;
    this.productosFaltantes.producto = event.nombre;
    this.productosFaltantes.precioVenta = event.precio;
    this.productosFaltantes.idCategoria = event.idCategoria;
    this.productosFaltantes.categoria = event.nombreCategoria;
    this.productosFaltantes.total = (parseFloat(event.precio) * parseFloat(this.productosFaltantes.cantidad == '' ? 0 : this.productosFaltantes.cantidad)).toFixed(3);
  }

    onEnter(event: any){
      if (event.value !== '') {
        let productosLista: Productos[] = this.cboProductos;
        productosLista = productosLista.filter(x => x.codigoBarra === event.value);

        if(productosLista.length > 0){
            let productos: Productos = productosLista[0];
            if(parseFloat(productos.stockActual) > 0 && parseFloat(productos.stockActual) <= parseFloat(productos.stockAlerta)){
              this.funcionesService.showError('El producto ' + productos.nombre + ' se esta quedando sin stock. Stock Actual: ' + productos.stockActual);
              $("#codigoBarra").val('');
              $("#codigoBarra").focus();
            }

            if(parseFloat(productos.stockActual) <= 0){
              this.funcionesService.showError('El producto ' + productos.nombre + ' no tiene stock');
              $("#codigoBarra").val('');
              $("#codigoBarra").focus();
            }

            this.productosFaltantes.idProducto = productos.id;
            this.productosFaltantes.codigo = productos.codigoBarra;
            this.productosFaltantes.producto = productos.nombre;
            this.productosFaltantes.precioVenta = productos.precio;
            this.productosFaltantes.idCategoria = productos.idCategoria;
            this.productosFaltantes.categoria = productos.nombreCategoria;
            this.productosFaltantes.total = (parseFloat(productos.precio) * parseFloat(this.productosFaltantes.cantidad == '' ? 0 : this.productosFaltantes.cantidad)).toFixed(3);
        }
      }
    }

    calcularTotal(event: any){
      if (event.value !== '') {
        this.productosFaltantes.total = (parseFloat(this.productosFaltantes.precioVenta) * parseFloat(event.value)).toFixed(3);
      }
    }

    guardarRegistro(): any{
      if(this.productosFaltantes.fecha === ''){
        this.funcionesService.showError('Ingrese la fecha');
        return false;
      }
      if(this.productosFaltantes.producto === ''){
        this.funcionesService.showError('Selecciones el producto');
        return false;
      }

      this.funcionesService.mensajeConfirmar('', '¿Desea registrar el producto faltante?', (result: any) => {
        if(result.isConfirmed){

          this.funcionesService.showLoading();
          this.productosFaltantesService.crudProductosFaltantes(this.productosFaltantes).subscribe(response => {
            if (response.status === 200) {
              this.funcionesService.showSuccess(response.message);
              this.router.navigateByUrl('/compras/productos-faltantes');
              this.funcionesService.hideLoading();
              return;
            }
            else {
              this.funcionesService.showError(response.message);
              this.funcionesService.hideLoading();
              return;
            }
          }, (err: any) => {
            console.log(err);
            this.funcionesService.hideLoading();
          });
        }
      });
    }

}
