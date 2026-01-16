import { Component, OnInit, Type, ViewChild } from '@angular/core';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { ModalnumeracionticketsComponent } from './modalnumeraciontickets/modalnumeraciontickets.component';
import { NumeracionticketsService } from './service/numeraciontickets.service';
import { SeriesticketsService } from '../seriestickets/service/seriestickets.service';
import { MatTableDataSource } from '@angular/material/table';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NumeracionTickets } from './models/numeracionTickets';
import { MatPaginator } from '@angular/material/paginator';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { SeriesTickets } from '../seriestickets/models/seriesTickets';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { PuntosVenta } from '../puntosventa/model/puntosVenta';
import { PuntosventaService } from '../puntosventa/service/puntosventa.service';
// Modals
const MODALS: { [name: string]: Type<any> } = {
  numeracionTickets: ModalnumeracionticketsComponent,
};

@Component({
  selector: 'app-numeraciontickets',
  templateUrl: './numeraciontickets.component.html',
  providers: [NumeracionticketsService, SeriesticketsService, PuntosventaService]
})
export class NumeracionticketsComponent implements OnInit {

      // FormGroup
      fgMain: FormGroup | any;

      numeracionTickets: NumeracionTickets = new NumeracionTickets(0, '', '', '', '', '', true);
      puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
      puntoVentas: PuntosVenta = new PuntosVenta();
      opcion: number = 0;

      // Progress Bar
      progressBar: boolean = false;

      // PRINCIPAL
      MainDC: string[] = ['idSeriesTickets', 'numeroInicio', 'numeroFin', 'numeroActual', 'status', 'acciones'];
      MainDS: MatTableDataSource<NumeracionTickets> = new MatTableDataSource<NumeracionTickets>();
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
        private numeracionticketsService: NumeracionticketsService,
        private puntosVentaService: PuntosventaService,
        public funcionesService: FuncionesService,
        private fb: FormBuilder,
        private _modalService: NgbModal
      ) {
        this.new_fgMain();
      }

      new_fgMain(){
        this.fgMain = this.fb.group({
          idPuntoVenta: '',
          idSeriesTickets: '',
          fechaIni: '',
          fechaFin: '',
          puntoventa: ''
        });

        this.fgMain.valueChanges.subscribe((value: any) => {
          const filter = { ...value, idSeriesTickets: value.idSeriesTickets } as string;
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
        this.cargarSeriesTickets();

        this.funcionesService.hideLoading();
        this.progressBar = false;
      }

      cargarSeriesTickets(){
        this.seriesticketsService.obtenerSeriesTickets(this.puntoVentas.id).subscribe(response => {
          this.cboSeriesTickets = response.seriesTickets;
        });
      }

      cargarPuntosVenta(){
        this.puntosVentaService.cargarPuntosVenta().subscribe(response => {
          this.cboPuntoVentas = response.puntosVenta;
        });
      }

      loadMain() {
        this.numeracionticketsService.obtenerNumeracionTickets(this.puntoVentas.id).subscribe(response => {

          this.MainDS = new MatTableDataSource<NumeracionTickets>(response.numeracionTickets);
          this.MainDS.paginator = this.pagMain;

          this.MainDS.filterPredicate = function(data: NumeracionTickets, filter: string): boolean {
            return data.idSeriesTickets.includes(filter);
          };

          this.MainDS.filterPredicate = ((data: NumeracionTickets, filter: any ) => {
            const a = !filter.idSeriesTickets || parseInt(data.idSeriesTickets) === parseInt(filter.idSeriesTickets);
            const b = !filter.fechaIni ||  new Date(this.funcionesService.formatearFecha4(data.created_at)) > new Date(filter.fechaIni) && new Date(this.funcionesService.formatearFecha4(data.created_at)) < new Date(filter.fechaFin);
            return a && b;
          }) as (PeriodicElement: any, string: any) => boolean;
        }, error => {
          console.log(error);
          this.funcionesService.hideLoading();
          this.progressBar = false;
        });
      }

      // selectEvent(event: PuntosVenta){
      //   this.cargarSeriesTickets(event.id);
      // }

      limpiar(){
        this.fgMain = this.fb.group({
          idPuntoVenta: '',
          idSeriesTickets: '',
          fechaIni: '',
          fechaFin: '',
          puntoventa: ''
        });

        this.loadMain();
      }

      crudNumeracionTickets(){
        this.opcion = 1;
        this.openModal('numeracionTickets');
      }

      viewDetail(element: NumeracionTickets) {
        this.opcion = 2;
        this.numeracionTickets = element;
        this.openModal('numeracionTickets');
      }

      openModal(name: string) {

        const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
        const obj: any = new Object();

        switch (name) {
          case 'numeracionTickets':
            obj['opcion'] = this.opcion;
            obj['numeracionTickets'] = this.numeracionTickets;
            obj['lista'] = this.MainDS.filteredData;
            modalRef.componentInstance.fromParent = obj;
          break;
        }

        modalRef.result.then(async (result) => {
          switch (result.modal) {
            case 'numeracionTickets':
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

      eliminarRegistro(element: NumeracionTickets){
        this.funcionesService.mensajeConfirmar('¿Desea eliminar este registro?', '', (result: any) => {
          if (result.isConfirmed) {
            this.numeracionticketsService.deleteNumeracionTickets(element).subscribe(response => {
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
            element.series.serie == null ? 0: element.series.serie,
            element.numeroInicio == null ? '': element.numeroInicio,
            element.numeroFin == null ? '': element.numeroFin,
            element.numeroActual == null ? '': element.numeroActual,
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
        doc.text("REPORTE NUMERACIÓN DE TICKETS", 140, 30, {align: "center"});
        doc.autoTable({
          styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
          margin: {top: 40},
          head: [["SERIES", "NÚMERO DE INICIO", "NÚMERO DE FIN", "NÚMERO ACTUAL", "OBSERVACIONES", "ESTADO"]],
          body: this.generateData()
        });
        doc.save('Reporte Numeracion de Tickets.pdf');

        this.funcionesService.hideLoading();
        this.progressBar = false;
      }

      downloadExcel(){
        this.funcionesService.showLoading();
        this.progressBar = true;

        const title = 'REPORTE NUMERACIÓN DE TICKETS';
        const header = ["SERIES", "NÚMERO DE INICIO", "NÚMERO DE FIN", "NÚMERO ACTUAL", "OBSERVACIONES", "ESTADO"];
        var result: any[] = [];

        let workbook = new Workbook();
        let worksheet = workbook.addWorksheet('Numeracion Tickets');

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

        worksheet.getColumn(1).width = 20;
        worksheet.getColumn(2).width = 20;
        worksheet.getColumn(3).width = 20;
        worksheet.getColumn(4).width = 20;
        worksheet.getColumn(4).width = 40;
        worksheet.getColumn(4).width = 20;

        this.MainDS.filteredData.forEach((element: any) => {
          let status: string = element.status == true ? 'ACTIVO' : 'INACTIVO'
          result.push([
            element.series.serie == null ? 0: element.series.serie,
            element.numeroInicio == null ? '': element.numeroInicio,
            element.numeroFin == null ? '': element.numeroFin,
            element.numeroActual == null ? '': element.numeroActual,
            element.observaciones == null ? '': element.observaciones,
            status
          ]);
          worksheet.addRow(result);
          result = [];
        });

        worksheet.addRow([]);

        workbook.xlsx.writeBuffer().then((data: any) => {
          const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          fs.saveAs(blob, 'Reporte Numeracion de Ticket.xlsx');
        });

        this.funcionesService.hideLoading();
        this.progressBar = false;
      }
}
