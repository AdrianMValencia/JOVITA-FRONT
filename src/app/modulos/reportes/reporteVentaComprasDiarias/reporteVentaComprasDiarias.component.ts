import { Component, OnInit, ViewChild } from '@angular/core';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');
import { saveAs } from 'file-saver';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { ReportesService } from '../service/reportes.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Compras } from '../../compras/Ingresos/model/compras';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

@Component({
  selector: 'app-reporteVentaComprasDiarias',
  templateUrl: './reporteVentaComprasDiarias.component.html',
  providers: [ReportesService]
})
export class ReporteVentaComprasDiariasComponent implements OnInit {

 // FormGroup
 fgMain: FormGroup | any;

 compras: Compras = new Compras(0, '', '', '0', '', '', '', '0', '', '', '', '', '', '', true, '', 1, '', '', '');
 puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
 puntoVentas: PuntosVenta = new PuntosVenta();
 opcion: number = 0;
 paginaActual: number = 1;

 // Progress Bar
 progressBar: boolean = false;

 // PRINCIPAL
 MainDC: string[] = ['puntoventa', 'dia', 'mes', 'montoCompra', 'montoVenta'];
 MainDS: MatTableDataSource<Compras> = new MatTableDataSource<Compras>();
 @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

 constructor(
   private reportesService: ReportesService,
   public funcionesService: FuncionesService,
   private fb: FormBuilder
 ) {
   this.new_fgMain();
 }

 new_fgMain(){
   this.fgMain = this.fb.group({
     idPuntoVenta: '',
     fechaIni: '',
     fechaFin: '',
     puntoventa:'',
   });
 }

 get getMain() { return this.fgMain.controls; }

 ngOnInit() {
   this.puntoVentas = JSON.parse(this.puntoVentaStorage);
   this.fgMain.get('idPuntoVenta').setValue(this.puntoVentas.id);
   this.fgMain.get('puntoventa').setValue(this.puntoVentas.nombre);

   this.buscar();
 }

 limpiar(){
   this.fgMain = this.fb.group({
     idPuntoVenta: '',
     fechaIni:'',
     fechaFin: '',
     puntoventa:''
   });

   this. buscar();
 }

 buscar(): any{

   if(new Date(this.fgMain.get('fechaIni').value).getTime() > new Date(this.fgMain.get('fechaFin').value).getTime()){
     this.funcionesService.showError('La fecha de inicio no puede ser mayor que la fecha final');
     return false;
   }

   this.funcionesService.showLoading();
   this.reportesService.ventasComprasDiarias(this.fgMain.get('fechaIni').value, this.fgMain.get('fechaFin').value, this.puntoVentas.id).subscribe(response => {
     if(response.status === 200){
       this.funcionesService.hideLoading();
       this.MainDS = new MatTableDataSource<Compras>(response.compras);
       this.MainDS.paginator = this.pagMain;
     }
   });
 }

 generateData() {
   var result: any[] = [];
   var data = this.MainDS.filteredData;


   data.forEach((element: any) => {

     const [anio, mes, diaStr] = element.fechaEmision.split("-").map(Number);
     const fecha = new Date(Date.UTC(anio, mes - 1, diaStr));

     result.push([
      element.puntoventa,
      fecha.getUTCDate(),
      this.funcionesService.meses(fecha.getUTCMonth() + 1),
       element.totalCompras == null ? '': parseFloat(element.totalCompras).toFixed(2),
       element.totalVentas == null ? '': parseFloat(element.totalVentas).toFixed(2),
     ]);

   });

   return result;
 }

 downloadPDF(){
   this.funcionesService.showLoading();
   this.progressBar = true;

   var doc = new jsPDF.default('landscape');
   doc.setFontSize(20);
   doc.setFont("arial", "bold");
   doc.getLineHeight();
   doc.text('Ventas vs Compras', 140, 30, {align: "center"});
   doc.autoTable({
     styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
     margin: {top: 40},
     head: [[ "PUNTO DE VENTA", "DÍA", "MES", "MONTO COMPRA", "MONTO VENDIDO"]],
     body: this.generateData()
   });
   doc.save('Reporte_venta_compra_diaria.pdf');

   this.funcionesService.hideLoading();
   this.progressBar = false;
 }

 downloadExcel(){
   this.funcionesService.showLoading();
   this.progressBar = true;

   const title = 'Ventas vs Compras';
   const header = [ "PUNTO DE VENTA", "DÍA", "MES", "MONTO COMPRA", "MONTO VENDIDO"];
   const data = this.MainDS.filteredData;
   let lista: any[] = [];

   let workbook = new Workbook();
   let worksheet = workbook.addWorksheet('Reporte Compras');

   // Add new row
   let titleRow = worksheet.addRow([title]);
   // Set font, size and style in title row.
   titleRow.font = { name: 'Arial', family: 4, size: 16, bold: true };

   worksheet.mergeCells(`A1:E1`);
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

   data.forEach((element: any) => {
    const [anio, mes, diaStr] = element.fechaEmision.split("-").map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, diaStr));

     lista.push(
      element.puntoventa,
      fecha.getUTCDate(),
      this.funcionesService.meses(fecha.getUTCMonth() + 1),
      element.totalCompras == null ? '': parseFloat(element.totalCompras).toFixed(2),
      element.totalVentas == null ? '': parseFloat(element.totalVentas).toFixed(2),
     );
     worksheet.addRow(lista);
     lista = [];
   });

   worksheet.addRow([]);

   workbook.xlsx.writeBuffer().then((data: any) => {
     const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
     fs.saveAs(blob, 'Reporte_venta_compra_diaria.xlsx');
   });

   this.funcionesService.hideLoading();
   this.progressBar = false;
 }


}
