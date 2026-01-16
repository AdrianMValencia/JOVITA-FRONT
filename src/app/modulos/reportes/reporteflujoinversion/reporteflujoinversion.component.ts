import { Component, OnInit, ViewChild } from '@angular/core';
import { ReportesService } from '../service/reportes.service';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { FlujoInversion } from '../model/reporteFlujoInversion';
const jsPDF = require('jspdf');
require('jspdf-autotable');
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-reporteflujoinversion',
  templateUrl: './reporteflujoinversion.component.html',
  providers: [ReportesService]
})
export class ReporteflujoinversionComponent implements OnInit {

  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // FormGroup
  formGroup: FormGroup | any;

  flujoInversion: FlujoInversion[] = [];

  // PRINCIPAL
  MainDC: string[] = ['puntoventa', 'Fecha', 'Ventas', 'Compras', 'DIferencia'];
  MainDS: MatTableDataSource<FlujoInversion> = new MatTableDataSource<FlujoInversion>();
  @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

  constructor(
    private reportesService: ReportesService,
    private funcionesService: FuncionesService,
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

    this.reportesService.flujoInversion(idPuntoVenta).subscribe(response => {

      this.MainDS = new MatTableDataSource<FlujoInversion>(response.reportes);
      this.MainDS.paginator = this.pagMain;

      this.MainDS.filterPredicate = function(data: FlujoInversion, filter: string): boolean {
        return data.Fecha.includes(filter);
      };

      this.MainDS.filterPredicate = ((data: FlujoInversion, filter: any ) => {
        const a = !filter.fechaIni ||  new Date(this.funcionesService.formatearFecha4(data.Fecha)) >= new Date(filter.fechaIni) && new Date(this.funcionesService.formatearFecha4(data.Fecha)) <= new Date(filter.fechaFin);
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
        element.puntoventa == null ? '': element.puntoventa,
        element.Fecha == null ? '': this.funcionesService.formatearFecha5(element.Fecha),
        element.Ventas == null ? 0: parseFloat(element.Ventas).toFixed(2),
        element.Compras == null ? 0: parseFloat(element.Compras).toFixed(2),
        ((element.Ventas == null ? 0: parseFloat(element.Ventas)) - (element.Compras == null ? 0: parseFloat(element.Compras))).toFixed(2)
      ]);

    });

    return result;
  }

  downloadPDF(){
    var doc = new jsPDF.default('landscape');
    doc.setFontSize(30);
    doc.setFont("arial", "bold");
    doc.getLineHeight();
    doc.text("REPORTE FLUJO DE INVERSION", 140, 30, {align: "center"});
    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
      margin: {top: 40},
      head: [["PUNTO VENTA", "FECHA", "VENTA", "COMPRAS", "DIFERENCIA"]],
      body: this.generateData()
    });
    doc.save('Reporte Flujo de Inversion.pdf');
  }

  downloadExcel(){
    this.funcionesService.showLoading();

    const title = 'REPORTE FLUJO DE INVERSION';
    const header = ["PUNTO VENTA", "FECHA", "VENTA", "COMPRAS", "DIFERENCIA"];
    const data = this.MainDS.filteredData;
    let lista: any[] = [];

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('FlujoInversion');

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
    worksheet.getColumn(5).width = 30;

    data.forEach((element: any) => {
      lista.push(
        element.puntoventa == null ? '': element.puntoventa,
        element.Fecha == null ? '': this.funcionesService.formatearFecha5(element.Fecha),
        element.Ventas == null ? 0: parseFloat(element.Ventas).toFixed(2),
        element.Compras == null ? 0: parseFloat(element.Compras).toFixed(2),
        ((element.Ventas == null ? 0: parseFloat(element.Ventas)) - (element.Compras == null ? 0: parseFloat(element.Compras))).toFixed(2)
      );
      worksheet.addRow(lista);
      lista = [];
    });

    worksheet.addRow([]);

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'Reporte Flujo de Inversion.xlsx');
    });

    this.funcionesService.hideLoading();
  }
}
