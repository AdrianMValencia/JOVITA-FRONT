import { Component, OnInit, Type, ViewChild } from '@angular/core';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');
import { saveAs } from 'file-saver';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { AbastacimientoService } from '../abastecimiento/service/abastacimiento.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { Abastecimiento } from '../abastecimiento/models/abastecimiento';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Productos } from '../productos/model/productos';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { PuntosventaService } from '../../mantenimientos/puntosventa/service/puntosventa.service';
import { ProductosService } from '../productos/service/Productos.service';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ModalabastecimientopdfComponent } from './modalabastecimientopdf/modalabastecimientopdf.component';
import { ModalabastecimientodetallesComponent } from './modalabastecimientodetalles/modalabastecimientodetalles.component';
import { AbastecimientoDetalles } from '../abastecimiento/models/abastecimientoDetalles';

// Modals
const MODALS: { [name: string]: Type<any> } = {
  downloadPDF: ModalabastecimientopdfComponent,
  view: ModalabastecimientodetallesComponent
};

@Component({
  selector: 'app-abastecimiento-punto-venta',
  templateUrl: './abastecimiento-punto-venta.component.html',
  providers: [ AbastacimientoService, PuntosventaService, ProductosService ]
})
export class AbastecimientoPuntoVentaComponent implements OnInit {
  // FormGroup
  fgMain: FormGroup | any;
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  abastecimiento: Abastecimiento = new Abastecimiento();
  detalles: AbastecimientoDetalles[] = [];

  // PRINCIPAL
  MainDC: string[] = ['numeroEnvio', 'vendedor', 'fecha', 'puntoVenta', 'puntoVentaNew', 'total', 'pdf', 'acciones'];
  MainDS: MatTableDataSource<Abastecimiento> = new MatTableDataSource<Abastecimiento>();
  @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

  cboProductos: Productos[] = [];
  cboPuntoVenta: PuntosVenta[] = [];

  NgbModalOptions: NgbModalOptions = {
    size: 'xl',
    centered: true,
    scrollable: true,
    keyboard: false,
    backdrop: 'static',
    windowClass: 'modal-holder'
  };

  constructor(
    private fb: FormBuilder,
    private abastacimientoService: AbastacimientoService,
    private puntosVentaService: PuntosventaService,
    private funcionesService: FuncionesService,
    private productosService: ProductosService,
    private _modalService: NgbModal

  ){
    this.new_fgMain();
  }

  new_fgMain(){
    this.fgMain = this.fb.group({
      tiendas: '',
      productos: '',
      fechaIni: '',
      fechaFin: '',
      numeroEnvio: '',
      tiendaDestino: ''
    });

    this.fgMain.valueChanges.subscribe((value: any) => {
      const filter = { ...value, name: value.fechaIni } as string;
      this.MainDS.filter = filter;

      if (this.MainDS.paginator) {
        this.MainDS.paginator.firstPage();
      }
    });
  }

  get getMain() { return this.fgMain.controls; }

  ngOnInit(): void {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.cargarPuntoVenta();
    // this.cargarProductos();
    this.loadMain();
  }

  cargarPuntoVenta(){
    this.puntosVentaService.cargarPuntosVenta().subscribe(response => {
      this.cboPuntoVenta = response.puntosVenta;
    });
  }

  cargarProductos(){
    this.funcionesService.showLoading();
    this.productosService.cargarProductosVentas(this.puntoVentas.id).subscribe(response => {
      this.cboProductos = response.productos;
      this.funcionesService.hideLoading();
    });
  }

  limpiar(){
    this.fgMain = this.fb.group({
      tiendas: '',
      productos: '',
      fechaIni: '',
      fechaFin: '',
      numeroEnvio: '',
      tiendaDestino: ''
    });

    this.loadMain();
  }

  loadMain() {
    this.funcionesService.showLoading();
    this.abastacimientoService.obtenerAbastecimientos(this.puntoVentas.id).subscribe(response => {

      this.MainDS = new MatTableDataSource<Abastecimiento  >(response.abastecimientos);
      this.MainDS.paginator = this.pagMain;
      this.funcionesService.hideLoading();

      this.MainDS.filterPredicate = function(data: Productos, filter: string): boolean {
        return data.created_at.trim().toLowerCase().includes(filter);
      };

      this.MainDS.filterPredicate = ((data: Abastecimiento, filter: any ) => {
        const a = !filter.tiendas || data.puntoVenta.trim().toLowerCase().includes(filter.tiendas.nombre.trim().toLowerCase());
        const b = !filter.productos || data.nombre.trim().toLowerCase().includes(filter.productos.nombre === undefined ? filter.productos.trim().toLowerCase() : filter.productos.nombre.trim().toLowerCase());
        const c = !filter.fechaIni ||  new Date(this.funcionesService.formatearFecha4(data.created_at)) > new Date(filter.fechaIni) && new Date(this.funcionesService.formatearFecha4(data.created_at)) < new Date(filter.fechaFin);
        const d = !filter.numeroEnvio || data.numeroEnvio.trim().toLowerCase().includes(filter.numeroEnvio.trim().toLowerCase());
        const e = !filter.tiendaDestino || (data.puntoVentaNew && data.puntoVentaNew.trim().toLowerCase().includes(filter.tiendaDestino.nombre ? filter.tiendaDestino.nombre.trim().toLowerCase() : filter.tiendaDestino.trim().toLowerCase()));
        return a && b && c && d && e;
      }) as (PeriodicElement: any, string: any) => boolean;
    }, error => {
      console.log(error);
      this.funcionesService.hideLoading();
    });
  }

  downloadPDFIndivual(element: Abastecimiento){
    this.abastecimiento = element;
    this.openModal('downloadPDF');
  }

  openModal(name: string) {

    const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
    const obj: any = new Object();

    switch (name) {
      case 'downloadPDF':
        obj['abastecimiento'] = this.abastecimiento;
        modalRef.componentInstance.fromParent = obj;
      break;
      case 'view':
        obj['abastecimiento'] = this.abastecimiento;
        obj['detalles'] = this.detalles;
        modalRef.componentInstance.fromParent = obj;
      break;
    }

    modalRef.result.then((result) => {

      switch (result.modal) {
        case 'abastecimiento':
          if (result.value === 'loadAgain') {
            this.loadMain();
          }
          break;
      }
    }, (reason) => { });
  }

  viewDetail(element: Abastecimiento) {
    this.abastecimiento = element;
    this.funcionesService.showLoading();
    
    this.abastacimientoService.obtenerDetallesAbastecimiento(element.id).subscribe(response => {
      this.detalles = response.detalles || response.data || response;
      this.funcionesService.hideLoading();
      this.openModal('view');
    }, error => {
      console.log(error);
      this.funcionesService.hideLoading();
      this.funcionesService.swalError('Error al cargar los detalles del abastecimiento');
    });
  }


  generateData() {
    var result: any[] = [];
    var data = this.MainDS.filteredData;

    data.forEach((element: any) => {

      result.push([
        element.numeroEnvio,
        element.vendedor,
        element.created_at == null ? '': this.funcionesService.formatearFechaDDMMYYYY(element.created_at),
        element.puntoVenta,
        element.puntoVentaNew,
        parseFloat(element.total).toFixed(2)
      ]);

    });

    return result;
  }

  downloadPDF(){
    this.funcionesService.showLoading();

    var doc = new jsPDF.default('landscape');
    doc.setFontSize(30);
    doc.setFont("arial", "bold");
    doc.getLineHeight();
    doc.text("REPORTE ABASTECIMIENTO DE PUNTOS DE VENTA", 140, 30, {align: "center"});
    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
      margin: {top: 40},
      head: [[ "NÚMERO DE ENVIO", "VENDEDOR", "FECHA ASIGNACIÓN", "PUNTO DE VENTA DE ORIGEN", "PUNTO DE VENTA DESTINO", "TOTAL TRASPASO"]],
      body: this.generateData()
    });
    doc.save('Reporte Abastecimiento de Puntos de Venta.pdf');

    this.funcionesService.hideLoading();
  }

  downloadExcel(){
    this.funcionesService.showLoading();

    const title = 'REPORTE ABASTECIMIENTO DE PUNTOS DE VENTA';
    const header = [ "NÚMERO DE ENVIO", "VENDEDOR", "FECHA ASIGNACIÓN", "PUNTO DE VENTA DE ORIGEN", "PUNTO DE VENTA DESTINO", "TOTAL TRASPASO"];
    const data = this.MainDS.filteredData;
    let lista: any[] = [];

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('Abastecimiento de Puntos de Venta');

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
    worksheet.getColumn(4).width = 40;
    worksheet.getColumn(5).width = 40;
    worksheet.getColumn(6).width = 40;

    data.forEach((element: any) => {
      lista.push(
        element.numeroEnvio,
        element.vendedor,
        element.created_at == null ? '': this.funcionesService.formatearFechaDDMMYYYY(element.created_at),
        element.puntoVenta,
        element.puntoVentaNew,
        parseFloat(element.total).toFixed(2)
      );
      worksheet.addRow(lista);
      lista = [];
    });

    worksheet.addRow([]);

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'Reporte Abastecimiento de Puntos de Venta.xlsx');
    });

    this.funcionesService.hideLoading();
  }
}
