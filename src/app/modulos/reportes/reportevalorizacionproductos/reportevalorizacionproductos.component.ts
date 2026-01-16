import { Component, OnInit, ViewChild } from '@angular/core';
import { ReportesService } from '../service/reportes.service';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { ValorizacionProductos } from '../model/reporteValorizacionProductos';
const jsPDF = require('jspdf');
require('jspdf-autotable');
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-reportevalorizacionproductos',
  templateUrl: './reportevalorizacionproductos.component.html',
  providers: [ReportesService]
})
export class ReportevalorizacionproductosComponent implements OnInit {

  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // FormGroup
  formGroup: FormGroup | any;

  valorizacionProductos: ValorizacionProductos[] = [];
  stockActual: string | any = '0';
  precioCompra: string | any = '0';
  valorizado: string | any = '0';

  // PRINCIPAL
  MainDC: string[] = ['nombrePuntoVenta', 'codigoBarra', 'nombre', 'stockActual', 'precioCompra', 'valorizado'];
  MainDS: MatTableDataSource<ValorizacionProductos> = new MatTableDataSource<ValorizacionProductos>();
  @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

  constructor(
    private reportesService: ReportesService,
    private funcionesService: FuncionesService
  ){}

  get getMain() { return this.formGroup.controls; }

  ngOnInit(): void {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.loadMain();
  }

  loadMain() {
    this.funcionesService.showLoading();
    let idPuntoVenta: number = 0;

    if (parseInt(this.puntoVentas.id) === 10) {
      idPuntoVenta = 0;
    }else{
      idPuntoVenta = this.puntoVentas.id;
    }
    this.reportesService.valorizacionProductosTienda(idPuntoVenta).subscribe(response => {

      this.MainDS = new MatTableDataSource<ValorizacionProductos>(response.reportes);
      this.MainDS.paginator = this.pagMain;

      this.valorizacionProductos = response.reportes;
      this.valorizacionProductos.forEach(element => {
        this.stockActual = parseFloat(this.stockActual) + parseFloat(element.stockActual);
        this.precioCompra = parseFloat(this.precioCompra) + parseFloat(element.precioCompra);
        this.valorizado = parseFloat(this.valorizado) + parseFloat(element.valorizado);
      });

      this.funcionesService.hideLoading();
    }, error => {
      console.log(error);
    });
  }

  generateData() {
    var result: any[] = [];
    var data = this.MainDS.filteredData;

    data.forEach((element: any) => {

      result.push([
        element.nombrePuntoVenta == null ? '': element.nombrePuntoVenta,
        element.codigoBarra == null ? '': element.codigoBarra,
        element.nombre == null ? '': element.nombre,
        element.stockActual == null ? 0 : parseFloat(element.stockActual).toFixed(2),
        element.precioCompra == null ? 0 : parseFloat(element.precioCompra).toFixed(2),
        element.valorizado == null ? 0 : parseFloat(element.valorizado).toFixed(2)
      ]);
    });

    return result;
  }

  downloadPDF(){
    var doc = new jsPDF.default('landscape');
    doc.setFontSize(30);
    doc.setFont("arial", "bold");
    doc.getLineHeight();
    doc.text("REPORTE VALORIZACION POR PRODUCTOS", 140, 30, {align: "center"});
    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
      columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
      margin: {top: 40},
      head: [["PUNTO VENTA", "CODIGO DE BARRA", "NOMBRE", "STOCK ACTUAL", "PRECIO COMPRA", "VALORIZADO"]],
      body: this.generateData()
    });
    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
      columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
      margin: {top: 40},
      head: [["TOTAL STOCK ACTUAL", "TOTAL PRECIO COMPRA", "TOTAL VALORIZADO"]],
      body:[[
        parseFloat(this.stockActual).toFixed(2),
        parseFloat(this.precioCompra).toFixed(2),
        parseFloat(this.valorizado).toFixed(2)
      ]]
    });
    doc.save('Reporte Valorizacion por Productos.pdf');
  }

  downloadExcel(){
    this.funcionesService.showLoading();

    const title = 'REPORTE VALORIZACION POR PRODUCTOS';
    const header = ["PUNTO VENTA", "CODIGO DE BARRA", "NOMBRE", "STOCK ACTUAL", "PRECIO COMPRA", "VALORIZADO"];
    const data = this.MainDS.filteredData;
    let lista: any[] = [];

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('ValorizacionPorProducto');

    // Add new row
    let titleRow = worksheet.addRow([title]);
    // Set font, size and style in title row.
    titleRow.font = { name: 'Arial', family: 4, size: 16, bold: true };

    worksheet.mergeCells(`A1:F1`);
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

    data.forEach((element: any) => {
      lista.push(
        element.nombrePuntoVenta == null ? '': element.nombrePuntoVenta,
        element.codigoBarra == null ? '': element.codigoBarra,
        element.nombre == null ? '': element.nombre,
        element.stockActual == null ? 0: parseFloat(element.stockActual).toFixed(2),
        element.precioCompra == null ? 0: parseFloat(element.precioCompra).toFixed(2),
        element.valorizado == null ? 0: parseFloat(element.valorizado).toFixed(2)
      );
      worksheet.addRow(lista);
      lista = [];

    });

    // Blank Row
    worksheet.addRow([]);

    // Add Header Row
    const headerRow2 = worksheet.addRow(["TOTAL STOCK ACTUAL", "TOTAL RECIO COMPRA", "TOTAL VALORIZADO"]);

    headerRow2.eachCell((cell, number) => {
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

    lista = [
      parseFloat(this.stockActual).toFixed(2),
      parseFloat(this.precioCompra).toFixed(2),
      parseFloat(this.valorizado).toFixed(2)
    ];
    worksheet.addRow(lista);
    lista = [];

    worksheet.addRow([]);

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'Reporte Valorizacion por Productos.xlsx');
    });

    this.funcionesService.hideLoading();
  }
}
