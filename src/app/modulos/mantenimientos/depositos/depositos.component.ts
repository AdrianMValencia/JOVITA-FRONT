import { Component, OnInit, Type, ViewChild } from '@angular/core';
import { DepositosService } from './service/depositos.service';
import { ModalDepositosComponent } from './modalDepositos/modalDepositos.component';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Depositos } from './model/depositos';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { NgbModalOptions, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FuncionesService } from '../../../shared/services/funciones.service';
import * as _moment from 'moment';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { PuntosVenta } from '../puntosventa/model/puntosVenta';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');

// Modals
const MODALS: { [name: string]: Type<any> } = {
  depositos: ModalDepositosComponent,
};

const moment = _moment;

@Component({
  selector: 'app-depositos',
  templateUrl: './depositos.component.html',
  providers: [ DepositosService]
})
export class DepositosComponent implements OnInit {

 // FormGroup
 fgMain: FormGroup | any;

 depositos: Depositos = new Depositos(0, '', '', '0', '', '', true, 1);
 puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
 puntoVentas: PuntosVenta = new PuntosVenta();
 opcion: number = 0;

 // Progress Bar
 progressBar: boolean = false;

 // PRINCIPAL
 MainDC: string[] = ['banco', 'fechaDeposito', 'file', 'status', 'acciones'];
 MainDS: MatTableDataSource<Depositos> = new MatTableDataSource<Depositos>();
 @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

 NgbModalOptions: NgbModalOptions = {
   size: 'lg',
   centered: true,
   scrollable: true,
   keyboard: false,
   backdrop: 'static',
   windowClass: 'modal-holder'
 };

 //Combos
 lista: Depositos[] = [];

 constructor(
   public depositosService: DepositosService,
   public funcionesService: FuncionesService,
   private fb: FormBuilder,
   private _modalService: NgbModal
 ) {
   this.new_fgMain();
 }

 new_fgMain(){
   this.fgMain = this.fb.group({
    idPuntoVenta: '',
    fechaIni: '',
    fechaFin: '',
    puntoventa:''
   });

   this.fgMain.valueChanges.subscribe((value: any) => {
     const filter = { ...value, name: value.idPuntoVenta } as string;
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
     case 'depositos':
       obj['opcion'] = this.opcion;
       obj['depositos'] = this.depositos;
       obj['lista'] = this.lista;
       modalRef.componentInstance.fromParent = obj;
     break;
   }

   modalRef.result.then(async (result) => {

     switch (result.modal) {
       case 'depositos':
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
  this.openModal('depositos');
}

 viewDetail(element: any) {
   this.opcion = 2;
   this.depositos = element;
   this.openModal('depositos');
 }

 loadMain() {

   this.depositosService.obtenerDepositos(this.puntoVentas.id).subscribe(response => {

     this.lista = response.depositos;
     this.MainDS = new MatTableDataSource<Depositos>(response.depositos);
     this.MainDS.paginator = this.pagMain;

     this.MainDS.filterPredicate = function(data: Depositos, filter: string): boolean {
       return data.fechaDeposito.includes(filter);
     };

     this.MainDS.filterPredicate = ((data: Depositos, filter: any ) => {
      const a = !filter.idPuntoVenta || parseInt(data.idPuntoVenta) === parseInt(filter.idPuntoVenta);
      const b = !filter.fechaIni ||  new Date(this.funcionesService.formatearFecha4(data.fechaDeposito)) > new Date(filter.fechaIni) && new Date(this.funcionesService.formatearFecha4(data.fechaDeposito)) < new Date(filter.fechaFin);
      return a && b;
     }) as (PeriodicElement: any, string: any) => boolean;
   }, error => {
     console.log(error);
     this.funcionesService.hideLoading();
    this.progressBar = false;
   });
 }

 limpiar(){
  this.fgMain = this.fb.group({
    idPuntoVenta: '',
    fechaIni: '',
    fechaFin: '',
    puntoventa:''
  });

  this.loadMain();
}

eliminarRegistro(element: Depositos){
  this.funcionesService.mensajeConfirmar('¿Desea eliminar este registro?', '', (result: any) => {
    if (result.isConfirmed) {
      this.depositosService.deleteDepositos(element).subscribe(response => {
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
        element.fechaDeposito == null ? '': element.fechaDeposito,
        element.banco == null ? '': element.bancos.nombre,
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
    doc.text("REPORTE DEPOSITOS", 140, 30, {align: "center"});
    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
      margin: {top: 40},
      head: [["PUNTO DE VENTA", "FECHA DEPOSITO", "BANCO", "OBSERVACIONES", "ESTADO"]],
      body: this.generateData()
    });
    doc.save('Reporte Depositos.pdf');

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  downloadExcel(){
    this.funcionesService.showLoading();
    this.progressBar = true;

    const title = 'REPORTE DEPOSITOS';
    const header = ["PUNTO DE VENTA", "FECHA DEPOSITO", "BANCO", "OBSERVACIONES", "ESTADO"];
    const data = this.lista;
    let lista: any[] = [];

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('Depositos');

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

    worksheet.getColumn(1).width = 40;
    worksheet.getColumn(2).width = 20;
    worksheet.getColumn(3).width = 40;
    worksheet.getColumn(4).width = 40;
    worksheet.getColumn(5).width = 20;

    data.forEach((element: any) => {
      lista.push(
        element.idPuntoVenta == null ? '': this.puntoVentas.nombre,
        element.fechaDeposito == null ? '': element.fechaDeposito,
        element.banco == null ? '': element.bancos.nombre,
        element.observaciones == null ? '': element.observaciones,
        element.status == true ? 'ACTIVO' : 'INACTIVO'
      );
      worksheet.addRow(lista);
      lista = [];
    });

    worksheet.addRow([]);

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'Reporte Depositos.xlsx');
    });

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

}
