import { Component, OnInit, Type, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ModalBancosComponent } from './modalBancos/modalBancos.component';
import { Bancos } from './model/bancos';
import { BancosService } from './service/bancos.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FuncionesService } from '../../../shared/services/funciones.service';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { PuntosVenta } from '../puntosventa/model/puntosVenta';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');

// Modals
const MODALS: { [name: string]: Type<any> } = {
  bancos: ModalBancosComponent,
};

@Component({
  selector: 'app-bancos',
  templateUrl: './bancos.component.html',
  providers: [BancosService]
})
export class BancosComponent implements OnInit {

  // FormGroup
  fgMain: FormGroup | any;

  bancos: Bancos = new Bancos(0, '', '', '', '', '', '', '', '', '', true, 1);
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  opcion: number = 0;

  // Progress Bar
  progressBar: boolean = false;

  lista: Bancos[] = [];

  // PRINCIPAL
  MainDC: string[] = ['ruc', 'nombre', 'siglas', 'funcionario', 'celular', 'correo', 'status', 'acciones'];
  MainDS: MatTableDataSource<Bancos> = new MatTableDataSource<Bancos>();
  @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

  NgbModalOptions: NgbModalOptions = {
    size: 'xl',
    centered: true,
    scrollable: true,
    keyboard: false,
    backdrop: 'static',
    windowClass: 'modal-holder'
  };

  constructor(
    public bancosService: BancosService,
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
      const filter = { ...value, nombre: value.nombre.trim().toLowerCase() } as string;
      this.MainDS.filter = filter;

      if (this.MainDS.paginator) {
        this.MainDS.paginator.firstPage();
      }
    });
  }

  get getMain() { return this.fgMain.controls; }

  ngOnInit() {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.fgMain.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.fgMain.get('puntoventa').setValue(this.puntoVentas.nombre);
    this.loadMain();
  }

  openModal(name: string) {

    const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
    const obj: any = new Object();

    switch (name) {
      case 'bancos':
        obj['opcion'] = this.opcion;
        obj['bancos'] = this.bancos;
        obj['lista'] = this.lista;
        modalRef.componentInstance.fromParent = obj;
      break;
    }

    modalRef.result.then(async (result) => {

      switch (result.modal) {
        case 'bancos':
          if (result.value === 'loadAgain') {
            await this.loadMain();
          }
          break;
      }

    }, (reason) => { });
  }

  crudRegistros(){
    this.opcion = 1;
    this.openModal('bancos');
  }

  viewDetail(element: any) {
    this.opcion = 2;
    this.bancos = element;
    this.openModal('bancos');
  }

  loadMain() {

    this.funcionesService.showLoading();
    this.bancosService.obtenerBancos(this.puntoVentas.id).subscribe(response => {

      this.funcionesService.hideLoading();
      this.lista = response.bancos;
      this.MainDS = new MatTableDataSource<Bancos>(response.bancos);
      this.MainDS.paginator = this.pagMain;

      this.MainDS.filterPredicate = function(data: Bancos, filter: string): boolean {
        return data.nombre.trim().toLowerCase().includes(filter);
      };

      this.MainDS.filterPredicate = ((data: Bancos, filter: any ) => {
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

  eliminarRegistro(element: Bancos){
    this.funcionesService.mensajeConfirmar('¿Desea eliminar este registro?', '', (result: any) => {
      if (result.isConfirmed) {
        this.bancosService.deleteBancos(element).subscribe(response => {
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
        element.ruc == null ? '': element.ruc,
        element.nombre == null ? '': element.nombre,
        element.siglas == null ? '': element.siglas,
        element.funcionario == null ? '': element.funcionario,
        element.telefono == null ? '': element.telefono,
        element.celular == null ? '': element.celular,
        element.correo == null ? '': element.correo,
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
    doc.text("REPORTE BANCOS", 140, 30, {align: "center"});
    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
      margin: {top: 40},
      head: [["PUNTO DE VENTA", "RUC", "BANCO", "SIGLAS", "FUNCIONARIO", "TELEFONO", "CELULAR", "CORREO", "OBSERVACIONES", "ESTADO"]],
      body: this.generateData()
    });
    doc.save('Reporte Bancos.pdf');

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  downloadExcel(){
    this.funcionesService.showLoading();
    this.progressBar = true;

    const title = 'REPORTE BANCOS';
    const header = ["PUNTO DE VENTA", "RUC", "BANCO", "SIGLAS", "FUNCIONARIO", "TELEFONO", "CELULAR", "CORREO", "OBSERVACIONES", "ESTADO"];
    const data = this.MainDS.filteredData;
    let lista: any[] = [];

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('Bancos');

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
    worksheet.getColumn(2).width = 20;
    worksheet.getColumn(3).width = 40;
    worksheet.getColumn(4).width = 30;
    worksheet.getColumn(5).width = 40;
    worksheet.getColumn(6).width = 20;
    worksheet.getColumn(7).width = 20;
    worksheet.getColumn(8).width = 20;
    worksheet.getColumn(9).width = 50;
    worksheet.getColumn(10).width = 20;

    data.forEach((element: any) => {
      lista.push(
        element.idPuntoVenta == null ? '': this.puntoVentas.nombre,
        element.ruc == null ? '': element.ruc,
        element.nombre == null ? '': element.nombre,
        element.siglas == null ? '': element.siglas,
        element.funcionario == null ? '': element.funcionario,
        element.telefono == null ? '': element.telefono,
        element.celular == null ? '': element.celular,
        element.correo == null ? '': element.correo,
        element.observaciones == null ? '': element.observaciones,
        element.status == true ? 'ACTIVO' : 'INACTIVO'
      );
      worksheet.addRow(lista);
      lista = [];
    });

    worksheet.addRow([]);

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'Reporte Bancos.xlsx');
    });

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }
}
