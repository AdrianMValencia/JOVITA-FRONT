import { Component, OnInit, ViewChild } from '@angular/core';

import { ReportesService } from '../service/reportes.service';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');
import { saveAs } from 'file-saver';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Compras } from '../../compras/Ingresos/model/compras';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Proveedor } from '../../mantenimientos/proveedor/model/proveedor';
import { ProveedorService } from '../../mantenimientos/proveedor/service/proveedor.service';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-reporteComprasResumidas',
  templateUrl: './reporteComprasResumidas.component.html',
  providers: [ReportesService]
})
export class ReporteComprasResumidasComponent implements OnInit {

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
  MainDC: string[] = ['puntoventa', 'mes', 'ano', 'rucProveedor', 'nombreProveedor', 'totalCompras'];
  MainDS: MatTableDataSource<Compras> = new MatTableDataSource<Compras>();
  @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;
  @ViewChild(MatSort) sort: MatSort | any;
  //Combos
  cboProveedores: Proveedor[] = [];

  constructor(
    private reportesService: ReportesService,
    private proveedorService: ProveedorService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder
  ) {
    this.new_fgMain();
  }

  new_fgMain(){
    this.fgMain = this.fb.group({
      idPuntoVenta: '',
      idProveedor: '',
      fechaIni: '',
      fechaFin: '',
      puntoventa:'',
      proveedores: ''
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
      idProveedor: '',
      fechaIni: '',
      fechaFin: '',
      puntoventa:'',
      proveedores: ''
    });

    this. buscar();
  }

  buscar(): any{
    // if(new Date(this.fgMain.get('fechaIni').value).getTime() > new Date(this.fgMain.get('fechaFin').value).getTime()){
    //   this.funcionesService.showError('La fecha de inicio no puede ser mayor que la fecha final');
    //   return false;
    // }

    this.funcionesService.showLoading();
    this.reportesService.comprasResumidas(this.fgMain.get('fechaIni').value, this.fgMain.get('fechaFin').value, this.fgMain.get('idProveedor').value, this.puntoVentas.id).subscribe(response => {
      if(response.status === 200){
        this.funcionesService.hideLoading();
        this.cargarProveedores();
        this.MainDS = new MatTableDataSource<Compras>(response.compras);
        this.MainDS.sort = this.sort;
        this.MainDS.paginator = this.pagMain;
      }
    });
  }

  selectEvent(event: Proveedor){
    this.fgMain.get('idProveedor').setValue(event.id);
  }

  cargarProveedores(){
    this.proveedorService.obtenerProveedor(this.puntoVentas.id).subscribe(response => {
      this.cboProveedores = response.proveedores;
    });
  }

  generateData() {
    var result: any[] = [];
    var data = this.MainDS.filteredData;

    data.forEach((element: any) => {

      result.push([
        element.puntoVenta,
        this.funcionesService.meses(element.mes),
        element.ano,
        element.rucProveedor == null ? '': element.rucProveedor,
        element.nombreProveedor == null ? '': element.nombreProveedor,
        element.totalCompras == null ? '': parseFloat(element.totalCompras).toFixed(2)
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
    doc.text('Compras por Proveedor', 140, 30, {align: "center"});
    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
      margin: {top: 40},
      head: [[ "PUNTO DE VENTA", "MES", "AÑO", "RUC PROVEEDOR", "NOMBRE PROVEEDOR", "MONTO DE COMPRA"]],
      body: this.generateData()
    });
    doc.save('Reporte Compras.pdf');

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  downloadExcel(){
    this.funcionesService.showLoading();
    this.progressBar = true;

    const title = 'Compras por Proveedor';
    const header = [ "PUNTO DE VENTA", "MES", "AÑO", "RUC PROVEEDOR", "NOMBRE PROVEEDOR", "MONTO DE COMPRA"];
    const data = this.MainDS.filteredData;
    let lista: any[] = [];

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('Reporte Compras');

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

    data.forEach((element: any) => {
      lista.push(
        element.puntoVenta,
        this.funcionesService.meses(element.mes),
        element.ano,
        element.rucProveedor == null ? '': element.rucProveedor,
        element.nombreProveedor == null ? '': element.nombreProveedor,
        element.totalCompras == null ? '': parseFloat(element.totalCompras).toFixed(2)
      );
      worksheet.addRow(lista);
      lista = [];
    });

    worksheet.addRow([]);

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'Reporte_Compras.xlsx');
    });

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  download(compras: Compras){
    let type: string = compras.archivo.split('.')[1];
    this.downloadPdf(compras.archivo, type, compras.numeroTipoDocumento);
  }

  downloadPdf(base64String: any, type: string, fileName: string) {
    const source = `data:${type};base64,${base64String}`;
    const link = document.createElement("a");
    link.href = source;
    link.download = `Documento-${fileName}.${type.split('/')[1]}`;
    link.click();
  }

}
