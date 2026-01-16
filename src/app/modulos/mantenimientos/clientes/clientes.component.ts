import { Component, OnInit, ViewChild, Type } from '@angular/core';
import { ModalClientesComponent } from './ModalClientes/ModalClientes.component';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Clientes } from './Model/clientes';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { NgbModalOptions, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientesService } from './Service/clientes.service';
import { FuncionesService, APP_DATE_FORMATS } from '../../../shared/services/funciones.service';
import { TipoCliente } from './Model/tipoCliente';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { PuntosVenta } from '../puntosventa/model/puntosVenta';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');

// Modals
const MODALS: { [name: string]: Type<any> } = {
  clientes: ModalClientesComponent,
};

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  providers: [ ClientesService],
})
export class ClientesComponent implements OnInit {

    // FormGroup
    fgMain: FormGroup | any;

    clientes: Clientes = new Clientes(0, '0', '0', '', '', '', '0', '', '', '', '', '', '', '1', true);
    puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
    puntoVentas: PuntosVenta = new PuntosVenta();
    opcion: number = 0;

    // Progress Bar
    progressBar: boolean = false;

    // PRINCIPAL
    MainDC: string[] = ['nombre', 'numeroDoi', 'correo', 'celular', 'imagen', 'status', 'acciones'];
    MainDS: MatTableDataSource<Clientes> = new MatTableDataSource<Clientes>();
    @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

    NgbModalOptions: NgbModalOptions = {
      size: 'xl',
      centered: true,
      scrollable: true,
      keyboard: false,
      backdrop: 'static',
      windowClass: 'modal-holder'
    };

    //Combos
    cboTipoCliente: TipoCliente[] = [];

    constructor(
      public clientesService: ClientesService,
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
      this.funcionesService.showLoading();
      this.progressBar = true;

      this.puntoVentas = JSON.parse(this.puntoVentaStorage);
      this.fgMain.get('idPuntoVenta').setValue(this.puntoVentas.id);
      this.fgMain.get('puntoventa').setValue(this.puntoVentas.nombre);

      this.cargarTipoCliente();
      this.loadMain();
      this.funcionesService.hideLoading();
      this.progressBar = false;
    }

    openModal(name: string) {

      const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
      const obj: any = new Object();

      switch (name) {
        case 'clientes':
          obj['opcion'] = this.opcion;
          obj['clientes'] = this.clientes;
          obj['lista'] = this.MainDS.filteredData;
          modalRef.componentInstance.fromParent = obj;
        break;
      }

      modalRef.result.then(async (result) => {

        switch (result.modal) {
          case 'clientes':
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
      this.openModal('clientes');
    }

    viewDetail(element: any) {
      this.opcion = 2;
      this.clientes = element;
      this.openModal('clientes');
    }

    loadMain() {

      this.clientesService.obtenerClientes(this.puntoVentas.id).subscribe(response => {

        this.MainDS = new MatTableDataSource<Clientes>(response.clientes);
        this.MainDS.paginator = this.pagMain;

        this.MainDS.filterPredicate = function(data: Clientes, filter: string): boolean {
          return data.nombre.trim().toLowerCase().includes(filter);
        };

        this.MainDS.filterPredicate = ((data: Clientes, filter: any ) => {
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

    cargarTipoCliente(){
      this.clientesService.cargarTipoCliente().subscribe(response => {
        this.cboTipoCliente = response.tipos;
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

    eliminarRegistro(element: Clientes){
      this.funcionesService.mensajeConfirmar('¿Desea eliminar este registro?', '', (result: any) => {
        if (result.isConfirmed) {
          this.clientesService.deleteClientes(element).subscribe(response => {
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
          element.tipo == null ? '': element.tipoDoi.tipo,
          element.numeroDoi == null ? '': element.numeroDoi,
          element.nombre == null ? '': element.nombre,
          element.direccion == null ? '': element.direccion,
          element.ubigeo == null ? '': element.ubigeo.ubigeo,
          element.pais == null ? '': element.pais,
          element.correo == null ? '': element.correo,
          element.celular == null ? '': element.celular,
          element.telefono == null ? '': element.telefono,
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
      doc.text("REPORTE CLIENTES", 140, 30, {align: "center"});
      doc.autoTable({
        styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
        margin: {top: 40},
        head: [["PUNTO DE VENTA", "TIPO DOCUMENTO", "NÚMERO", "RAZÓN SOCIAL", "DIRECCIÓN", "UBIGEO", "PAIS", "CORREO", "CELULAR", "TELÉFONO", "OBSERVACIONES", "ESTADO"]],
        body: this.generateData()
      });
      doc.save('Reporte Clientes.pdf');

      this.funcionesService.hideLoading();
      this.progressBar = false;
    }

    downloadExcel(){
      this.funcionesService.showLoading();
      this.progressBar = true;

      const title = 'REPORTE CLIENTES';
      const header = ["PUNTO DE VENTA", "TIPO DOCUMENTO", "NÚMERO", "RAZÓ SOCIAL", "DIRECCIÓN", "UBIGEO", "PAIS", "CORREO", "CELULAR", "TELÉFONO", "OBSERVACIONES", "ESTADO"];
      const data = this.MainDS.filteredData;
      let lista: any[] = [];

      let workbook = new Workbook();
      let worksheet = workbook.addWorksheet('Clientes');

      // Add new row
      let titleRow = worksheet.addRow([title]);
      // Set font, size and style in title row.
      titleRow.font = { name: 'Arial', family: 4, size: 16, bold: true };

      worksheet.mergeCells(`A1:L1`);
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
      worksheet.getColumn(4).width = 40;
      worksheet.getColumn(5).width = 40;
      worksheet.getColumn(6).width = 40;
      worksheet.getColumn(7).width = 40;
      worksheet.getColumn(8).width = 40;
      worksheet.getColumn(9).width = 40;
      worksheet.getColumn(10).width = 40;
      worksheet.getColumn(11).width = 40;
      worksheet.getColumn(12).width = 40;

      data.forEach((element: any) => {
        lista.push(
          element.idPuntoVenta == null ? '': this.puntoVentas.nombre,
          element.tipo == null ? '': element.tipoDoi.tipo,
          element.numeroDoi == null ? '': element.numeroDoi,
          element.nombre == null ? '': element.nombre,
          element.direccion == null ? '': element.direccion,
          element.ubigeo == null ? '': element.ubigeo.ubigeo,
          element.pais == null ? '': element.pais,
          element.correo == null ? '': element.correo,
          element.celular == null ? '': element.celular,
          element.telefono == null ? '': element.telefono,
          element.observaciones == null ? '': element.observaciones,
          element.status == true ? 'ACTIVO' : 'INACTIVO'
        );
        worksheet.addRow(lista);
        lista = [];
      });

      worksheet.addRow([]);

      workbook.xlsx.writeBuffer().then((data: any) => {
        const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        fs.saveAs(blob, 'Reporte Clientes.xlsx');
      });

      this.funcionesService.hideLoading();
      this.progressBar = false;
    }
}
