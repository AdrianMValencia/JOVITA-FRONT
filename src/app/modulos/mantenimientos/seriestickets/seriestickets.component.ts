import { Component, OnInit, Type, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { ModalseriesticketsComponent } from './modalseriestickets/modalseriestickets.component';
import { SeriesticketsService } from './service/seriestickets.service';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { SeriesTickets } from './models/seriesTickets';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { PuntosVenta } from '../puntosventa/model/puntosVenta';
import { PuntosventaService } from '../puntosventa/service/puntosventa.service';
// Modals
const MODALS: { [name: string]: Type<any> } = {
  seriesTickets: ModalseriesticketsComponent,
};

@Component({
  selector: 'app-seriestickets',
  templateUrl: './seriestickets.component.html',
  providers: [SeriesticketsService, PuntosventaService],
})
export class SeriesticketsComponent implements OnInit {

    // FormGroup
    fgMain: FormGroup | any;

    seriesTickets: SeriesTickets = new SeriesTickets(0, '', '', '', true);
    puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
    puntoVentas: PuntosVenta = new PuntosVenta();
    opcion: number = 0;

    // Progress Bar
    progressBar: boolean = false;

    // PRINCIPAL
    MainDC: string[] = ['serie', 'idPuntoVenta', 'status', 'acciones'];
    MainDS: MatTableDataSource<SeriesTickets> = new MatTableDataSource<SeriesTickets>();
    @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

    NgbModalOptions: NgbModalOptions = {
      size: 'xl',
      centered: true,
      scrollable: true,
      keyboard: false,
      backdrop: 'static',
      windowClass: 'modal-holder'
    };

    cboPuntoVentas: PuntosVenta[] = [];

    constructor(
      public seriesticketsService: SeriesticketsService,
      private puntosVentaService: PuntosventaService,
      public funcionesService: FuncionesService,
      private fb: FormBuilder,
      private _modalService: NgbModal
    ) {
      this.new_fgMain();
    }

    new_fgMain(){
      this.fgMain = this.fb.group({
        serie: '',
        idPuntoVenta: '',
        fechaIni: '',
        fechaFin: '',
        puntoventa: ''
      });

      this.fgMain.valueChanges.subscribe((value: any) => {
        const filter = { ...value, serie: value.serie.trim().toLowerCase() } as string;
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

      this.funcionesService.hideLoading();
      this.progressBar = false;
    }

    cargarPuntosVenta(){
      this.puntosVentaService.cargarPuntosVenta().subscribe(response => {
        this.cboPuntoVentas = response.puntosVenta;
      });
    }

    loadMain() {

      this.seriesticketsService.cargarSeriesTickets(this.puntoVentas.id).subscribe(response => {

        this.MainDS = new MatTableDataSource<SeriesTickets>(response.seriesTickets);
        this.MainDS.paginator = this.pagMain;

        this.MainDS.filterPredicate = function(data: SeriesTickets, filter: string): boolean {
          return data.serie.trim().toLowerCase().includes(filter);
        };

        this.MainDS.filterPredicate = ((data: SeriesTickets, filter: any ) => {
          const a = !filter.serie || data.serie.trim().toLowerCase().includes(filter.serie.trim().toLowerCase());
          // const b = !filter.idPuntoVenta || parseInt(data.idPuntoVenta) === parseInt(filter.idPuntoVenta);
          const c = !filter.fechaIni ||  new Date(this.funcionesService.formatearFecha4(data.created_at)) > new Date(filter.fechaIni) && new Date(this.funcionesService.formatearFecha4(data.created_at)) < new Date(filter.fechaFin);
          return a && c;
        }) as (PeriodicElement: any, string: any) => boolean;
      }, error => {
        console.log(error);
        this.funcionesService.hideLoading();
        this.progressBar = false;
      });
    }

    limpiar(){
      this.fgMain = this.fb.group({
        serie: '',
        fechaIni: '',
        fechaFin: ''
      });

      this.loadMain();
    }

    crudSeriesTickets(){
      this.opcion = 1;
      this.openModal('seriesTickets');
    }

    viewDetail(element: SeriesTickets) {
      this.opcion = 2;
      this.seriesTickets = element;
      this.openModal('seriesTickets');
    }

    openModal(name: string) {

      const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
      const obj: any = new Object();

      switch (name) {
        case 'seriesTickets':
          obj['opcion'] = this.opcion;
          obj['seriesTickets'] = this.seriesTickets;
          obj['lista'] = this.MainDS.filteredData;
          modalRef.componentInstance.fromParent = obj;
        break;
      }

      modalRef.result.then(async (result) => {
        switch (result.modal) {
          case 'seriesTickets':
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

    eliminarRegistro(element: SeriesTickets){
      this.funcionesService.mensajeConfirmar('¿Desea eliminar este registro?', '', (result: any) => {
        if (result.isConfirmed) {
          this.seriesticketsService.deleteSeriesTickets(element).subscribe(response => {
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
          element.serie == null ? '': element.serie,
          element.puntoventa.nombre == null ? '': element.puntoventa.nombre,
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
      doc.text("REPORTE SERIES TICKETS", 140, 30, {align: "center"});
      doc.autoTable({
        styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
        margin: {top: 40},
        head: [["SERIES", "PUNTO DE VENTA", "OBSERVACIONES", "ESTADO"]],
        body: this.generateData()
      });
      doc.save('Reporte Series Tickets.pdf');

      this.funcionesService.hideLoading();
      this.progressBar = false;
    }

    downloadExcel(){
      this.funcionesService.showLoading();
      this.progressBar = true;

      const title = 'REPORTE SERIES TICKETS';
      const header = ["SERIES", "PUNTO DE VENTA", "OBSERVACIONES", "ESTADO"];
      var result: any[] = [];

      let workbook = new Workbook();
      let worksheet = workbook.addWorksheet('Series Tickets');

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
          element.serie == null ? '': element.serie,
          element.puntoventa.nombre == null ? '': element.puntoventa.nombre,
          element.observaciones == null ? '': element.observaciones,
          status
        ]);
        worksheet.addRow(result);
        result = [];
      });

      worksheet.addRow([]);

      workbook.xlsx.writeBuffer().then((data: any) => {
        const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        fs.saveAs(blob, 'Reporte Series Ticket.xlsx');
      });

      this.funcionesService.hideLoading();
      this.progressBar = false;
    }
}
