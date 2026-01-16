import { Component, OnInit, ViewChild } from '@angular/core';
import { ReportesService } from '../service/reportes.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReporteProductosPuntoVenta } from '../model/reporteProductosPuntoVenta';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { PuntosventaService } from '../../mantenimientos/puntosventa/service/puntosventa.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { ProductosService } from '../../almacen/productos/service/Productos.service';
import { Productos } from '../../almacen/productos/model/productos';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';

@Component({
  selector: 'app-reporteproductospuntoventa',
  templateUrl: './reporteproductospuntoventa.component.html',
  providers:[ReportesService, PuntosventaService, ProductosService]
})
export class ReporteproductospuntoventaComponent implements OnInit {

  // FormGroup
  formGroup: FormGroup | any;

  productosPuntoVenta: ReporteProductosPuntoVenta = new ReporteProductosPuntoVenta(0, '', 0);
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  listaPuntoVenta: PuntosVenta[] = [];

  //COMBOS
  cboProductos: Productos[] = [];

  // PRINCIPAL
  MainDC: string[] = ['CODIGO', 'PRODUCTOS', 'CATEGORIA', 'JOVITA', 'JOVITACOMPRA', 'JOVITA2', 'JOVITA2COMPRA', 'JOVITA3', 'JOVITA3COMPRA', 'JOVITAGENERAL', 'JOVITAGENERALCOMPRA', 'TOTAL'];
  MainDS: MatTableDataSource<ReporteProductosPuntoVenta> = new MatTableDataSource<ReporteProductosPuntoVenta>();
  @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

  constructor(
    public service: ReportesService,
    public puntoVentaServie: PuntosventaService,
    private productosService: ProductosService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder
  ){
    this.new_fgMain();
  }

  new_fgMain(){
    this.formGroup = this.fb.group({
      idProducto: '',
      productos: '',
    });

    this.formGroup.valueChanges.subscribe((value: any) => {
      if(value.idProducto === null){
        value.idProducto = '';
      }
      const filter = { ...value, name: value.idProducto } as string;
      this.MainDS.filter = filter;

      if (this.MainDS.paginator) {
        this.MainDS.paginator.firstPage();
      }
    });
  }

  get getMain() { return this.formGroup.controls; }

  ngOnInit() {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    // this.cargarPuntoVenta();
    this.cargarProductos();
    this.loadMain();
  }

  cargarPuntoVenta(){
    this.puntoVentaServie.cargarPuntosVenta().subscribe(response => {
      this.listaPuntoVenta = response.puntosVenta;

      this.listaPuntoVenta.forEach(x => {
        if(x.nombre !== 'JOVITA PRUEBA'){
          this.MainDC.push(x.nombre);
        }
      });
    });
  }

  selectEventProductos(event: any){
    this.formGroup.get('productos').setValue(event);
    this.formGroup.get('idProducto').setValue(event.id);
  }

  loadMain() {
    this.funcionesService.showLoading();
    this.service.cargarReporteProductosPuntoVenta(this.puntoVentas.id).subscribe(response => {

      let lista: ReporteProductosPuntoVenta[] = response.productosPuntoVenta;
      lista.forEach(element => {
        element.JOVITA = element.JOVITA == null ? 0.00 : parseFloat(element.JOVITA);
        element.JOVITA2 = element.JOVITA2 == null ? 0.00 : parseFloat(element.JOVITA2);
        element.JOVITA3 = element.JOVITA3 == null ? 0.00 : parseFloat(element.JOVITA3);
        element.JOVITAGENERAL = element.JOVITAGENERAL == null ? 0.00 : parseFloat(element.JOVITAGENERAL);
      });
      this.MainDS = new MatTableDataSource<ReporteProductosPuntoVenta>(response.productosPuntoVenta);
      this.MainDS.paginator = this.pagMain;

      this.MainDS.filterPredicate = function(data: ReporteProductosPuntoVenta, filter: string): boolean {
        return data.id.includes(filter);
      };

      this.MainDS.filterPredicate = ((data: ReporteProductosPuntoVenta, filter: any ) => {
        const a = !filter.productos || parseInt(data.id) === filter.productos.id;
        return a;
      }) as (PeriodicElement: any, string: any) => boolean;
      this.funcionesService.hideLoading();
    }, error => {
      console.log(error);
    });
  }

  cargarProductos(){
    this.productosService.cargarProductosVentas(this.puntoVentas.id).subscribe(response => {
      this.cboProductos = response.productos;
    });
  }

  generateData() {
    var result: any[] = [];
    var data = this.MainDS.filteredData;

    data.forEach((element: any) => {

      result.push([
        element['CODIGO BARRA'] == null ? 0.00: element['CODIGO BARRA'],
        element.PRODUCTO == null ? 0.00: element.PRODUCTO,
        element.CATEGORIA == null ? 0.00: element.CATEGORIA,
        element['JOVITA - CANTIDAD'] == null ? 0.00: parseFloat(element['JOVITA - CANTIDAD']).toFixed(3),
        element['JOVITA - PRECIO COMPRA'] == null ? 0.00: parseFloat(element['JOVITA - PRECIO COMPRA']).toFixed(3),
        element['JOVITA 2 - CANTIDAD'] == null ? 0.00: parseFloat(element['JOVITA 2 - CANTIDAD']).toFixed(3),
        element['JOVITA 2 - PRECIO COMPRA'] == null ? 0.00: parseFloat(element['JOVITA 2 - PRECIO COMPRA']).toFixed(3),
        element['JOVITA 3 - CANTIDAD'] == null ? 0.00: parseFloat(element['JOVITA 3 - CANTIDAD']).toFixed(3),
        element['JOVITA 3 - PRECIO COMPRA'] == null ? 0.00: parseFloat(element['JOVITA 3 - PRECIO COMPRA']).toFixed(3),
        element['JOVITA GENERAL - CANTIDAD'] == null ? 0.00: parseFloat(element['JOVITA GENERAL - CANTIDAD']).toFixed(3),
        element['JOVITA GENERAL - PRECIO COMPRA'] == null ? 0.00: parseFloat(element['JOVITA GENERAL - PRECIO COMPRA']).toFixed(3),
        (parseFloat(element['JOVITA - CANTIDAD'] == null ? 0.00: element['JOVITA - CANTIDAD']) + parseFloat(element['JOVITA 2 - CANTIDAD'] == null ? 0.00: element['JOVITA 2 - CANTIDAD']) + parseFloat(element['JOVITA 3 - CANTIDAD'] == null ? 0.00: element['JOVITA 3 - CANTIDAD']) + parseFloat(element['JOVITA GENERAL - CANTIDAD'] == null ? 0.00: element['JOVITA GENERAL - CANTIDAD'])).toFixed(3)
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
    doc.text("PRODUCTOS POR PUNTO DE VENTA", 140, 30, {align: "center"});
    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
      columnStyles: { 4: { halign: 'right' }, 5: { halign: 'right' } },
      margin: {top: 40},
      head: [["CODIGO", "PRODUCTOS", "CATEGORIA", "JOVITA CANTIDAD", "JOVITA PRECIO/COMPRA", "JOVITA 2 CANTIDAD", "JOVITA 2 PRECIO/COMPRA", "JOVITA 3 CANTIDAD", "JOVITA 3 PRECIO/COMPRA", "JOVITA GENERAL CANTIDAD", "JOVITA GENERAL PRECIO/COMPRA", "TOTAL"]],
      body: this.generateData()
    });
    doc.save('Reporte Productos por Punto de Venta.pdf');

    this.funcionesService.hideLoading();
  }

  downloadExcel(){
    this.funcionesService.showLoading();

    const title = 'PRODUCTOS POR PUNTO DE VENTA';
    const header = ["CODIGO", "PRODUCTOS", "CATEGORIA", "JOVITA CANTIDAD", "JOVITA PRECIO/COMPRA", "JOVITA 2 CANTIDAD", "JOVITA 2 PRECIO/COMPRA", "JOVITA 3 CANTIDAD", "JOVITA 3 PRECIO/COMPRA", "JOVITA GENERAL CANTIDAD", "JOVITA GENERAL PRECIO/COMPRA", "TOTAL"];
    const data = this.MainDS.filteredData;
    let lista: any[] = [];

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('Productos por Punto de Venta');

    // Add new row
    let titleRow = worksheet.addRow([title]);
    // Set font, size and style in title row.
    titleRow.font = { name: 'Arial', family: 4, size: 16, bold: true };

    worksheet.mergeCells(`A1:L1`);
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
    worksheet.getColumn(9).width = 30;
    worksheet.getColumn(10).width = 30;
    worksheet.getColumn(11).width = 30;
    worksheet.getColumn(12).width = 30;

    data.forEach((element: any) => {
      lista.push(
        element['CODIGO BARRA'] == null ? 0.00: element['CODIGO BARRA'],
        element.PRODUCTO == null ? 0.00: element.PRODUCTO,
        element.CATEGORIA == null ? 0.00: element.CATEGORIA,
        element['JOVITA - CANTIDAD'] == null ? 0.00: parseFloat(element['JOVITA - CANTIDAD']).toFixed(3),
        element['JOVITA - PRECIO COMPRA'] == null ? 0.00: parseFloat(element['JOVITA - PRECIO COMPRA']).toFixed(3),
        element['JOVITA 2 - CANTIDAD'] == null ? 0.00: parseFloat(element['JOVITA 2 - CANTIDAD']).toFixed(3),
        element['JOVITA 2 - PRECIO COMPRA'] == null ? 0.00: parseFloat(element['JOVITA 2 - PRECIO COMPRA']).toFixed(3),
        element['JOVITA 3 - CANTIDAD'] == null ? 0.00: parseFloat(element['JOVITA 3 - CANTIDAD']).toFixed(3),
        element['JOVITA 3 - PRECIO COMPRA'] == null ? 0.00: parseFloat(element['JOVITA 3 - PRECIO COMPRA']).toFixed(3),
        element['JOVITA GENERAL - CANTIDAD'] == null ? 0.00: parseFloat(element['JOVITA GENERAL - CANTIDAD']).toFixed(3),
        element['JOVITA GENERAL - PRECIO COMPRA'] == null ? 0.00: parseFloat(element['JOVITA GENERAL - PRECIO COMPRA']).toFixed(3),
        (parseFloat(element['JOVITA - CANTIDAD'] == null ? 0.00: element['JOVITA - CANTIDAD']) + parseFloat(element['JOVITA 2 - CANTIDAD'] == null ? 0.00: element['JOVITA 2 - CANTIDAD']) + parseFloat(element['JOVITA 3 - CANTIDAD'] == null ? 0.00: element['JOVITA 3 - CANTIDAD']) + parseFloat(element['JOVITA GENERAL - CANTIDAD'] == null ? 0.00: element['JOVITA GENERAL - CANTIDAD'])).toFixed(3)
      );
      worksheet.addRow(lista);
      lista = [];
    });

    worksheet.addRow([]);

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'Reporte Compracion de Ventas de Vendedores.xlsx');
    });

    this.funcionesService.hideLoading();
  }
}
