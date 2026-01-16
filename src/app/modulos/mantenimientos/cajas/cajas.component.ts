import { Component, Type, OnInit, ViewChild } from '@angular/core';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { ModalcajasComponent } from './modalcajas/modalcajas.component';
import { PuntosventaService } from '../puntosventa/service/puntosventa.service';
import { SeriesticketsService } from '../seriestickets/service/seriestickets.service';
import { CajasService } from './service/cajas.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Cajas } from './models/cajas';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { MatPaginator } from '@angular/material/paginator';
import { SeriesTickets } from '../seriestickets/models/seriesTickets';
import { PuntosVenta } from '../puntosventa/model/puntosVenta';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
// Modals
const MODALS: { [name: string]: Type<any> } = {
  cajas: ModalcajasComponent,
};

@Component({
  selector: 'app-cajas',
  templateUrl: './cajas.component.html',
  providers: [CajasService, SeriesticketsService, PuntosventaService]
})
export class CajasComponent implements OnInit {

   // FormGroup
   fgMain: FormGroup | any;

   cajas: Cajas = new Cajas(0, '', '', '', true);
   puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
   puntoVentas: PuntosVenta = new PuntosVenta();
   opcion: number = 0;

   // Progress Bar
   progressBar: boolean = false;

   // PRINCIPAL
   MainDC: string[] = ['idSeriesTickets', 'nombre', 'status', 'acciones'];
   MainDS: MatTableDataSource<Cajas> = new MatTableDataSource<Cajas>();
   @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

   NgbModalOptions: NgbModalOptions = {
     size: 'xl',
     centered: true,
     scrollable: true,
     keyboard: false,
     backdrop: 'static',
     windowClass: 'modal-holder'
   };

   cboSeriesTickets: SeriesTickets[] = [];
   cboPuntoVentas: PuntosVenta[] = [];

   constructor(
    public seriesticketsService: SeriesticketsService,
    private cajasService: CajasService,
    private puntosVentaService: PuntosventaService,
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
      idSeriesTickets: '',
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
    this.funcionesService.showLoading();
    this.progressBar = true;

    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.fgMain.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.fgMain.get('puntoventa').setValue(this.puntoVentas.nombre);
    this.loadMain();
    // this.cargarPuntosVenta();
    this.cargarSeriesTickets(this.puntoVentas.id);

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  cargarSeriesTickets(idPuntoVenta: number){
    this.seriesticketsService.obtenerSeriesTickets(idPuntoVenta).subscribe(response => {
      this.cboSeriesTickets = response.seriesTickets;
    });
  }

  cargarPuntosVenta(){
    this.puntosVentaService.cargarPuntosVenta().subscribe(response => {
      this.cboPuntoVentas = response.puntosVenta;
    });
  }

  loadMain() {
    this.cajasService.obtenerCajas(this.puntoVentas.id).subscribe(response => {

      this.MainDS = new MatTableDataSource<Cajas>(response.cajas);
      this.MainDS.paginator = this.pagMain;

      this.MainDS.filterPredicate = function(data: Cajas, filter: string): boolean {
        return data.nombre.trim().toLowerCase().includes(filter);
      };

      this.MainDS.filterPredicate = ((data: Cajas, filter: any ) => {
        const a = !filter.nombre || data.nombre.trim().toLowerCase().include(filter.nombre.trim().toLowerCase());
        const b = !filter.idSerieTicket || parseInt(data.idSerieTicket) === parseInt(filter.idSerieTicket);
        const c = !filter.fechaIni ||  new Date(this.funcionesService.formatearFecha4(data.created_at)) > new Date(filter.fechaIni) && new Date(this.funcionesService.formatearFecha4(data.created_at)) < new Date(filter.fechaFin);
        return a && b && c;
      }) as (PeriodicElement: any, string: any) => boolean;
    }, error => {
      console.log(error);
      this.funcionesService.hideLoading();
      this.progressBar = false;
    });
  }

  selectEvent(event: PuntosVenta){
    this.cargarSeriesTickets(event.id);
  }

  limpiar(){
    this.fgMain = this.fb.group({
      nombre: '',
      idPuntoVenta: '',
      idSeriesTickets: '',
      fechaIni: '',
      fechaFin: ''
    });

    this.loadMain();
  }

  crudRegistros(){
    this.opcion = 1;
    this.openModal('cajas');
  }

  viewDetail(element: Cajas) {
    this.opcion = 2;
    this.cajas = element;
    this.openModal('cajas');
  }

  openModal(name: string) {

    const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
    const obj: any = new Object();

    switch (name) {
      case 'cajas':
        obj['opcion'] = this.opcion;
        obj['cajas'] = this.cajas;
        obj['lista'] = this.MainDS.filteredData;
        modalRef.componentInstance.fromParent = obj;
      break;
    }

    modalRef.result.then(async (result) => {
      switch (result.modal) {
        case 'cajas':
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
        this.cajasService.deleteCajas(element).subscribe(response => {
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
        element.series.serie == null ? '': element.series.serie,
        element.nombre == null ? '': element.nombre,
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
    doc.text("REPORTE DE CAJAS", 140, 30, {align: "center"});
    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
      margin: {top: 40},
      head: [["SERIES", "NOMBRE", "OBSERVACIONES", "ESTADO"]],
      body: this.generateData()
    });
    doc.save('Reporte de Cajas.pdf');

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  downloadExcel(){
    this.funcionesService.showLoading();
    this.progressBar = true;

    const title = 'REPORTE DE CAJAS';
    const header = ["SERIES", "NOMBRE", "OBSERVACIONES", "ESTADO"];
    var result: any[] = [];

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('Cajas');

    // Add new row
    let titleRow = worksheet.addRow([title]);
    // Set font, size and style in title row.
    titleRow.font = { name: 'Arial', family: 4, size: 16, bold: true };

    worksheet.mergeCells(`A1:D1`);
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
    worksheet.getColumn(2).width = 20;
    worksheet.getColumn(3).width = 40;
    worksheet.getColumn(4).width = 20;

    this.MainDS.filteredData.forEach((element: any) => {
      let status: string = element.status == true ? 'ACTIVO' : 'INACTIVO'
      result.push([
        element.series.serie == null ? '': element.series.serie,
        element.nombre == null ? '': element.nombre,
        element.observaciones == null ? '': element.observaciones,
        status
      ]);
      worksheet.addRow(result);
      result = [];
    });

    worksheet.addRow([]);

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'Reporte de Cajas.xlsx');
    });

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }
}
