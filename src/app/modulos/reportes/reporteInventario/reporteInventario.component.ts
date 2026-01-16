import { Component, OnInit, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { ReportesService } from '../service/reportes.service';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ReporteInventario } from '../model/reporteInventario';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { FuncionesService } from '../../../shared/services/funciones.service';
import { Categorias } from '../../almacen/categorias/model/categorias';
import { CategoriasService } from '../../almacen/categorias/service/categorias.service';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { Productos } from '../../almacen/productos/model/productos';
import { ProductosService } from '../../almacen/productos/service/Productos.service';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');

@Component({
  selector: 'app-reporteInventario',
  templateUrl: './reporteInventario.component.html',
  providers: [ ReportesService, CategoriasService, ProductosService],
})
export class ReporteInventarioComponent implements OnInit {

  // FormGroup
  formGroup: FormGroup | any;

  reporteInventario: ReporteInventario = new ReporteInventario('', '', '', '', '', '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  costoInventario: any = '';
  cantidadProductosInventario: any = '';

  // Progress Bar
  progressBar: boolean = false;

  // PRINCIPAL
  MainDC: string[] = ['codigo', 'idCategoria', 'idProducto', 'costo', 'precio', 'existencia'];
  MainDS: MatTableDataSource<ReporteInventario> = new MatTableDataSource<ReporteInventario>();
  @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

  //COMBOS
  cboCategorias: Categorias[] = [];
  cboProductos: Productos[] = [];

  constructor(
    public service: ReportesService,
    private categoriasService: CategoriasService,
    public funcionesService: FuncionesService,
    private productosService: ProductosService,
    private fb: FormBuilder
  ) {
    this.new_fgMain();
  }

  new_fgMain(){
    this.formGroup = this.fb.group({
      codigoBarra: '',
      idProducto: '',
      idCategoria: '',
      productos: '',
      categorias: ''
    });

    this.formGroup.valueChanges.subscribe((value: any) => {
      if(value.codigoBarra === null){
        value.codigoBarra = '';
      }
      const filter = { ...value, name: value.codigoBarra.trim().toLowerCase() } as string;
      this.MainDS.filter = filter;

      if (this.MainDS.paginator) {
        this.MainDS.paginator.firstPage();
      }
    });
  }

  get getMain() { return this.formGroup.controls; }

  ngOnInit() {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.cargarCategoria();
    this.cargarProductos();
    this.loadMain();
  }

  selectEventProductos(event: any){
    this.formGroup.get('productos').setValue(event);
    this.formGroup.get('idProducto').setValue(event.id);
  }

  selectEventCategorias(event: any){
    this.formGroup.get('categorias').setValue(event);
    this.formGroup.get('idCategoria').setValue(event.id);
  }

  loadMain() {
    this.funcionesService.showLoading();
    this.service.cargarReporteInventario(this.puntoVentas.id).subscribe(response => {
      this.costoInventario = response.costoInventario;
      this.cantidadProductosInventario = response.cantidadProductosInventario;
      this.MainDS = new MatTableDataSource<ReporteInventario>(response.inventario);
      this.MainDS.paginator = this.pagMain;

      this.MainDS.filterPredicate = function(data: ReporteInventario, filter: string): boolean {
        return data.codigoBarra.includes(filter);
      };

      this.MainDS.filterPredicate = ((data: ReporteInventario, filter: any ) => {
        const a = !filter.codigoBarra || data.codigoBarra.toLowerCase().includes(filter.codigoBarra.toLowerCase());
        const b = !filter.productos || parseInt(data.idProducto) === filter.productos.id;
        const c = !filter.categorias || parseInt(data.idCategoria) === filter.categorias.id;
        return a && b && c;
      }) as (PeriodicElement: any, string: any) => boolean;

      this.funcionesService.hideLoading();
    }, error => {
      console.log(error);
    });
  }

  cargarCategoria(){
    this.categoriasService.obtenerCategorias(this.puntoVentas.id).subscribe(response => {
      this.cboCategorias = response.categorias;
      this.cboCategorias = this.cboCategorias.filter(x => parseInt(x.status) === 1);
    });
  }

  cargarProductos(){
    // let productosStorage: string | any = localStorage.getItem('productos');
    // this.cboProductos = JSON.parse(productosStorage);
    this.productosService.cargarProductosVentas(this.puntoVentas.id).subscribe(response => {
      this.cboProductos = response.productos;
    });
  }

  generateData() {
    var result: any[] = [];
    var data = this.MainDS.filteredData;

    data.forEach((element: any) => {

      result.push([
        element.codigoBarra == null ? '': element.codigoBarra,
        element.producto == null ? '': element.producto,
        element.costo == null ? '': parseFloat(element.costo).toFixed(2),
        element.precio == null ? '': parseFloat(element.precio).toFixed(2),
        element.existencia == null ? '': parseFloat(element.existencia).toFixed(2)
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
    doc.text("REPORTE DE INVENTARIO", 150, 20, {align: "center"});

    doc.setFontSize(20);
    doc.text("Costo del inventario", 60, 40, {align: "center"});
    doc.text(parseFloat(this.costoInventario).toFixed(2), 60, 50, {align: "center"});

    doc.text("Cantidad de productos en Inventario", 200, 40, {align: "center"});
    doc.text(parseFloat(this.cantidadProductosInventario).toFixed(2), 200, 50, {align: "center"});

    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
      margin: {top: 60},
      head: [[
        'Código',
        'Descripión del Producto',
        'Costo',
        'Precio Venta',
        'Existencia'
      ]],
      body: this.generateData()
    });
    doc.save('Reporte de Inventario.pdf');

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  downloadExcel(){
    this.funcionesService.showLoading();
    this.progressBar = true;

    const title = 'REPORTE DE INVENTARIO';
    const header = [
      'Código',
      'Descripión del Producto',
      'Costo',
      'Precio Venta',
      'Existencia'
    ];
    const data = this.MainDS.filteredData;
    let lista: any[] = [];

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('Comision');

    // Add new row
    let titleRow = worksheet.addRow([title]);
    // Set font, size and style in title row.
    titleRow.font = { name: 'Arial', family: 4, size: 16, bold: true };

    worksheet.mergeCells(`A1:E1`);
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };

    // Blank Row
    worksheet.addRow([]);

    let costo = worksheet.addRow(['Costo del inventario']);
    costo.font = { name: 'Arial', family: 4, size: 10, bold: true };
    worksheet.mergeCells(`A3:E3`);
    worksheet.getCell('A3').alignment = { vertical: 'middle', horizontal: 'center' };

    let costoTotal = worksheet.addRow([parseFloat(this.costoInventario).toFixed(2)]);
    costoTotal.font = { name: 'Arial', family: 4, size: 10, bold: true };
    worksheet.mergeCells(`A4:E4`);
    worksheet.getCell('A4').alignment = { vertical: 'middle', horizontal: 'center' };

    // Blank Row
    worksheet.addRow([]);

    let cantidad = worksheet.addRow(['Cantidad de productos en Inventario']);
    cantidad.font = { name: 'Arial', family: 4, size: 10, bold: true };
    worksheet.mergeCells(`A6:E6`);
    worksheet.getCell('A6').alignment = { vertical: 'middle', horizontal: 'center' };

    let ruc = worksheet.addRow([parseFloat(this.cantidadProductosInventario).toFixed(2)]);
    ruc.font = { name: 'Arial', family: 4, size: 10, bold: true };
    worksheet.mergeCells(`A7:E7`);
    worksheet.getCell('A7').alignment = { vertical: 'middle', horizontal: 'center' };

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

    worksheet.getColumn(1).width = 20;
    worksheet.getColumn(2).width = 40;
    worksheet.getColumn(3).width = 20;
    worksheet.getColumn(4).width = 20;
    worksheet.getColumn(5).width = 20;

    data.forEach((element: any) => {
      lista.push(
        element.codigoBarra == null ? '': element.codigoBarra,
        element.producto == null ? '': element.producto,
        element.costo == null ? '': parseFloat(element.costo).toFixed(2),
        element.precio == null ? '': parseFloat(element.precio).toFixed(2),
        element.existencia == null ? '': parseFloat(element.existencia).toFixed(2)
      );
      worksheet.addRow(lista);
      lista = [];
    });

    worksheet.addRow([]);

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'Reporte de Inventario.xlsx');
    });

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

}
