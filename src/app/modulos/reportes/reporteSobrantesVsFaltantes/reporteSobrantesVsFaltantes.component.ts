import { Component, OnInit, ViewChild } from '@angular/core';

import { ReportesService } from '../service/reportes.service';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');
import { saveAs } from 'file-saver';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SobrantesVsFaltantes } from '../model/reporteSobrantesVsFaltantes';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

@Component({
  selector: 'app-reporteSobrantesVsFaltantes',
  templateUrl: './reporteSobrantesVsFaltantes.component.html',
  providers: [ReportesService]
})
export class ReporteSobrantesVsFaltantesComponent implements OnInit {

  // FormGroup
  fgMain: FormGroup | any;

  compras: SobrantesVsFaltantes = new SobrantesVsFaltantes('', '', '', '', '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  opcion: number = 0;

  // Progress Bar
  progressBar: boolean = false;

  // PRINCIPAL
  MainDC: string[] = ['puntoventa', 'fecha', 'mnontoSobrante', 'montoFaltante', 'diferencia'];
  MainDS: MatTableDataSource<SobrantesVsFaltantes> = new MatTableDataSource<SobrantesVsFaltantes>();
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

  buscar(): any{

    if(new Date(this.fgMain.get('fechaIni').value).getTime() > new Date(this.fgMain.get('fechaFin').value).getTime()){
      this.funcionesService.showError('La fecha de inicio no puede ser mayor que la fecha final');
      return false;
    }

    this.funcionesService.showLoading();
    this.reportesService.sobranteVsFaltantes(this.fgMain.get('fechaIni').value, this.fgMain.get('fechaFin').value, this.puntoVentas.id).subscribe(response => {
      if(response.status === 200){
        this.funcionesService.hideLoading();
        this.MainDS = new MatTableDataSource<SobrantesVsFaltantes>(response.reportes);
        this.MainDS.paginator = this.pagMain;
      }
    });
  }

    configurarProductoVacio(element: SobrantesVsFaltantes): boolean{
      let retornar: boolean = false;
      if(parseFloat(element.diferencia) < 0){
        retornar = true;
      }

      return retornar;
    }

  generateData() {
    var result: any[] = [];
    var data = this.MainDS.filteredData;


    data.forEach((element: any) => {
      result.push([
        element.puntoventa == null ? '': element.puntoventa,
        element.fecha == null ? '': this.funcionesService.generarFechaLocal4(new Date(element.fecha)),
        element.montoSobrante == null ? '': parseFloat(element.montoSobrante).toFixed(2),
        element.montoFaltante == null ? '': parseFloat(element.montoFaltante).toFixed(2),
        element.diferencia == null ? '': parseFloat(element.diferencia).toFixed(2)
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
    doc.text('Sobrante vs Faltante', 140, 30, {align: "center"});
    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
      margin: {top: 40},
      head: [[ "PUNTO DE VENTA", "FECHA", "MONTO SOBRANTE", "MONTO FALTANTE", "DIFERENCIA"]],
      body: this.generateData()
    });
    doc.save('Reporte_sobrante_vs_faltante.pdf');

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  downloadExcel(){
    this.funcionesService.showLoading();
    this.progressBar = true;

    const title = 'Sobrante vs Faltante';
    const header = [ "PUNTO DE VENTA", "FECHA", "MONTO SOBRANTE", "MONTO FALTANTE", "DIFERENCIA"];
    const data = this.MainDS.filteredData;
    let lista: any[] = [];

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('Reporte Sobrante Vs Faltante');

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
      lista.push(
        element.puntoventa == null ? '': element.puntoventa,
        element.fecha == null ? '': this.funcionesService.generarFechaLocal4(new Date(element.fecha)),
        element.montoSobrante == null ? '': parseFloat(element.montoSobrante).toFixed(2),
        element.montoFaltante == null ? '': parseFloat(element.montoFaltante).toFixed(2),
        element.diferencia == null ? '': parseFloat(element.diferencia).toFixed(2)
      );
      worksheet.addRow(lista);
      lista = [];
    });

    worksheet.addRow([]);

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'Reporte_sobrante_vs_faltante.xlsx');
    });

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

}
