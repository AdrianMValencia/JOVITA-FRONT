import { Component, OnInit, ViewChild } from '@angular/core';

import { ReportesService } from '../service/reportes.service';
const jsPDF = require('jspdf');
require('jspdf-autotable');
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReporteMensualPorVendedor } from '../model/reporteMensualPorVendedor';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

@Component({
  selector: 'app-reporteMensualporVendedor',
  templateUrl: './reporteMensualporVendedor.component.html',
  providers: [ReportesService]
})
export class ReporteMensualporVendedorComponent implements OnInit {

 // FormGroup
 formGroup: FormGroup | any;

 reporteVentasTotales: ReporteMensualPorVendedor = new ReporteMensualPorVendedor('', '', '', '', '');
 puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
 puntoVentas: PuntosVenta = new PuntosVenta();

 // PRINCIPAL
 MainDC: string[] = ['puntoventa', 'ano', 'mes', 'vendedor', 'monto'];
 MainDS: MatTableDataSource<ReporteMensualPorVendedor> = new MatTableDataSource<ReporteMensualPorVendedor>();
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
   this.service.cargarReporteMensualporVendedorComponent(this.puntoVentas.id).subscribe(response => {

     this.MainDS = new MatTableDataSource<ReporteMensualPorVendedor>(response.ventasTotales);
     this.MainDS.paginator = this.pagMain;

     this.MainDS.filterPredicate = function(data: ReporteMensualPorVendedor, filter: string): boolean {
       return data.fecha.includes(filter);
     };

     this.MainDS.filterPredicate = ((data: ReporteMensualPorVendedor, filter: any ) => {
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

    const monto = parseFloat(element.monto).toFixed(2);

    result.push([
      element.puntoventa == null ? 0.00: element.puntoventa,
      element.ano == null ? '': element.ano,
      element.mes == null ? '': this.funcionesService.meses(element.mes),
      element.vendedor,
      'S/' + (element.monto == null ? 0.00:  Number(monto).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
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
  doc.text("Venta Mensual por Vendedor", 140, 30, {align: "center"});
  doc.autoTable({
    styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
    margin: {top: 40},
    head: [["PUNTO VENTA", "AÑO", "MES", "VENDEDOR", "MONTO"]],
    body: this.generateData()
  });
  doc.save('Reporte_Mensual_por_Vendedor.pdf');

  this.funcionesService.hideLoading();
}

downloadExcel(){
  this.funcionesService.showLoading();

  const title = 'Venta Mensual por Vendedor';
  const header = ["PUNTO VENTA", "AÑO", "MES", "VENDEDOR", "MONTO"];
  const data = this.MainDS.filteredData;
  let lista: any[] = [];

  let workbook = new Workbook();
  let worksheet = workbook.addWorksheet('MensualPorVendedor');

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

  data.forEach((element: any) => {
    const monto = parseFloat(element.monto).toFixed(2);
    lista.push(
      element.puntoventa == null ? 0.00: element.puntoventa,
      element.ano == null ? '': element.ano,
      element.mes == null ? '': this.funcionesService.meses(element.mes),
      element.vendedor,
      'S/' + (element.monto == null ? 0.00:  Number(monto).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    );
    worksheet.addRow(lista);
    lista = [];
  });

  worksheet.addRow([]);

  workbook.xlsx.writeBuffer().then((data: any) => {
    const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    fs.saveAs(blob, 'Reporte_Mensual_por_Vendedor.xlsx');
  });

  this.funcionesService.hideLoading();
}
}
