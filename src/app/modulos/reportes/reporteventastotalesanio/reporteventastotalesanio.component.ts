import { Component, OnInit, ViewChild } from '@angular/core';
import { ReportesService } from '../service/reportes.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReporteVentas } from '../model/reporteVentas';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
const jsPDF = require('jspdf');
require('jspdf-autotable');
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { ReporteVentasTotales } from '../model/reporteVentasTotales';

@Component({
  selector: 'app-reporteventastotalesanio',
  templateUrl: './reporteventastotalesanio.component.html',
  providers: [ReportesService]
})
export class ReporteventastotalesanioComponent implements OnInit {
 // FormGroup
 formGroup: FormGroup | any;

 reporteVentasTotales: ReporteVentas = new ReporteVentas('', '', '', '', '');
 puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
 puntoVentas: PuntosVenta = new PuntosVenta();

 // PRINCIPAL
 MainDC: string[] = ['puntoventa', 'ano', 'mes', 'venta', 'compra', 'pagos', 'ganancia'];
 MainDS: MatTableDataSource<ReporteVentas> = new MatTableDataSource<ReporteVentas>();
 @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

 constructor(
   public service: ReportesService,
   public funcionesService: FuncionesService,
   private fb: FormBuilder
 ){
   this.new_fgMain();
 }

 new_fgMain(){
   this.formGroup = this.fb.group({
     fechaIni: '',
     fechaFin: ''
   });

   this.formGroup.valueChanges.subscribe((value: any) => {
     if(value.fechaIni === null){
       value.fechaIni = '';
     }
     const filter = { ...value, name: value.fechaIni.trim().toLowerCase() } as string;
     this.MainDS.filter = filter;

     if (this.MainDS.paginator) {
       this.MainDS.paginator.firstPage();
     }
   });
 }

 get getMain() { return this.formGroup.controls; }

 ngOnInit() {
   this.puntoVentas = JSON.parse(this.puntoVentaStorage);
   this.loadMain();
 }

 loadMain() {
  this.funcionesService.showLoading();
   this.service.cargarReporteVentasTotalesAnio(this.formGroup.get('fechaIni').value, this.formGroup.get('fechaFin').value, this.puntoVentas.id).subscribe(response => {

     this.MainDS = new MatTableDataSource<ReporteVentas>(response.ventasTotales);
     this.MainDS.paginator = this.pagMain;

     this.MainDS.filterPredicate = function(data: ReporteVentas, filter: string): boolean {
       return data.fecha.includes(filter);
     };

     this.MainDS.filterPredicate = ((data: ReporteVentas, filter: any ) => {
       const a = !filter.fechaIni ||  new Date(this.funcionesService.formatearFecha4(data.fecha)) >= new Date(filter.fechaIni) && new Date(this.funcionesService.formatearFecha4(data.fecha)) <= new Date(filter.fechaFin);
       return a;
     }) as (PeriodicElement: any, string: any) => boolean;
     this.funcionesService.hideLoading();
   }, error => {
     console.log(error);
   });
 }

 limpiar(){
   this.formGroup = this.fb.group({
     fechaIni: '',
     fechaFin: ''
   });

   this.loadMain();
 }

 generateData() {
  var result: any[] = [];
  var data = this.MainDS.filteredData;

  data.forEach((element: any) => {

    result.push([
      element.puntoventa == null ? 0.00: element.puntoventa,
      element.ano == null ? 0.00: element.ano,
      element.mes == null ? 0.00: element.mes,
      element.venta == null ? 0.00: parseFloat(element.venta).toFixed(3),
      element.compra == null ? 0.00: parseFloat(element.compra).toFixed(3),
      element.pagos == null ? 0.00: parseFloat(element.pagos).toFixed(3),
      ((parseFloat(element.venta == null ? 0.00: element.venta) - parseFloat(element.compra == null ? 0.00: element.compra)) - parseFloat(element.pagos == null ? 0.00: element.pagos)).toFixed(3)
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
  doc.text("REPORTE VENTAS TOTALES POR AÑO", 140, 30, {align: "center"});
  doc.autoTable({
    styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
    margin: {top: 40},
    head: [["PUNTO VENTA", "AÑO", "MES", "VENTA", "COMPRA", "PAGOS", "GANANCIA"]],
    body: this.generateData()
  });
  doc.save('Reporte Ventas Totales por Año.pdf');

  this.funcionesService.hideLoading();
}

downloadExcel(){
  this.funcionesService.showLoading();

  const title = 'REPORTE VENTAS TOTALES POR AÑO';
  const header = ["PUNTO VENTA", "AÑO", "MES", "VENTA", "COMPRA", "PAGOS", "GANANCIA"];
  const data = this.MainDS.filteredData;
  let lista: any[] = [];

  let workbook = new Workbook();
  let worksheet = workbook.addWorksheet('VentasTotalesporAño');

  // Add new row
  let titleRow = worksheet.addRow([title]);
  // Set font, size and style in title row.
  titleRow.font = { name: 'Arial', family: 4, size: 16, bold: true };

  worksheet.mergeCells(`A1:G1`);
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

  data.forEach((element: any) => {
    lista.push(
      element.puntoventa == null ? 0.00: element.puntoventa,
      element.ano == null ? 0.00: element.ano,
      element.mes == null ? 0.00: element.mes,
      element.venta == null ? 0.00: parseFloat(element.venta).toFixed(3),
      element.compra == null ? 0.00: parseFloat(element.compra).toFixed(3),
      element.pagos == null ? 0.00: parseFloat(element.pagos).toFixed(3),
      ((parseFloat(element.venta == null ? 0.00: element.venta) - parseFloat(element.compra == null ? 0.00: element.compra)) - parseFloat(element.pagos == null ? 0.00: element.pagos)).toFixed(3)
    );
    worksheet.addRow(lista);
    lista = [];
  });

  worksheet.addRow([]);

  workbook.xlsx.writeBuffer().then((data: any) => {
    const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    fs.saveAs(blob, 'Reporte Ventas Totales por Año.xlsx');
  });

  this.funcionesService.hideLoading();
}
}
