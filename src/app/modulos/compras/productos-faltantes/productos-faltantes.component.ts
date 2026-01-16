import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

import { ProductosFaltantes } from './models/productosFaltantes';
import { ProductosFaltantesService } from './service/productosFaltantes.service';
declare var $: any;
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');
import { saveAs } from 'file-saver';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { ProductosService } from '../../almacen/productos/service/Productos.service';
import { Productos } from '../../almacen/productos/model/productos';

@Component({
  selector: 'app-productos-faltantes',
  templateUrl: './productos-faltantes.component.html',
  providers: [ProductosFaltantesService, ProductosService]

})
export class ProductosFaltantesComponent implements OnInit {

  // FormGroup
  fgMain: FormGroup | any;

  productosFaltantes: ProductosFaltantes = new ProductosFaltantes(0, '', '', '', '', '', '', '', '', '', '', '', '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // PRINCIPAL
  MainDC: string[] = ['index', 'puntoVenta', 'fecha', 'categoria', 'producto', 'codigo', 'cantidad', 'precio', 'total', 'acciones'];
  MainDS: MatTableDataSource<ProductosFaltantes> = new MatTableDataSource<ProductosFaltantes>();
  @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

  cboProductos: Productos[] = [];

  constructor(
    private productosFaltantesService: ProductosFaltantesService,
    private productosService: ProductosService,
    private funcionesService: FuncionesService,
    private fb: FormBuilder,
  ) {
    this.new_fgMain();
  }

  new_fgMain(){
    this.fgMain = this.fb.group({
      codigoBarra: '',
      idPuntoVenta: '',
      idProducto: '',
      fechaIni: '',
      fechaFin: '',
      puntoventa:'',
      productos: ''
    });

    this.fgMain.valueChanges.subscribe((value: any) => {
      const filter = { ...value, name: value.codigoBarra.trim().toLowerCase() } as string;
      this.MainDS.filter = filter;

      if (this.MainDS.paginator) {
        this.MainDS.paginator.firstPage();
      }
    });
  }

  get getMain() { return this.fgMain.controls; }

  ngOnInit() {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.productosFaltantes.idPuntoVenta = this.puntoVentas.id;
    this.productosFaltantes.puntoVenta = this.puntoVentas.nombre;

    let fecha: Date = new Date();
    this.fgMain.get('fechaIni').setValue(this.funcionesService.generarFechaLocal(fecha));
    this.fgMain.get('fechaFin').setValue(this.funcionesService.generarFechaLocal(fecha));
    $("#codigoBarra").focus();
    this.loadMain();
  }

  loadMain(): any{
    if(this.fgMain.get('fechaIni').value === ''){
      this.funcionesService.showError('Ingrese la fecha de inicio');
      return false;
    }
    if(this.fgMain.get('fechaFin').value === ''){
      this.funcionesService.showError('Ingrese la fecha final');
      return false;
    }
    if(new Date(this.fgMain.get('fechaIni').value).getTime() > new Date(this.fgMain.get('fechaFin').value).getTime()){
      this.funcionesService.showError('La fecha de inicio no puede ser mayor que la fecha final');
      return false;
    }

      this.funcionesService.showLoading();
      this.productosFaltantesService.obtenerProductosFaltantes(this.puntoVentas.id).subscribe(response =>{
        this.funcionesService.hideLoading();
        this.MainDS = new MatTableDataSource<ProductosFaltantes>(response.productosFaltantes);
        this.MainDS.paginator = this.pagMain;

        this.MainDS.filterPredicate = function(data: ProductosFaltantes, filter: string): boolean {
          return data.idPuntoVenta.trim().toLowerCase().includes(filter);
        };

        this.MainDS.filterPredicate = ((data: ProductosFaltantes, filter: any ) => {
          const a = !filter.codigoBarra || data.codigo === filter.codigoBarra;
          const b = !filter.idPuntoVenta || parseInt(data.idPuntoVenta) === parseInt(filter.idPuntoVenta);
          const c = !filter.idProducto || parseInt(data.idProducto) === parseInt(filter.idProducto);
          const d = !filter.fechaIni ||  new Date(this.funcionesService.formatearFecha4(data.fecha)) >= new Date(filter.fechaIni) && new Date(this.funcionesService.formatearFecha4(data.fecha)) <= new Date(filter.fechaFin);
          return a && b && c && d;
        }) as (PeriodicElement: any, string: any) => boolean;

        this.cargarProductos();
      }, error =>{
        console.log(error);
        this.funcionesService.hideLoading();
      });
    }

    eliminarRegistro(element: ProductosFaltantes){
      this.funcionesService.mensajeConfirmar('¿Desea eliminar este registro?', '', (result: any) => {
        if (result.isConfirmed) {
          this.funcionesService.showLoading();
          this.productosFaltantesService.deleteProductosFaltantes(element).subscribe(response => {
            if (response.status === 200) {
              this.funcionesService.showSuccess(response.message);
              this.loadMain();
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

    cargarProductos(){
      this.productosService.cargarProductosVentas(this.puntoVentas.id).subscribe(response => {
        this.cboProductos = response.productos;
      });
    }

    generateData() {
      var result: ProductosFaltantes[] | any = [];

      this.MainDS.filteredData.forEach((element: any) => {

        result.push([
          element.puntoVenta == null ? '': element.puntoVenta,
          element.fecha == null ? '': this.funcionesService.generarFechaLocal4(new Date(element.fecha)),
          element.categoria == null ? '': element.categoria,
          element.producto == null ? '': element.producto,
          element.codigo == null ? '': element.codigo,
          element.cantidad == null ? '': element.cantidad,
          element.precioVenta == null ? '': 'S/ ' +  element.precioVenta,
          element.total == null ? '': 'S/ ' +  element.total
        ]);

      });

      return result;
    }

    downloadPDF(){
      this.funcionesService.showLoading();

      var doc = new jsPDF.default('landscape');
      doc.setFontSize(30);
      doc.setFont("arial", "bold");
      doc.getLineHeight();
      doc.text("REPORTE PRODUCTOS FALTANTES", 140, 30, {align: "center"});
      doc.autoTable({
        styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
        margin: {top: 40},
        head: [[ "PUNTO DE VENTA", "FECHA", "CATEGORIA", "PRODUCTO", "COD BARRA", "CANTIDAD", "PRECIO VENTA", "TOTAL"]],
        body: this.generateData()
      });
      doc.save('Reporte_Productos_Faltantes.pdf');

      this.funcionesService.hideLoading();
    }

    downloadExcel(){
      this.funcionesService.showLoading();

      const title = 'REPORTE PRODUCTOS FALTANTES';
      const header = [ "PUNTO DE VENTA", "FECHA", "CATEGORIA", "PRODUCTO", "COD BARRA", "CANTIDAD", "PRECIO VENTA", "TOTAL"];

      let workbook = new Workbook();
      let worksheet = workbook.addWorksheet('Productos');

      // Add new row
      let titleRow = worksheet.addRow([title]);
      // Set font, size and style in title row.
      titleRow.font = { name: 'Arial', family: 4, size: 16, bold: true };

      worksheet.mergeCells(`A1:H1`);
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
      worksheet.getColumn(5).width = 30;
      worksheet.getColumn(6).width = 30;
      worksheet.getColumn(7).width = 30;
      worksheet.getColumn(8).width = 30;

      var lista: ProductosFaltantes[] | any = [];

      this.MainDS.filteredData.forEach((element: any) => {
        lista.push(
          element.puntoVenta == null ? '': element.puntoVenta,
          element.fecha == null ? '': this.funcionesService.generarFechaLocal4(new Date(element.fecha)),
          element.categoria == null ? '': element.categoria,
          element.producto == null ? '': element.producto,
          element.codigo == null ? '': element.codigo,
          element.cantidad == null ? '': element.cantidad,
          element.precioVenta == null ? '': 'S/ ' +  element.precioVenta,
          element.total == null ? '': 'S/ ' +  element.total
        );
        worksheet.addRow(lista);
        lista = [];
      });

      worksheet.addRow([]);

      workbook.xlsx.writeBuffer().then((data: any) => {
        const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        fs.saveAs(blob, 'Reporte_Productos_Faltantes.xlsx');
      });

      this.funcionesService.hideLoading();
    }
}
