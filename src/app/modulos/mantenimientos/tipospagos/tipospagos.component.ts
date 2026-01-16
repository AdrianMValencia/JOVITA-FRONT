import { Component, Type, OnInit, ViewChild } from '@angular/core';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { ModaltipospagoComponent } from './modaltipospago/modaltipospago.component';
import { TipospagoService } from './service/tipospago.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TiposPago } from './models/tiposPago';
import { PuntosVenta } from '../puntosventa/model/puntosVenta';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');

// Modals
const MODALS: { [name: string]: Type<any> } = {
  tiposPago: ModaltipospagoComponent,
};

@Component({
  selector: 'app-tipospagos',
  templateUrl: './tipospagos.component.html',
  providers: [TipospagoService]
})
export class TipospagosComponent implements OnInit {
    // FormGroup
    fgMain: FormGroup | any;

    tiposPago: TiposPago = new TiposPago(0, '', '', '', true, '', 1);
    puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
    puntoVentas: PuntosVenta = new PuntosVenta();
    opcion: number = 0;

    // Progress Bar
    progressBar: boolean = false;

    // PRINCIPAL
    MainDC: string[] = ['nombre', 'status', 'acciones'];
    MainDS: MatTableDataSource<TiposPago> = new MatTableDataSource<TiposPago>();
    @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

    NgbModalOptions: NgbModalOptions = {
      size: 'lg',
      centered: true,
      scrollable: true,
      keyboard: false,
      backdrop: 'static',
      windowClass: 'modal-holder'
    };

    constructor(
      public tipospagoService: TipospagoService,
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
      this.funcionesService.hideLoading();
      this.progressBar = false;
    }

    openModal(name: string) {

      const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
      const obj: any = new Object();

      switch (name) {
        case 'tiposPago':
          obj['opcion'] = this.opcion;
          obj['tiposPago'] = this.tiposPago;
          obj['lista'] = this.MainDS.filteredData;
          modalRef.componentInstance.fromParent = obj;
        break;
      }

      modalRef.result.then(async (result) => {

        switch (result.modal) {
          case 'tiposPago':
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
      this.openModal('tiposPago');
    }

    viewDetail(element: any) {
      this.opcion = 2;
      this.tiposPago = element;
      this.openModal('tiposPago');
    }

    loadMain() {

      this.tipospagoService.obtenerTiposPago(this.puntoVentas.id).subscribe(response => {

        this.MainDS = new MatTableDataSource<TiposPago>(response.tiposPago);
        this.MainDS.paginator = this.pagMain;

        this.MainDS.filterPredicate = function(data: TiposPago, filter: string): boolean {
          return data.nombre.trim().toLowerCase().includes(filter);
        };

        this.MainDS.filterPredicate = ((data: TiposPago, filter: any ) => {
          const a = !filter.idPuntoVenta || parseInt(data.idPuntoVenta) === parseInt(filter.idPuntoVenta);
          const b = !filter.nombre || data.nombre.trim().toLowerCase().includes(filter.nombre.trim().toLowerCase());
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
        idPuntoVenta: '',
        nombre: '',
        fechaIni: '',
        fechaFin: '',
        puntoventa:''
      });

      this.loadMain();
    }

    eliminarRegistro(element: TiposPago){
      this.funcionesService.mensajeConfirmar('¿Desea eliminar este registro?', '', (result: any) => {
        if (result.isConfirmed) {
          this.tipospagoService.deleteTiposPago(element).subscribe(response => {
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
      doc.text("REPORTE TIPOS DE PAGO", 140, 30, {align: "center"});
      doc.autoTable({
        styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
        margin: {top: 40},
        head: [["PUNTO DE VENTA", "NOMBRE", "OBSERVACIONES", "ESTADO"]],
        body: this.generateData()
      });
      doc.save('Reporte Tipos de Pago.pdf');

      this.funcionesService.hideLoading();
      this.progressBar = false;
    }

    downloadExcel(){
      this.funcionesService.showLoading();
      this.progressBar = true;

      const title = 'REPORTE TIPOS DE PAGO';
      const header = ["PUNTO DE VENTA", "NOMBRE", "OBSERVACIONES", "ESTADO"];
      const data = this.MainDS.filteredData;
      let lista: any[] = [];

      let workbook = new Workbook();
      let worksheet = workbook.addWorksheet('Tipos de Pago');

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

      worksheet.getColumn(1).width = 40;
      worksheet.getColumn(2).width = 40;
      worksheet.getColumn(3).width = 40;
      worksheet.getColumn(4).width = 30;

      data.forEach((element: any) => {
        lista.push(
          element.idPuntoVenta == null ? '': this.puntoVentas.nombre,
          element.nombre == null ? '': element.nombre,
          element.observaciones == null ? '': element.observaciones,
          element.status == true ? 'ACTIVO' : 'INACTIVO'
        );
        worksheet.addRow(lista);
        lista = [];
      });

      worksheet.addRow([]);

      workbook.xlsx.writeBuffer().then((data: any) => {
        const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        fs.saveAs(blob, 'Reporte Tipos de Pago.xlsx');
      });

      this.funcionesService.hideLoading();
      this.progressBar = false;
    }
}
