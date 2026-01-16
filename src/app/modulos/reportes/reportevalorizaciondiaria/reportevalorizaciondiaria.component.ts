import { Component, OnInit, ViewChild } from '@angular/core';
import { ReporteValorizado } from '../model/reporteValorizado';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ReportesService } from '../service/reportes.service';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');
import * as moment from 'moment';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';

@Component({
  selector: 'app-reportevalorizaciondiaria',
  templateUrl: './reportevalorizaciondiaria.component.html',
  providers:[ReportesService]
})
export class ReportevalorizaciondiariaComponent implements OnInit {

  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // PRINCIPAL
  MainDC: string[] = ['puntoVenta', 'fecha', 'valorizado'];
  MainDS: MatTableDataSource<ReporteValorizado> = new MatTableDataSource<ReporteValorizado>();
  @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

  constructor(
    public service: ReportesService,
    public funcionesService: FuncionesService
  ) {}

  ngOnInit() {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.loadMain();
  }

  loadMain() {
    this.funcionesService.showLoading();
    this.service.cargarReporteValorizado(this.puntoVentas.id).subscribe(response => {

      this.MainDS = new MatTableDataSource<ReporteValorizado>(response.valorizado);
      this.MainDS.paginator = this.pagMain;
      this.funcionesService.hideLoading();
    }, error => {
      console.log(error);
      this.funcionesService.hideLoading();
    });
  }

  generateData() {
    var result: any[] = [];
    var data = this.MainDS.filteredData;

    data.forEach((element: any) => {

      result.push([
        element.puntoVenta == null ? '': element.puntoVenta,
        element.created_at == null ? '': element.created_at,
        element.valorizado == null ? '': parseFloat(element.valorizado).toFixed(2)
      ]);

    });

    return result;
  }

  downloadPDF(){
    var doc = new jsPDF.default('landscape');
    doc.setFontSize(30);
    doc.setFont("arial", "bold");
    doc.getLineHeight();
    doc.text("REPORTE VALORIZACIÓN DIARIA", 150, 20, {align: "center"});

    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
      margin: {top: 60},
      head: [[
        'PUNTO DE VENTA',
        'FECHA',
        'VALORIZADO'
      ]],
      body: this.generateData()
    });
    doc.save('Reporte Valorizacion Diaria.pdf');
  }

  downloadExcel(){
    const title = 'REPORTE VALORIZACIÓN DIARIA';
    const header = [
      'PUNTO DE VENTA',
      'FECHA',
      'VALORIZADO'
    ];
    const data = this.MainDS.filteredData;
    let lista: any[] = [];

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('Valorizado');

    // Add new row
    let titleRow = worksheet.addRow([title]);
    // Set font, size and style in title row.
    titleRow.font = { name: 'Arial', family: 4, size: 16, bold: true };

    worksheet.mergeCells(`A1:C1`);
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
    worksheet.getColumn(2).width = 20;
    worksheet.getColumn(3).width = 20;

    data.forEach((element: any) => {
      lista.push(
        element.puntoVenta == null ? '': element.puntoVenta,
        element.created_at == null ? '': element.created_at,
        element.valorizado == null ? '': parseFloat(element.valorizado).toFixed(2)
      );
      worksheet.addRow(lista);
      lista = [];
    });

    worksheet.addRow([]);

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'Reporte Valorizacion Diaria.xlsx');
    });
  }
}
