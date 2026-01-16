import { Component, OnInit, ViewChild } from '@angular/core';
const jsPDF = require('jspdf');
require('jspdf-autotable');
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { ReportesService } from '../service/reportes.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReporteVentas } from '../model/reporteVentas';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { MatTableDataSource } from '@angular/material/table';
import { ComparacionVentaVendedores } from '../model/reporteComparacionVentasVendedores';
import { MatPaginator } from '@angular/material/paginator';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

@Component({
  selector: 'app-reportecomparacionventasvendedores',
  templateUrl: './reportecomparacionventasvendedores.component.html',
  providers: [ReportesService]
})
export class ReportecomparacionventasvendedoresComponent implements OnInit{
  // FormGroup
  formGroup: FormGroup | any;

  comparacionVentaVendedores: ComparacionVentaVendedores = new ComparacionVentaVendedores('', '', '', '', '', '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // PRINCIPAL
  MainDC: string[] = ['puntoventa', 'fecha', 'vendedor', 'tipoPago', 'monto', 'total'];
  MainDS: MatTableDataSource<ComparacionVentaVendedores> = new MatTableDataSource<ComparacionVentaVendedores>();
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
    this.service.cargarComparacionVentasVendedores(this.puntoVentas.id).subscribe(response => {

      this.MainDS = new MatTableDataSource<ComparacionVentaVendedores>(response.comparacionVentaVendedores);
      this.MainDS.paginator = this.pagMain;

      this.MainDS.filterPredicate = function(data: ComparacionVentaVendedores, filter: string): boolean {
        return data.fecha.includes(filter);
      };

      this.MainDS.filterPredicate = ((data: ComparacionVentaVendedores, filter: any ) => {
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
        this.puntoVentas.nombre,
        element.fecha == null ? '': this.funcionesService.formatearFecha5(element.fecha),
        element.vendedor == null ? '': element.vendedor,
        element.tipoPago == null ? '': element.tipoPago,
        element.monto == null ? '': parseFloat(element.monto).toFixed(2),
        element.total == null ? '': parseFloat(element.total).toFixed(2)
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
    doc.text("COMPARACIÓN DE VENTAS DE VENDEDORES", 140, 30, {align: "center"});
    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
      columnStyles: { 4: { halign: 'right' }, 5: { halign: 'right' } },
      margin: {top: 40},
      head: [["PUNTO VENTA", "FECHA", "TRABAJADOR", "TIPO DE PAGO", "MONTO", "TOTAL"]],
      body: this.generateData()
    });
    doc.save('Reporte Comparacion de Ventas de Vendedores.pdf');

    this.funcionesService.hideLoading();
  }

  downloadExcel(){
    this.funcionesService.showLoading();

    const title = 'COMPARACIÓN DE VENTAS DE VENDEDORES';
    const header = ["PUNTO VENTA", "FECHA", "TRABAJADOR", "TIPO DE PAGO", "MONTO", "TOTAL"];
    const data = this.MainDS.filteredData;
    let lista: any[] = [];

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('Comparacion de Ventas de Vendedores');

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
        this.puntoVentas.nombre,
        element.fecha == null ? '': this.funcionesService.formatearFecha5(element.fecha),
        element.vendedor == null ? '': element.vendedor,
        element.tipoPago == null ? '': element.tipoPago,
        element.monto == null ? '': parseFloat(element.monto).toFixed(2),
        element.total == null ? '': parseFloat(element.total).toFixed(2)
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
