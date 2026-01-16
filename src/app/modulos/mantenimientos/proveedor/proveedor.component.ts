import { Component, OnInit, ViewChild, Type } from '@angular/core';
import { ModalProveedorComponent } from './modalProveedor/modalProveedor.component';
import { ProveedorService } from './service/proveedor.service';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Proveedor } from './model/proveedor';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { NgbModalOptions, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Ubigeo } from '../clientes/Model/ubigeo';
import { FuncionesService } from '../../../shared/services/funciones.service';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { PuntosVenta } from '../puntosventa/model/puntosVenta';
import { PuntosventaService } from '../puntosventa/service/puntosventa.service';
import { UbigeoService } from 'src/app/shared/services/ubigeo/ubigeo.service';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');

// Modals
const MODALS: { [name: string]: Type<any> } = {
  proveedor: ModalProveedorComponent,
};

@Component({
  selector: 'app-proveedor',
  templateUrl: './proveedor.component.html',
  providers: [ ProveedorService, PuntosventaService, UbigeoService ]
})
export class ProveedorComponent implements OnInit {

// FormGroup
fgMain: FormGroup | any;

proveedor: Proveedor = new Proveedor(0, '', '', '', '', '', '', '', '', '', '', '', '', '', true);
puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
puntoVentas: PuntosVenta = new PuntosVenta();
opcion: number = 0;

// Progress Bar
progressBar: boolean = false;

// PRINCIPAL
MainDC: string[] = ['idPuntoVenta', 'tipoDoi', 'numeroDoi', 'nombre', 'razonsocial', 'pais', 'idUbigeo', 'imagen', 'acciones'];
MainDS: MatTableDataSource<Proveedor> = new MatTableDataSource<Proveedor>();
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
cboUbigeo: Ubigeo[] = [];

constructor(
  public proveedorService: ProveedorService,
  public puntosventaService: PuntosventaService,
  public funcionesService: FuncionesService,
  public ubigeoService: UbigeoService,
  private fb: FormBuilder,
  private _modalService: NgbModal
) {
  this.new_fgMain();
}

new_fgMain(){
  this.fgMain = this.fb.group({
    razonsocial: '',
    idPuntoVenta: '',
    fechaIni: '',
    fechaFin: '',
    puntoventa:''
  });

  this.fgMain.valueChanges.subscribe((value: any) => {
    const filter = { ...value, razonsocial: value.razonsocial.trim().toLowerCase() } as string;
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
  this.cargarPuntosVenta();
  this.cargarUbigeo();
  this.funcionesService.hideLoading();
  this.progressBar = false;
}

cargarPuntosVenta(){
  this.puntosventaService.cargarPuntosVenta().subscribe(response => {
    this.cboPuntoVentas = response.puntosVenta;
  });
}

cargarUbigeo(){
  this.ubigeoService.cargarUbigeo().subscribe(response => {
    this.cboUbigeo = response.ubigeo;
  });
}

loadMain() {

  this.proveedorService.obtenerProveedor(this.puntoVentas.id).subscribe(response => {

    this.MainDS = new MatTableDataSource<Proveedor>(response.proveedores);
    this.MainDS.paginator = this.pagMain;

    this.MainDS.filterPredicate = function(data: Proveedor, filter: string): boolean {
      return data.razonsocial.trim().toLowerCase().includes(filter);
    };

    this.MainDS.filterPredicate = ((data: Proveedor, filter: any ) => {
      const a = !filter.razonsocial || data.razonsocial.trim().toLowerCase().includes(filter.razonsocial.trim().toLowerCase());
      const b = !filter.idPuntoVenta.id || parseInt(data.idPuntoVenta) === parseInt(filter.idPuntoVenta.id);
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
    razonsocial: '',
    idPuntoVenta: '',
    fechaIni: '',
    fechaFin: ''
  });

  this.loadMain();
}

crudFormulario(){
  this.opcion = 1;
  this.openModal('proveedor');
}

viewDetail(element: Proveedor) {
  this.opcion = 2;
  this.proveedor = element;
  this.openModal('proveedor');
}

openModal(name: string) {

  const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
  const obj: any = new Object();

  switch (name) {
    case 'proveedor':
      obj['opcion'] = this.opcion;
      obj['proveedor'] = this.proveedor;
      obj['lista'] = this.MainDS.filteredData;
      modalRef.componentInstance.fromParent = obj;
    break;
  }

  modalRef.result.then(async (result) => {

    switch (result.modal) {
      case 'proveedor':
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

eliminarRegistro(element: Proveedor){
  this.funcionesService.mensajeConfirmar('¿Desea eliminar este registro?', '', (result: any) => {
    if (result.isConfirmed) {
      this.proveedorService.deleteCajas(element).subscribe(response => {
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

    let status: string = element.status == true ? 'ACTIVO' : 'INACTIVO'
    result.push([
      element.puntoventa.nombre == null ? '': element.puntoventa.nombre,
      element.tipoDoi == null ? '': element.tipoDoi,
      element.numeroDoi == null ? '': element.numeroDoi,
      element.nombre == null ? '': element.nombre,
      element.razonsocial == null ? '': element.razonsocial,
      element.pais == null ? '': element.pais,
      element.ubigeos.ubigeo == null ? '': element.ubigeos.ubigeo,
      element.direccion == null ? '': element.direccion,
      element.correo == null ? '': element.correo,
      element.celular == null ? '': element.celular,
      element.telefono == null ? '': element.telefono,
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
  doc.text("REPORTE PROVEEDORES", 140, 30, {align: "center"});
  doc.autoTable({
    styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
    margin: {top: 40},
    head: [["PUNTO DE VENTA", "TIPO DOI", "NÚMERO DOI", "NOMBRE", "RAZÓN SOCIAL", "PAIS", "UBIGEO", "DIRECCIÓN", "CORREO", "CELULAR", "TELEFONO", "OBSERVACIONES", "ESTADO"]],
    body: this.generateData()
  });
  doc.save('Reporte Proveedores.pdf');

  this.funcionesService.hideLoading();
  this.progressBar = false;
}

downloadExcel(){
  this.funcionesService.showLoading();
  this.progressBar = true;

  const title = 'REPORTE PROVEEDORES';
  const header = ["PUNTO DE VENTA", "TIPO DOI", "NÚMERO DOI", "NOMBRE", "RAZÓN SOCIAL", "PAIS", "UBIGEO", "DIRECCIÓN", "CORREO", "CELULAR", "TELEFONO", "OBSERVACIONES", "ESTADO"];
  const data = this.MainDS.filteredData;
  let lista: any[] = [];

  let workbook = new Workbook();
  let worksheet = workbook.addWorksheet('Proveedores');

  // Add new row
  let titleRow = worksheet.addRow([title]);
  // Set font, size and style in title row.
  titleRow.font = { name: 'Arial', family: 4, size: 16, bold: true };

  worksheet.mergeCells(`A1:M1`);
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
  worksheet.getColumn(2).width = 20;
  worksheet.getColumn(3).width = 20;
  worksheet.getColumn(4).width = 20;
  worksheet.getColumn(5).width = 30;
  worksheet.getColumn(6).width = 20;
  worksheet.getColumn(7).width = 20;
  worksheet.getColumn(8).width = 40;
  worksheet.getColumn(9).width = 20;
  worksheet.getColumn(10).width = 20;
  worksheet.getColumn(11).width = 20;
  worksheet.getColumn(12).width = 40;
  worksheet.getColumn(13).width = 10;

  data.forEach((element: any) => {
    lista.push(
      element.puntoventa.nombre == null ? '': element.puntoventa.nombre,
      element.tipoDoi == null ? '': element.tipoDoi,
      element.numeroDoi == null ? '': element.numeroDoi,
      element.nombre == null ? '': element.nombre,
      element.razonsocial == null ? '': element.razonsocial,
      element.pais == null ? '': element.pais,
      element.ubigeos.ubigeo == null ? '': element.ubigeos.ubigeo,
      element.direccion == null ? '': element.direccion,
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
    fs.saveAs(blob, 'Reporte Proveedores.xlsx');
  });

  this.funcionesService.hideLoading();
  this.progressBar = false;
}

}

