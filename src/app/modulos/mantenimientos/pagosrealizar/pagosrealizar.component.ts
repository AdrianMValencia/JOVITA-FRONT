import { Component, Type, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

import { PuntosVenta } from '../puntosventa/model/puntosVenta';
import { ModalpagosrealizarComponent } from './modalpagosrealizar/modalpagosrealizar.component';
import { PagosRealizar } from './models/pagosrealizar';
import { PagosrealizarService } from './service/pagosrealizar.service';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');

// Modals
const MODALS: { [name: string]: Type<any> } = {
  pagos: ModalpagosrealizarComponent,
};

@Component({
  selector: 'app-pagosrealizar',
  templateUrl: './pagosrealizar.component.html',
  providers: [PagosrealizarService]
})
export class PagosrealizarComponent implements OnInit {

  // FormGroup
  fgMain: FormGroup | any;

  pagos: PagosRealizar = new PagosRealizar(0, '', '', '0', '0', '0', '0', '', '', '', 1, true, '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  opcion: number = 0;

  // Progress Bar
  progressBar: boolean = false;

  // PRINCIPAL
  MainDC: string[] = ['nombre', 'periodicidad', 'tipo', 'idBanco', 'idMoneda', 'cantidad', 'monto', 'detalles', 'status', 'acciones'];
  MainDS: MatTableDataSource<PagosRealizar> = new MatTableDataSource<PagosRealizar>();
  @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

  NgbModalOptions: NgbModalOptions = {
    size: 'xl',
    centered: true,
    scrollable: true,
    keyboard: false,
    backdrop: 'static',
    windowClass: 'modal-holder'
  };

  listaNombres: string[] = [];

  constructor(
    public pagosrealizarService: PagosrealizarService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    private _modalService: NgbModal
  ) {
    this.new_fgMain();
  }

  new_fgMain(){
    this.fgMain = this.fb.group({
      nombre: '',
      idPuntoVenta: '',
      fechaIni: '',
      fechaFin: '',
      puntoventa:''
    });

    this.fgMain.valueChanges.subscribe((value: any) => {
      const filter = { ...value, nombre: value.nombre } as string;
      this.MainDS.filter = filter;

      if (this.MainDS.paginator) {
        this.MainDS.paginator.firstPage();
      }
    });
  }

  get getMain() { return this.fgMain.controls; }

  ngOnInit() {
    this.funcionesService.showLoading();
    this.progressBar = true;

    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.fgMain.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.fgMain.get('puntoventa').setValue(this.puntoVentas.nombre);

    this.loadMain();
    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  openModal(name: string) {

    const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
    const obj: any = new Object();

    switch (name) {
      case 'pagos':
        obj['opcion'] = this.opcion;
        obj['pagos'] = this.pagos;
        obj['lista'] = this.MainDS.filteredData;
        modalRef.componentInstance.fromParent = obj;
      break;
    }

    modalRef.result.then(async (result) => {

      switch (result.modal) {
        case 'pagos':
          if (result.value === 'loadAgain') {

            this.funcionesService.showLoading();
            this.progressBar = true;
            await this.loadMain();
            this.funcionesService.hideLoading();
            this.progressBar = false;
          }
          break;
      }

    }, (reason) => { });
  }

  crudRegistros(){
    this.opcion = 1;
    this.openModal('pagos');
  }

  viewDetail(element: any) {
    this.opcion = 2;
    this.pagos = element;
    this.openModal('pagos');
  }

  loadMain() {

    this.pagosrealizarService.obtenerPagosRealizar(this.puntoVentas.id).subscribe(response => {

      this.MainDS = new MatTableDataSource<PagosRealizar>(response.pagosRealizar);
      this.MainDS.paginator = this.pagMain;

      // Llenar listaNombres con los nombres únicos
      this.listaNombres = response.pagosRealizar.map((p: any) => p.nombre).filter((v: string, i: number, a: string[]) => v && a.indexOf(v) === i);

      this.MainDS.filterPredicate = function(data: PagosRealizar, filter: string): boolean {
        return data.nombre.trim().toLowerCase().includes(filter);
      };

      this.MainDS.filterPredicate = ((data: PagosRealizar, filter: any ) => {
        const a = !filter.nombre || data.nombre.trim().toLowerCase().includes(filter.nombre.trim().toLowerCase());
        const b = !filter.idPuntoVenta || parseInt(data.idPuntoVenta) === parseInt(filter.idPuntoVenta);
        const c = !filter.fechaIni ||  new Date(this.funcionesService.formatearFecha4(data.created_at)) > new Date(filter.fechaIni) && new Date(this.funcionesService.formatearFecha4(data.created_at)) < new Date(filter.fechaFin);
        return a && b && c;
      }) as (PeriodicElement: any, string: any) => boolean;

    }, error => {
      console.log(error);
      this.funcionesService.hideLoading();
      this.progressBar = false;
    });
  }

  limpiar(){
    this.fgMain = this.fb.group({
      nombre: '',
      idPuntoVenta: '',
      fechaIni: '',
      fechaFin: '',
      puntoventa:''
    });

    this.loadMain();
  }

  eliminarRegistro(element: PagosRealizar){
    this.funcionesService.mensajeConfirmar('¿Desea eliminar este registro?', '', (result: any) => {
      if (result.isConfirmed) {
        this.pagosrealizarService.deletePagosRealizar(element).subscribe(response => {
          this.funcionesService.showLoading();
          this.progressBar = true;

          if (response.status === 200) {
            this.funcionesService.showSuccess(response.message);
            this.loadMain();
            this.funcionesService.hideLoading();
            this.progressBar = false;
          }
          else {
            this.funcionesService.showError(response.message);
            this.funcionesService.hideLoading();
            this.progressBar = false;
            return;
          }
        }, (err: any) => {
          console.log(err);
          this.funcionesService.hideLoading();
            this.progressBar = false;
        });
      }
    });
  }

  generateData() {
    var result: any[] = [];
    var data = this.MainDS.filteredData;

    data.forEach((element: any) => {

      result.push([
        element.idPuntoVenta == null ? '': this.puntoVentas.nombre,
        element.nombre == null ? '': element.nombre,
        element.periodicidad == null ? '': element.periodicidades.titulo,
        element.tipo == null ? '': element.tipos.titulo,
        element.idBanco == null ? '': element.bancos.nombre,
        element.idMoneda == null ? '': element.monedas.moneda,
        element.cantidad == null ? '': element.cantidad,
        element.monto == null ? '': element.monto,
        element.observaciones == null ? '': element.observaciones,
        element.status == true ? 'ACTIVO' : 'INACTIVO'
      ]);

    });

    return result;
  }

  downloadPDF(){
    this.funcionesService.showLoading();
    this.progressBar = true;

    var doc = new jsPDF.default('landscape');
    doc.setFontSize(30);
    doc.setFont("arial", "bold");
    doc.getLineHeight();
    doc.text("REPORTE PAGOS A REALIZAR", 140, 30, {align: "center"});
    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
      margin: {top: 40},
      head: [["PUNTO DE VENTA", "NOMBRE", "PERIODICIDAD", "TIPO", "BANCO", "MONEDA", "CANTIDAD", "MONTO", "OBSERVACIONES", "ESTADO"]],
      body: this.generateData()
    });
    doc.save('Reporte Pagos a Realizar.pdf');

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  downloadExcel(){
    this.funcionesService.showLoading();
    this.progressBar = true;

    const title = 'REPORTE PAGOS A REALIZAR';
    const header = ["PUNTO DE VENTA", "NOMBRE", "PERIODICIDAD", "TIPO", "BANCO", "MONEDA", "CANTIDAD", "MONTO", "OBSERVACIONES", "ESTADO"];
    const data = this.MainDS.filteredData;
    let lista: any[] = [];

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('Pagos a Realizar');

    // Add new row
    let titleRow = worksheet.addRow([title]);
    // Set font, size and style in title row.
    titleRow.font = { name: 'Arial', family: 4, size: 16, bold: true };

    worksheet.mergeCells(`A1:J1`);
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

    worksheet.getColumn(1).width = 40;
    worksheet.getColumn(2).width = 40;
    worksheet.getColumn(3).width = 10;
    worksheet.getColumn(4).width = 10;
    worksheet.getColumn(5).width = 40;
    worksheet.getColumn(6).width = 40;
    worksheet.getColumn(7).width = 10;
    worksheet.getColumn(8).width = 10;
    worksheet.getColumn(9).width = 40;
    worksheet.getColumn(10).width = 20;

    data.forEach((element: any) => {
      lista.push(
        element.idPuntoVenta == null ? '': this.puntoVentas.nombre,
        element.nombre == null ? '': element.nombre,
        element.periodicidad == null ? '': element.periodicidades.titulo,
        element.tipo == null ? '': element.tipos.titulo,
        element.idBanco == null ? '': element.bancos.nombre,
        element.idMoneda == null ? '': element.monedas.moneda,
        element.cantidad == null ? '': element.cantidad,
        element.monto == null ? '': element.monto,
        element.observaciones == null ? '': element.observaciones,
        element.status == true ? 'ACTIVO' : 'INACTIVO'
      );
      worksheet.addRow(lista);
      lista = [];
    });

    worksheet.addRow([]);

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'Reporte Pagos a Realizar.xlsx');
    });

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }
}
