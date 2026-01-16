import { Component, OnInit, Type, ViewChild } from '@angular/core';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { CierrecajaService } from '../service/cierrecaja.service';
import { FormGroup, FormBuilder } from '@angular/forms';
import { CierreCaja } from '../models/cierreCaja';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { User } from '../../Seguridad/models/User';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { UsuarioService } from '../../Usuarios/service/usuario.service';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { ModalpreviewComponent } from '../modalpreview/modalpreview.component';
import { ReportesService } from '../../reportes/service/reportes.service';
import { ComparacionVentaVendedores } from '../../reportes/model/reporteComparacionVentasVendedores';

// Modals
const MODALS: { [name: string]: Type<any> } = {
  vistaPrevia: ModalpreviewComponent
};

@Component({
  selector: 'app-cierrecaja',
  templateUrl: './cierrecaja.component.html',
  providers: [CierrecajaService, UsuarioService, ReportesService]
})
export class CierrecajaComponent implements OnInit{

  // FormGroup
  formGroup: FormGroup | any;

  cierreCajas: CierreCaja = new CierreCaja(0, '', '', '', '', '', '', '', '', '', '', '', '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  progressBar: boolean = false;

  cboVendedores: User[] = [];

  NgbModalOptions: NgbModalOptions = {
    size: 'lg',
    centered: true,
    scrollable: true,
    keyboard: false,
    backdrop: 'static',
    windowClass: 'modal-holder'
  };

  // PRINCIPAL
  // MainDC: string[] = ['usuario', 'fecha', 'entrada', 'salidas', 'numeroTicket', 'pagoCreaditos'];
  MainDC: string[] = ['puntoventa', 'fecha', 'vendedor', 'tipoPago', 'monto', 'total'];
  MainDS: MatTableDataSource<ComparacionVentaVendedores> = new MatTableDataSource<ComparacionVentaVendedores>();
  @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

  constructor(
    public cierrecajaService: CierrecajaService,
    private usuarioService: UsuarioService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    private _modalService: NgbModal,
    public service: ReportesService
  ) {
    this.new_fgMain();
  }

  new_fgMain(){
    this.formGroup = this.fb.group({
      idPuntoVenta: '',
      puntoventa: '',
      idUsuario: '',
      fechaIni: '',
      fechaFin: '',
      usuarios: ''
    });

    this.formGroup.valueChanges.subscribe((value: any) => {
      const filter = { ...value, name: value.idUsuario } as string;
      this.MainDS.filter = filter;

      if (this.MainDS.paginator) {
        this.MainDS.paginator.firstPage();
      }
    });
  }

  get getMain() { return this.formGroup.controls; }

  ngOnInit() {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.formGroup.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.formGroup.get('puntoventa').setValue(this.puntoVentas.nombre);

    this.cargarVendedores();
    this.loadMain();
  }

  openModal(name: string) {

    const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
    const obj: any = new Object();

    switch (name) {
      case 'cierreCajas':
        obj['cierreCajas'] = this.cierreCajas;
        modalRef.componentInstance.fromParent = obj;
      break;
      case 'vistaPrevia':
        obj['cierreCajas'] = this.MainDS.filteredData;
        modalRef.componentInstance.fromParent = obj;
      break;
    }

    modalRef.result.then(async (result) => {

      switch (result.modal) {
        case 'cierreCajas':
          if (result.value === 'loadAgain') {

            this.funcionesService.showLoading();
            this.progressBar = true;
            await this.loadMain();
            this.progressBar = false
            this.funcionesService.hideLoading();
          }
          break;
      }

    }, (reason) => { });
  }

  limpiar(){
    this.formGroup = this.fb.group({
      idPuntoVenta: '',
      puntoventa: '',
      idUsuario: '',
      fechaIni: '',
      fechaFin: '',
      usuarios: ''
    });

    this.loadMain();
  }

  viewCierreCaja() {
    this.openModal('vistaPrevia');
  }

  loadMain() {
    this.funcionesService.showLoading();
    // this.cierrecajaService.obtenerCierreCaja(this.puntoVentas.id).subscribe(response => {
      this.service.cargarComparacionVentasVendedores(this.puntoVentas.id).subscribe(response => {

      // this.MainDS = new MatTableDataSource<CierreCaja>(response.cierreCajas);
      this.MainDS = new MatTableDataSource<ComparacionVentaVendedores>(response.comparacionVentaVendedores);
      this.MainDS.paginator = this.pagMain;

      this.MainDS.filterPredicate = function(data: CierreCaja, filter: string): boolean {
        return data.idUsuario === filter;
      };

      this.MainDS.filterPredicate = ((data: CierreCaja, filter: any ) => {
        const a = !filter.idUsuario || data.idUsuario === filter.idUsuario;
        const b = !filter.fechaIni ||  new Date(this.funcionesService.formatearFecha4(data.fecha)) >= new Date(filter.fechaIni) && new Date(this.funcionesService.formatearFecha4(data.fecha)) <= new Date(filter.fechaFin);
        return a && b;
      }) as (PeriodicElement: any, string: any) => boolean;

      this.funcionesService.hideLoading();

    }, error => {
      console.log(error);
    });
  }

  cargarVendedores(){
    this.usuarioService.listarUsuarios().subscribe(response => {
      this.cboVendedores = response.usuarios;
      this.cboVendedores = this.cboVendedores.filter(x => parseInt(x.status) === 1);
    });
  }

  selectEventUsuarios(usuarios: User){
    this.formGroup.get("idUsuario").setValue(usuarios.id);
  }

  guardarReporte(){
    this.funcionesService.mensajeConfirmar('', '¿Desea guardar el reporte de ventas del día?', (result: any) => {
      if(result.isConfirmed){
        this.funcionesService.showLoading();
        this.cierrecajaService.guardarReporte(this.puntoVentas.id).subscribe(response => {
          this.funcionesService.hideLoading();
          if(response.status === 200){
            this.funcionesService.showSuccess(response.message);
          }else{
            this.funcionesService.showWarning(response.message);
          }
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
        element.usuario == null ? '': element.usuario,
        element.fecha == null ? '': element.fecha,
        element.tipo == null ? '': element.tipo,
        element.inicioCaja == null ? '': element.inicioCaja,
        element.entradaDinero == null ? '': element.entradaDinero,
        element.entradaTotal == null ? '': element.entradaTotal,
        element.salidaDinero == null ? '': element.salidaDinero,
        element.pagoProveedores == null ? '': element.pagoProveedores,
        element.salidasTotal == null ? '': element.salidasTotal,
        element.numeroTicket == null ? '': element.numeroTicket,
        element.pagoCreaditos == null ? '': element.pagoCreaditos
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
    doc.text("REPORTE CIERRE DE CAJA", 140, 30, {align: "center"});
    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
      margin: {top: 40},
      head: [[ "PUNTO DE VENTA", "USUARIO", "FECHA", "TIPO", "INICIO DE CAJA", "ENTRADA DE DINERO", "ENTRADA TOTAL", "SALIDA DE DINERO", "PAGO PROVEEDORES", "SALIDAS TOTAL", "NÚMERO DE TICKET", "PAGO DE CRÉDITOS"]],
      body: this.generateData()
    });
    doc.save('Reporte Cierre de Caja.pdf');

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  downloadExcel(){
    this.funcionesService.showLoading();
    this.progressBar = true;

    const title = 'REPORTE CIERRE DE CAJA';
    const header = [ "PUNTO DE VENTA", "USUARIO", "FECHA", "TIPO", "INICIO DE CAJA", "ENTRADA DE DINERO", "ENTRADA TOTAL", "SALIDA DE DINERO", "PAGO PROVEEDORES", "SALIDAS TOTAL", "NÚMERO DE TICKET", "PAGO DE CRÉDITOS"];
    const data = this.MainDS.filteredData;
    let lista: any[] = [];

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('Reporte Cierre de Caja');

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

    worksheet.getColumn(1).width = 30;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 30;
    worksheet.getColumn(4).width = 30;
    worksheet.getColumn(5).width = 20;
    worksheet.getColumn(6).width = 20;
    worksheet.getColumn(7).width = 20;
    worksheet.getColumn(8).width = 30;
    worksheet.getColumn(9).width = 30;
    worksheet.getColumn(10).width = 30;
    worksheet.getColumn(11).width = 30;
    worksheet.getColumn(12).width = 30;

    data.forEach((element: any) => {
      lista.push(
        element.idPuntoVenta == null ? '': this.puntoVentas.nombre,
        element.usuario == null ? '': element.usuario,
        element.fecha == null ? '': element.fecha,
        element.tipo == null ? '': element.tipo,
        element.inicioCaja == null ? '': element.inicioCaja,
        element.entradaDinero == null ? '': element.entradaDinero,
        element.entradaTotal == null ? '': element.entradaTotal,
        element.salidaDinero == null ? '': element.salidaDinero,
        element.pagoProveedores == null ? '': element.pagoProveedores,
        element.salidasTotal == null ? '': element.salidasTotal,
        element.numeroTicket == null ? '': element.numeroTicket,
        element.pagoCreaditos == null ? '': element.pagoCreaditos
      );
      worksheet.addRow(lista);
      lista = [];
    });

    worksheet.addRow([]);

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'Reporte Cierre de Caja.xlsx');
    });

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

}
