import { Component, OnInit, Type, ViewChild } from '@angular/core';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { ModalpuntosventaComponent } from './modalpuntosventa/modalpuntosventa.component';
import { PuntosventaService } from './service/puntosventa.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PuntosVenta } from './model/puntosVenta';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');

// Modals
const MODALS: { [name: string]: Type<any> } = {
  puntosVenta: ModalpuntosventaComponent,
};

@Component({
  selector: 'app-puntosventa',
  templateUrl: './puntosventa.component.html',
  providers: [PuntosventaService],
})
export class PuntosventaComponent implements OnInit {

  // FormGroup
  fgMain: FormGroup | any;

  puntosVenta: PuntosVenta = new PuntosVenta(0, '', '', '0', '', '', '', '', true);
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  opcion: number = 0;

  // Progress Bar
  progressBar: boolean = false;

  // PRINCIPAL
  MainDC: string[] = ['nombre', 'direccion', 'idUbigeo', 'telefono', 'celular', 'correo', 'status', 'acciones'];
  MainDS: MatTableDataSource<PuntosVenta> = new MatTableDataSource<PuntosVenta>();
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
    public puntosVentaService: PuntosventaService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    private _modalService: NgbModal
  ) {
    this.new_fgMain();
  }

  new_fgMain(){
    this.fgMain = this.fb.group({
      nombre: '',
      fechaIni: '',
      fechaFin: ''
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
    this.funcionesService.showLoading();
    this.progressBar = true;

    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.loadMain();

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  loadMain() {

    this.puntosVentaService.obtenerPuntosVenta(this.puntoVentas.id).subscribe(response => {

      this.MainDS = new MatTableDataSource<PuntosVenta>(response.puntosVenta);
      this.MainDS.paginator = this.pagMain;

      this.MainDS.filterPredicate = function(data: PuntosVenta, filter: string): boolean {
        return data.nombre.trim().toLowerCase().includes(filter);
      };

      this.MainDS.filterPredicate = ((data: PuntosVenta, filter: any ) => {
        const a = !filter.nombre || data.nombre.trim().toLowerCase().includes(filter.nombre.trim().toLowerCase());
        const b = !filter.fechaIni ||  new Date(this.funcionesService.formatearFecha4(data.created_at)) > new Date(filter.fechaIni) && new Date(this.funcionesService.formatearFecha4(data.created_at)) < new Date(filter.fechaFin);
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
      nombre: '',
      fechaIni: '',
      fechaFin: ''
    });

    this.loadMain();
  }

  crudPuntoVenta(){
    this.opcion = 1;
    this.openModal('puntosVenta');
  }

  viewDetail(element: PuntosVenta) {
    this.opcion = 2;
    this.puntosVenta = element;
    this.openModal('puntosVenta');
  }

  openModal(name: string) {

    const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
    const obj: any = new Object();

    switch (name) {
      case 'puntosVenta':
        obj['opcion'] = this.opcion;
        obj['puntosVenta'] = this.puntosVenta;
        obj['lista'] = this.MainDS.filteredData;
        modalRef.componentInstance.fromParent = obj;
      break;
    }

    modalRef.result.then(async (result) => {
      switch (result.modal) {
        case 'puntosVenta':
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

  eliminarRegistro(element: PuntosVenta){
    this.funcionesService.mensajeConfirmar('¿Desea eliminar este registro?', '', (result: any) => {
      if (result.isConfirmed) {
        this.puntosVentaService.deletePuntosVenta(element).subscribe(response => {
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

    this.MainDS.filteredData.forEach((element: any) => {

      let status: string = element.status == true ? 'ACTIVO' : 'INACTIVO'
      result.push([
        element.nombre == null ? '': element.nombre,
        element.direccion == null ? '': element.direccion,
        element.ubigeos.ubigeo == null ? '': element.ubigeos.ubigeo,
        element.telefono == null ? '': element.telefono,
        element.celular == null ? '': element.celular,
        element.correo == null ? '': element.correo,
        element.observaciones == null ? '': element.observaciones,
        status
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
    doc.text("REPORTE PUNTOS DE VENTA", 140, 30, {align: "center"});
    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
      margin: {top: 40},
      head: [["NOMBRE", "DIRECCION", "UBIGEO", "TELEFONO", "CELULAR", "CORREO", "OBSERVACIONES", "ESTADO"]],
      body: this.generateData()
    });
    doc.save('Reporte Puntos de Venta.pdf');

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  downloadExcel(){
    this.funcionesService.showLoading();
    this.progressBar = true;

    const title = 'REPORTE PUNTOS DE VENTA';
    const header = ["NOMBRE", "DIRECCION", "UBIGEO", "TELEFONO", "CELULAR", "CORREO", "OBSERVACIONES", "ESTADO"];
    var result: any[] = [];

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('Puntos de Venta');

    // Add new row
    let titleRow = worksheet.addRow([title]);
    // Set font, size and style in title row.
    titleRow.font = { name: 'Arial', family: 4, size: 16, bold: true };

    worksheet.mergeCells(`A1:H1`);
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

    worksheet.getColumn(1).width = 20;
    worksheet.getColumn(2).width = 40;
    worksheet.getColumn(3).width = 20;
    worksheet.getColumn(4).width = 20;
    worksheet.getColumn(5).width = 20;
    worksheet.getColumn(6).width = 20;
    worksheet.getColumn(7).width = 40;
    worksheet.getColumn(8).width = 20;

    this.MainDS.filteredData.forEach((element: any) => {
      let status: string = element.status == true ? 'ACTIVO' : 'INACTIVO'
      result.push(
        element.nombre == null ? '': element.nombre,
        element.direccion == null ? '': element.direccion,
        element.ubigeos.ubigeo == null ? '': element.ubigeos.ubigeo,
        element.telefono == null ? '': element.telefono,
        element.celular == null ? '': element.celular,
        element.correo == null ? '': element.correo,
        element.observaciones == null ? '': element.observaciones,
        status
      );
      worksheet.addRow(result);
      result = [];
    });

    worksheet.addRow([]);

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'Reporte Puntos de Venta.xlsx');
    });

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }
}
