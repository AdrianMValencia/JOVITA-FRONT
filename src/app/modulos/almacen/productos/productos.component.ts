import { Component, OnInit, Type, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

import { NgbModalOptions, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

import { Categorias } from '../categorias/model/categorias';
import { UnidadMedidas } from '../unidadmedidas/models/unidadmedidas';
import { ModalProductosComponent } from './modalProductos/modalProductos.component';
import { Productos } from './model/productos';
import { ProductosService } from './service/Productos.service';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');
import { saveAs } from 'file-saver';
import { ModalAsignarProveedoresComponent } from './modalAsignarProveedores/modalAsignarProveedores.component';
import { environment } from 'src/environments/environment.prod';
import { ModalImagenProductoComponent } from './modalImagenProducto/modalImagenProducto.component';
declare var $: any;

// Modals
const MODALS: { [name: string]: Type<any> } = {
  productos: ModalProductosComponent,
  proveedores: ModalAsignarProveedoresComponent,
  imagen: ModalImagenProductoComponent
};

@Component({
  selector: 'app-productos',
  templateUrl: './productos.component.html',
  providers: [ ProductosService ]
})
export class ProductosComponent implements OnInit {

  // FormGroup
  fgMain: FormGroup | any;

  productos: Productos = new Productos(0, '', '', '0', '', '', '0', '', '0', '', '', '', '', '', '', '', '', '', '', true, '', 1, '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  opcion: number = 0;

  // Progress Bar
  progressBar: boolean = false;

  // PRINCIPAL
  MainDC: string[] = ['categoria', 'unidadMedidas', 'nombre', 'stockActual', 'precio', 'barcode', 'proveedor', 'imagen', 'status', 'acciones'];

  MainDS: MatTableDataSource<Productos> = new MatTableDataSource<Productos>();
  @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

  NgbModalOptions: NgbModalOptions = {
    size: 'xl',
    centered: true,
    scrollable: true,
    keyboard: false,
    backdrop: 'static',
    windowClass: 'modal-holder'
  };

  //Combos
  cboCategorias: Categorias[] = [];
  cboUnidadMedidas: UnidadMedidas[] = [];
  lista: Productos[] = [];

  constructor(
    public productosService: ProductosService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    private _modalService: NgbModal
  ) {
    this.new_fgMain();
  }

  new_fgMain(){
    this.fgMain = this.fb.group({
      codigoBarra: '',
      idPuntoVenta: '',
      nombre: '',
      fechaIni: '',
      fechaFin: '',
      puntoventa:''
    });

    this.fgMain.valueChanges.subscribe((value: any) => {
      const filter = { ...value, name: value.nombre.trim().toLowerCase() } as string;
      this.MainDS.filter = filter;

      if (this.MainDS.paginator) {
        this.MainDS.paginator.firstPage();
      }
    });
  }

  get getMain() { return this.fgMain.controls; }

  ngOnInit() {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.fgMain.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.fgMain.get('puntoventa').setValue(this.puntoVentas.nombre);
    $("#codigoBarra").focus();
    this.loadMain();
  }

  openImagenModal(producto: Productos) {
    const modalRef = this._modalService.open(MODALS['imagen'], { size: 'md', centered: true });
    modalRef.componentInstance.productoId = producto.id;
    modalRef.componentInstance.imagenUrl = producto.imagen ? `${environment.BASE_URL_UPLOAD}${producto.imagen}` : '';
    modalRef.result.then(async (result: any) => {
      if (result.modal === 'imagen' && (result.value === 'uploaded' || result.value === 'deleted')) {
        await this.loadMain();
      }
    }, () => {});
  }

  openModal(name: string) {

    const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
    const obj: any = new Object();

    switch (name) {
      case 'productos':
        obj['opcion'] = this.opcion;
        obj['productos'] = this.productos;
        obj['lista'] = this.lista;
        modalRef.componentInstance.fromParent = obj;
      break;
      case 'proveedores':
        obj['opcion'] = this.opcion;
        obj['productos'] = this.productos;
        modalRef.componentInstance.fromParent = obj;
      break;
    }

    modalRef.result.then(async (result) => {
      switch (result.modal) {
        case 'productos':
          if (result.value === 'loadAgain') {
            await this.loadMain();
          }
          break;

        case 'proveedores':
          if (result.value === 'loadAgain') {
            await this.loadMain();
          }
          break;
      }

    }, (reason) => { });
  }

  limpiar(){
    this.fgMain = this.fb.group({
      codigoBarra: '',
      idPuntoVenta: '',
      nombre: '',
      fechaIni: '',
      fechaFin: '',
      puntoventa:''
    });

    this.loadMain();
  }

  barCode(productos: Productos){
    this.productosService.obtenerBarCode(productos.id).subscribe(response => {
      const src = `data:image/png;base64,${response}`;
      const link = document.createElement("a");
      link.href = src;
      link.download = productos.codigoBarra + ".png";
      link.click();
    });

  }

  asignarProveedor(element: Productos){
    this.opcion = 3;
    this.productos = element;
    this.openModal('proveedores');
  }

  crudRegistros(){
    this.opcion = 1;
    this.openModal('productos');
  }

  viewDetail(element: any) {
    this.opcion = 2;
    this.productos = element;
    this.openModal('productos');
  }

  loadMain() {
    this.funcionesService.showLoading();
    this.productosService.obtenerProductos(this.puntoVentas.id).subscribe(response => {

      this.lista = response.productos;
      this.MainDS = new MatTableDataSource<Productos  >(response.productos);
      this.MainDS.paginator = this.pagMain;
      this.funcionesService.hideLoading();

      this.MainDS.filterPredicate = function(data: Productos, filter: string): boolean {
        return data.nombre.trim().toLowerCase().includes(filter);
      };

      this.MainDS.filterPredicate = ((data: Productos, filter: any ) => {
        const a = !filter.codigoBarra || data.codigoBarra === filter.codigoBarra;
        const b = !filter.nombre || data.nombre.trim().toLowerCase().includes(filter.nombre.trim().toLowerCase());
        const c = !filter.idPuntoVenta || parseInt(data.idPuntoVenta) === parseInt(filter.idPuntoVenta);
        const d = !filter.fechaIni ||  new Date(this.funcionesService.formatearFecha4(data.created_at)) >= new Date(filter.fechaIni) && new Date(this.funcionesService.formatearFecha4(data.created_at)) <= new Date(filter.fechaFin);
        return a && b && c && d;
      }) as (PeriodicElement: any, string: any) => boolean;
    }, error => {
      console.log(error);
      this.funcionesService.hideLoading();
      this.progressBar = false;
    });
  }

  eliminarRegistro(element: Productos){
    this.funcionesService.mensajeConfirmar('¿Desea eliminar este registro?', '', (result: any) => {
      if (result.isConfirmed) {
        element.opcion = 2;
        element.status = 0;
        this.funcionesService.showLoading();
        this.productosService.crudProductos(element).subscribe(response => {
          if (response.status === 200) {
            this.funcionesService.showSuccess(response.message);
            this.loadMain();
            this.funcionesService.hideLoading();
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

  configurarProducto(productos: Productos): boolean{
    let retornar: boolean = false;
    if(parseFloat(productos.stockActual) > 0 && parseFloat(productos.stockActual) <= parseFloat(productos.stockMinimo)){
      retornar = true;
    }
    return retornar;
  }

  configurarProductoVacio(productos: Productos): boolean{
    let retornar: boolean = false;
    if(parseFloat(productos.stockActual) === 0){
      retornar = true;
    }

    return retornar;
  }

  generateData() {
    var result: any[] = [];
    var data = this.lista;

    data.forEach((element: any) => {

      result.push([
        element.idPuntoVenta == null ? '': this.puntoVentas.nombre,
        element.nombre == null ? '': element.nombre,
        element.codigoAntiguo == null ? '': element.codigoAntiguo,
        element.codigoBarra == null ? '': element.codigoBarra,
        element.idCategoria == null ? '': element.categorias.nombre,
        element.idUm == null ? '': element.unidadMedidas.nombre,
        element.stockMinimo == null ? '': element.stockMinimo,
        element.stockMaximo == null ? '': element.stockMaximo,
        element.stockActual == null ? '': element.stockActual,
        element.stockAlerta == null ? '': element.stockAlerta,
        element.precio == null ? '': element.precio,
        element.precioCompra == null ? '': element.precioCompra,
        element.precioMinimo == null ? '': element.precioMinimo,
        element.precioMaximo == null ? '': element.precioMaximo,
        element.precioMayor == null ? '': element.precioMayor,
        element.observaciones == null ? '': element.observaciones,
        element.status == true ? 'ACTIVO' : 'INACTIVO'
      ]);

    });

    return result;
  }

  downloadPDF(){
    this.funcionesService.showLoading();
    this.progressBar = true;

    var doc = new jsPDF.default('landscape');
    doc.setFontSize(30);
    doc.setFont("arial", "bold");
    doc.getLineHeight();
    doc.text("REPORTE PRODUCTOS", 140, 30, {align: "center"});
    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
      margin: {top: 40},
      head: [[ "PUNTO DE VENTA", "PRODUCTO", "CODIGO ANTIGUO", "CODIGO BARRA", "CATEGORIA", "UNIDAD MEDIDA", "STOCK MINIMO", "STOCK MAXIMO", "STOCK ACTUAL", "STOCK ALERTA", "PRECIO", "PRECIO COMPRA", "PRECIO MINIMO", "PRECIO MAXIMO", "PRECIO MAYOR", "OBSERVACIONES", "ESTADO"]],
      body: this.generateData()
    });
    doc.save('Reporte Productos.pdf');

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  downloadExcel(){
    this.funcionesService.showLoading();
    this.progressBar = true;

    const title = 'REPORTE PRODUCTOS';
    const header = [ "PUNTO DE VENTA", "PRODUCTO", "CODIGO ANTIGUO", "CODIGO BARRA", "CATEGORIA", "UNIDAD MEDIDA", "STOCK MINIMO", "STOCK MAXIMO", "STOCK ACTUAL", "STOCK ALERTA", "PRECIO", "PRECIO COMPRA", "PRECIO MINIMO", "PRECIO MAXIMO", "PRECIO MAYOR", "OBSERVACIONES", "ESTADO"];
    const data = this.lista;
    let lista: any[] = [];

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('Productos');

    // Add new row
    let titleRow = worksheet.addRow([title]);
    // Set font, size and style in title row.
    titleRow.font = { name: 'Arial', family: 4, size: 16, bold: true };

    worksheet.mergeCells(`A1:Q1`);
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };

    // Blank Row
    worksheet.addRow([]);

    // Add Header Row
    const headerRow = worksheet.addRow(header);

    headerRow.eachCell((cell, number) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '828380' },
        bgColor: { argb: 'FF0000FF' }
      };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    worksheet.getColumn(1).width = 30;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 30;
    worksheet.getColumn(4).width = 30;
    worksheet.getColumn(5).width = 20;
    worksheet.getColumn(6).width = 20;
    worksheet.getColumn(7).width = 20;
    worksheet.getColumn(8).width = 30;
    worksheet.getColumn(9).width = 30;
    worksheet.getColumn(10).width = 30;
    worksheet.getColumn(11).width = 30;
    worksheet.getColumn(12).width = 30;
    worksheet.getColumn(13).width = 30;
    worksheet.getColumn(14).width = 30;
    worksheet.getColumn(15).width = 30;
    worksheet.getColumn(16).width = 30;
    worksheet.getColumn(17).width = 30;

    data.forEach((element: any) => {
      lista.push(
        element.idPuntoVenta == null ? '': this.puntoVentas.nombre,
        element.nombre == null ? '': element.nombre,
        element.codigoAntiguo == null ? '': element.codigoAntiguo,
        element.codigoBarra == null ? '': element.codigoBarra,
        element.idCategoria == null ? '': element.categorias.nombre,
        element.idUm == null ? '': element.um.nombre,
        element.stockMinimo == null ? '': element.stockMinimo,
        element.stockMaximo == null ? '': element.stockMaximo,
        element.stockActual == null ? '': element.stockActual,
        element.stockAlerta == null ? '': element.stockAlerta,
        element.precio == null ? '': element.precio,
        element.precioCompra == null ? '': element.precioCompra,
        element.precioMinimo == null ? '': element.precioMinimo,
        element.precioMaximo == null ? '': element.precioMaximo,
        element.precioMayor == null ? '': element.precioMayor,
        element.observaciones == null ? '': element.observaciones,
        element.status == true ? 'ACTIVO' : 'INACTIVO'
      );
      worksheet.addRow(lista);
      lista = [];
    });

    worksheet.addRow([]);

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'Reporte Productos.xlsx');
    });

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

}
