import { Component, Type, OnInit, ViewChild } from '@angular/core';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');
import { saveAs } from 'file-saver';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { Almacenes } from './models/almacenes';
import { ModalalmacenesComponent } from './modalalmacenes/modalalmacenes.component';
import { AlmacenesService } from './service/almacenes.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { MatPaginator } from '@angular/material/paginator';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

// Modals
const MODALS: { [name: string]: Type<any> } = {
  almacenes: ModalalmacenesComponent,
};

@Component({
  selector: 'app-almacenes',
  templateUrl: './almacenes.component.html',
  providers: [ AlmacenesService ],
})
export class AlmacenesComponent implements OnInit {
   // FormGroup
   fgMain: FormGroup | any;

   almacenes: Almacenes = new Almacenes(0, '', '', '', '', '', true, '', 1, '');
   puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
   puntoVentas: PuntosVenta = new PuntosVenta();
   opcion: number = 0;

   // Progress Bar
   progressBar: boolean = false;

   // PRINCIPAL
   MainDC: string[] = ['nombre', 'idUbigeo', 'status', 'acciones'];
   MainDS: MatTableDataSource<Almacenes> = new MatTableDataSource<Almacenes>();
   @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

   NgbModalOptions: NgbModalOptions = {
     size: 'xl',
     centered: true,
     scrollable: true,
     keyboard: false,
     backdrop: 'static',
     windowClass: 'modal-holder'
   };

   lista: Almacenes[] = [];

   constructor(
     public almacenesService: AlmacenesService,
     public funcionesService: FuncionesService,
     private fb: FormBuilder,
     private _modalService: NgbModal
   ) {
     this.new_fgMain();
   }

   new_fgMain(){
     this.fgMain = this.fb.group({
       idPuntoVenta: '',
       nombre: '',
       fechaIni: '',
       fechaFin: '',
       puntoventa:''
     });

     this.fgMain.valueChanges.subscribe((value: any) => {
       const filter = { ...value, name: value.nombre.trim().toLowerCase() } as string;
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
       case 'almacenes':
         obj['opcion'] = this.opcion;
         obj['almacenes'] = this.almacenes;
         obj['lista'] = this.lista;
         modalRef.componentInstance.fromParent = obj;
       break;
     }

     modalRef.result.then(async (result) => {

       switch (result.modal) {
         case 'almacenes':
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

   limpiar(){
     this.fgMain = this.fb.group({
       idPuntoVenta: '',
       nombre: '',
       fechaIni: '',
       fechaFin: '',
       puntoventa:''
     });

     this.loadMain();
   }

   crudRegistros(){
     this.opcion = 1;
     this.openModal('almacenes');
   }

   viewDetail(element: any) {
     this.opcion = 2;
     this.almacenes = element;
     this.openModal('almacenes');
   }

   loadMain() {

     this.almacenesService.obtenerAlmacenes(this.puntoVentas.id).subscribe(response => {

       this.lista = response.almacenes;
       this.MainDS = new MatTableDataSource<Almacenes>(response.almacenes);
       this.MainDS.paginator = this.pagMain;

       this.MainDS.filterPredicate = function(data: Almacenes, filter: string): boolean {
         return data.nombre.trim().toLowerCase().includes(filter);
       };

       this.MainDS.filterPredicate = ((data: Almacenes, filter: any ) => {
         const a = !filter.nombre || data.nombre.trim().toLowerCase().includes(filter.nombre.trim().toLowerCase());
         const b = !filter.idPuntoVenta || parseInt(data.idPuntoVenta) === parseInt(filter.idPuntoVenta);
         const c = !filter.fechaIni ||  new Date(this.funcionesService.formatearFecha4(data.created_at)) > new Date(filter.fechaIni) && new Date(this.funcionesService.formatearFecha4(data.created_at)) < new Date(filter.fechaFin);
         return a && b && c;
       }) as (PeriodicElement: any, string: any) => boolean;

     }, error => {
       console.log(error);
     });
   }

   eliminarRegistro(element: Almacenes){
     this.funcionesService.mensajeConfirmar('¿Desea eliminar este registro?', '', (result: any) => {
       if (result.isConfirmed) {
         this.almacenesService.deleteAlmacenes(element).subscribe(response => {
           this.funcionesService.showLoading();
           if (response.status === 200) {
             this.progressBar = true;
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
         element.direccion == null ? '': element.direccion,
         element.idUbigeo == null ? '': element.ubigeos.nombre,
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
     doc.text("REPORTE ALMACENES", 140, 30, {align: "center"});
     doc.autoTable({
       styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
       margin: {top: 40},
       head: [[ "PUNTO DE VENTA", "NOMBRE", "DIRECCION", "UBIGEO", "OBSERVACIONES", "ESTADO"]],
       body: this.generateData()
     });
     doc.save('Reporte Almacenes.pdf');

     this.funcionesService.hideLoading();
     this.progressBar = false;
   }

   downloadExcel(){
     this.funcionesService.showLoading();
     this.progressBar = true;

     const title = 'REPORTE ALMACENES';
     const header = [ "PUNTO DE VENTA", "NOMBRE", "DIRECCION", "UBIGEO", "OBSERVACIONES", "ESTADO"];
     const data = this.MainDS.filteredData;
     let lista: any[] = [];

     let workbook = new Workbook();
     let worksheet = workbook.addWorksheet('Almacenes');

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
     worksheet.getColumn(5).width = 20;
     worksheet.getColumn(6).width = 20;

     data.forEach((element: any) => {
       lista.push(
        element.idPuntoVenta == null ? '': this.puntoVentas.nombre,
        element.nombre == null ? '': element.nombre,
        element.direccion == null ? '': element.direccion,
        element.idUbigeo == null ? '': element.ubigeos.nombre,
        element.observaciones == null ? '': element.observaciones,
        element.status == true ? 'ACTIVO' : 'INACTIVO'
       );
       worksheet.addRow(lista);
       lista = [];
     });

     worksheet.addRow([]);

     workbook.xlsx.writeBuffer().then((data: any) => {
       const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
       fs.saveAs(blob, 'Reporte Almacenes.xlsx');
     });

     this.funcionesService.hideLoading();
     this.progressBar = false;
   }
}
