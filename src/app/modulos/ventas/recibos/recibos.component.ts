import { Component, OnInit, Type, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource, MatTable } from '@angular/material/table';

import { NgbModalOptions, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Productos } from 'src/app/modulos/almacen/productos/model/productos';
import { Clientes } from 'src/app/modulos/mantenimientos/clientes/Model/clientes';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

import { ModalRecibosCorreoComponent } from './modalRecibosCorreo/modalRecibosCorreo.component';
import { ModalRecibosCorreoPersoComponent } from './modalRecibosCorreoPerso/modalRecibosCorreoPerso.component';
import { ModalRecibosPDFComponent } from './modalRecibosPDF/modalRecibosPDF.component';
import { Recibos } from './model/recibos';
import { RecibosDetalles } from './model/recibosDetalles';
import { RecibosService } from './service/recibos.service';
import {
  textoComprobanteSunatRecibo,
  textoNumeracionTicketRecibo,
  tooltipResumenEfactRecibo
} from './utils/recibo-listado-ui.util';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { VentasAnimations } from '../Animations/ventas.animations';
import { ClientesService } from '../../mantenimientos/clientes/Service/clientes.service';
import { ProductosService } from '../../almacen/productos/service/Productos.service';
import { ModaleditarrecibosComponent } from './modaleditarrecibos/modaleditarrecibos.component';
import { User } from '../../Seguridad/models/User';
import { SeriesTickets } from '../../mantenimientos/seriestickets/models/seriesTickets';
import { SeriesticketsService } from '../../mantenimientos/seriestickets/service/seriestickets.service';

// Modals
const MODALS: { [name: string]: Type<any> } = {
  recibos: ModaleditarrecibosComponent,
  downloadPDF: ModalRecibosPDFComponent,
  correo: ModalRecibosCorreoComponent,
  correoPerso: ModalRecibosCorreoPersoComponent
};

@Component({
  selector: 'app-recibos',
  templateUrl: './recibos.component.html',
  providers: [ RecibosService, ClientesService, ProductosService, SeriesticketsService],
  styleUrls: ['./recibos.component.scss'],
  animations: [ VentasAnimations ]
})
export class RecibosComponent implements OnInit {

  // FormGroup
  fgMain: FormGroup | any;

  recibos: Recibos = new Recibos(0, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', true, '', '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  usuarioStorage: string | any = localStorage.getItem('usuario');
  usuarios: User = JSON.parse(this.usuarioStorage);
  opcion: string | any = '' ;

  currentPage: number = 0;
  perPage: number = 10;
  totalRows: number = 0;
  // Progress Bar
  progressBar: boolean = false;

  //Combos
  cboClientes: Clientes[] = [];
  cboProductos: Productos[] = [];
  cboSeries: SeriesTickets = new SeriesTickets();

  // PRINCIPAL
  MainDC: string[] = ['fechaEmision', 'numeracion', 'cpeSunat', 'estadoEfact', 'vendedor', 'total', 'pdf', 'opciones', 'acciones', 'more'];
  MainDS: MatTableDataSource<Recibos> = new MatTableDataSource<Recibos>();
  @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

  // DETALLE
  ExpandedDC: string[] = [
    'codigoBarra',
    'nombre',
    'precio',
    'cantidad',
    'total'
  ];
  ExpandedDS: MatTableDataSource<RecibosDetalles> | any = new MatTableDataSource([]);
  @ViewChild('pagExpanded', {static: false}) pagExpanded: MatPaginator | any;
  @ViewChild('mtExpanded', {static: false}) mtExpanded: MatTable<RecibosDetalles> | any;
  aDetail: RecibosDetalles[] = [];
  expandedMore: Recibos | any;

  NgbModalOptions: NgbModalOptions = {
    size: 'xl',
    centered: true,
    scrollable: true,
    keyboard: false,
    backdrop: 'static',
    windowClass: 'modal-holder'
  };

  constructor(
    public recivosService: RecibosService,
    private clientesService: ClientesService,
    private productosService: ProductosService,
    public funcionesService: FuncionesService,
    private seriesticketsService: SeriesticketsService,
    private fb: FormBuilder,
    private _modalService: NgbModal
  ) {
    this.new_fgMain();
  }

  new_fgMain(){
    this.fgMain = this.fb.group({
      idCliente: '',
      idProducto: [{ value: ''}],
      fechaIni: '',
      fechaFin: '',
      clientes: '',
      productos: '',
      numeracion: ''
    });

    this.fgMain.valueChanges.subscribe((value: any) => {
      const filter = { ...value, name: value.idCliente } as string;
      this.MainDS.filter = filter;

      if (this.MainDS.paginator) {
        this.MainDS.paginator.firstPage();
      }

      this.expandedMore = null;
    });
  }

  get getMain() { return this.fgMain.controls; }

  ticketPosListado(element: Recibos): string {
    return textoNumeracionTicketRecibo(element as unknown as Record<string, unknown>);
  }

  comprobanteSunatColumna(element: Recibos): string {
    return textoComprobanteSunatRecibo(element as unknown as Record<string, unknown>);
  }

  resumenEstadoEfactColumna(element: Recibos): string {
    const e = element as unknown as Record<string, unknown>;
    const t =
      (e['efact_estado'] as string) ||
      (e['estado_ose'] as string) ||
      (e['estado_sunat'] as string) ||
      '';
    return t ? String(t) : '—';
  }

  tooltipEfactListado(element: Recibos): string {
    return tooltipResumenEfactRecibo(element as unknown as Record<string, unknown>);
  }

  ngOnInit() {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.fgMain.get('fechaIni').setValue(this.funcionesService.generarFechaLocal(new Date));
    this.fgMain.get('fechaFin').setValue(this.funcionesService.generarFechaLocal(new Date));
    this.buscar();
    this.cargarSeries();
  }

  openModal(name: string) {

    const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
    const obj: any = new Object();

    switch (name) {
    case 'recibos':
        obj['recibos'] = this.recibos;
        modalRef.componentInstance.fromParent = obj;
      break;
    case 'downloadPDF':
        obj['recibos'] = this.recibos;
        modalRef.componentInstance.fromParent = obj;
      break;
    case 'correo':
        obj['recibos'] = this.recibos;
        modalRef.componentInstance.fromParent = obj;
      break;
    case 'correoPerso':
        obj['recibos'] = this.recibos;
        modalRef.componentInstance.fromParent = obj;
      break;
    case 'ventas':
        obj['opcion'] = 3;
        obj['recibos'] = this.recibos;
        modalRef.componentInstance.fromParent = obj;
      break;
    }

    modalRef.result.then(async (result) => {

      switch (result.modal) {
        case 'recibos':
          if (result.value === 'loadAgain') {
            this.loadMain();
            this.buscar();
          }
          break;
      }

    }, (reason) => { });
  }

  limpiar(){
    this.fgMain = this.fb.group({
      idCliente: '',
      idProducto: '',
      fechaIni: '',
      fechaFin: '',
      clientes: '',
      productos: ''
    });

    this.loadMain();
  }

  buscar(): any{
    if(this.fgMain.get('fechaIni').value === ''){
      this.funcionesService.showError('Ingrese la fecha de inicio');
      return false;
    }
    if(this.fgMain.get('fechaFin').value === ''){
      this.funcionesService.showError('Ingrese la fecha final');
      return false;
    }
    if(new Date(this.fgMain.get('fechaIni').value).getTime() > new Date(this.fgMain.get('fechaFin').value).getTime()){
      this.funcionesService.showError('La fecha de inicio no puede ser mayor que la fecha final');
      return false;
    }
    this.funcionesService.showLoading();
    this.recivosService.buscarPorFecha(this.currentPage, this.perPage, this.fgMain.get('fechaIni').value, this.fgMain.get('fechaFin').value, this.puntoVentas.id).subscribe(response => {
      this.funcionesService.hideLoading();
      if(response.status === 200){

        this.MainDS = new MatTableDataSource<Recibos>(response.recibos);
        this.aDetail  = response.recibosDetalles;
        this.MainDS.paginator = this.pagMain;
        // setTimeout(() => {
        //   this.pagMain.pageIndex = this.currentPage;
        //   this.pagMain.length = response.recibos.total;
        // });

        this.MainDS.filterPredicate = function(data: Recibos, filter: string): boolean {
          return data.idCliente === filter;
        };

        this.MainDS.filterPredicate = ((data: Recibos, filter: any ) => {
          const a = !filter.clientes || data.idCliente === filter.clientes.id;
          const b = !filter.numeracion || data.numeracion === filter.numeracion;
          // const b = !data.created_at || (new Date(this.funcionesService.formatearFecha4(data.created_at)).valueOf() >= new Date(filter.fechaIni).valueOf() && new Date(this.funcionesService.formatearFecha4(data.created_at)).valueOf() <= new Date(filter.fechaFin).valueOf());
          const c = this.cantPerso(data.id) > 0;
          if (c) {
            return a && b && c;
          }else{
            return a && b;
          }
        }) as (PeriodicElement: any, string: any) => boolean;

        this.cargarClientes();
        this.cargarProductos();
      }
    });
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.perPage = event.pageSize;
    this.buscar();
  }

  crudRegistros(){
    this.opcion = 1;
    this.openModal('recibos');
  }

  viewDetail(element: any) {
    this.opcion = 2;
    this.recibos = element;
    this.recibos.detalles = this.aDetail.filter(x => parseInt(x.idRecibo) === this.recibos.id);
    this.openModal('recibos');
  }

  loadMain() {
    this.funcionesService.showLoading();
    this.recivosService.obtenerRecibos(this.puntoVentas.id).subscribe(response => {

      this.aDetail  = response.recibosDetalles;
      this.funcionesService.hideLoading();
      this.MainDS = new MatTableDataSource<Recibos>(response.recibos);
      this.MainDS.paginator = this.pagMain;

      this.MainDS.filterPredicate = function(data: Recibos, filter: string): boolean {
        return data.idCliente === filter;
      };

      this.MainDS.filterPredicate = ((data: Recibos, filter: any ) => {
        const a = !filter.clientes || data.idCliente === filter.clientes.id;
        // const b = !data.created_at || (new Date(this.funcionesService.formatearFecha4(data.created_at)).valueOf() >= new Date(filter.fechaIni).valueOf() && new Date(this.funcionesService.formatearFecha4(data.created_at)).valueOf() <= new Date(filter.fechaFin).valueOf());
        const b = this.cantPerso(data.id) > 0;
        return a && b;
      }) as (PeriodicElement: any, string: any) => boolean;
    }, error => {
      console.log(error);
    });
  }

  cantPerso(id: number) {

    const sText = this.fgMain.get("productos").value.id as string;
    let detail: RecibosDetalles[] = [];

    Object.values(this.aDetail).forEach((element: any) => {
      if (parseInt(element.idRecibo) === id ) {
        detail.push(element);
      }
    });

    const aFilter = detail.filter( (x: any) => {
      const a = !sText || parseInt(x.idProducto) === parseInt(sText);
      return a;
    });

    return aFilter.length;
  }

  clickExpanded(row: Recibos) {
    if ( this.expandedMore === row ) {
      // Limpiar
      this.expandedMore = null;
      this.ExpandedDS = new MatTableDataSource([]);

      if (this.ExpandedDS.paginator) {
        this.ExpandedDS.paginator.firstPage();
      }

    } else {

      let aFilter: RecibosDetalles[] = [];

      Object.values(this.aDetail).forEach((element: any) => {
        if (parseInt(element.idRecibo) === row.id ) {
          aFilter.push(element);
        }
      });

      if ( this.fgMain.get("idProducto").value !== null) {
        if(this.fgMain.get("idProducto").value.value !== ''){
          let sFilter = this.fgMain.get("idProducto").value as string;
          aFilter = this.aDetail.filter( (x: any) => {
            return  parseInt(x.idProducto) === parseInt(sFilter) && parseInt(x.idRecibo) === parseInt(row.id);
          });
        }
      }

      this.ExpandedDS = new MatTableDataSource<RecibosDetalles>(aFilter);
      this.ExpandedDS.paginator = null;
      // this.ExpandedDS.paginator = this.pagExpanded;

      this.expandedMore = row;
      this.mtExpanded.renderRows();
    }
  }

  cargarClientes(){
    this.clientesService.obtenerClientes(this.puntoVentas.id).subscribe(response => {
      this.cboClientes = response.clientes;
      this.cboClientes = this.cboClientes.filter(x => parseInt(x.status) === 1);
    });
  }

  cargarProductos(){
    this.productosService.cargarProductosVentas(this.puntoVentas.id).subscribe(response => {
      this.cboProductos = response.productos;
    });
  }

  eliminarRegistro(element: Productos){
    this.funcionesService.mensajeConfirmar('¿Desea eliminar este registro?', '', (result: any) => {
      if (result.isConfirmed) {
        this.recivosService.deleteRecibos(element).subscribe(response => {
          if (response.status === 200) {
            this.funcionesService.showSuccess(response.message);
            this.loadMain();
          }
          else {
            this.funcionesService.showError(response.message);
            this.funcionesService.hideLoading();
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

  cargarSeries(){
    this.funcionesService.showLoading();
    this.seriesticketsService.cargarSeriesTickets(this.puntoVentas.id).subscribe(response =>{
      this.funcionesService.hideLoading();
      this.cboSeries = response.seriesTickets[0];
    });
  }

  download(element: Recibos){
   this.recibos = element;
   this.openModal('modalPdf');
  }

  enviarEmail(event: any, element: Recibos){
    if(parseInt(event.value) === 1){
      this.enviarCorreo(element);
    }else if(parseInt(event.value) === 2){
      this.enviarCorreoPerso(element);
    }
  }

  enviarCorreo(element: Recibos){
    this.recibos = element;
    this.openModal('correo');
  }

  enviarCorreoPerso(element: Recibos){
  this.recibos = element;
  this.openModal('correoPerso');
  }

  downloadPDF(element: Recibos){
    this.recibos = element;
    this.openModal('downloadPDF');
  }

  generateData() {
    var result: any[] = [];
    var data = this.MainDS.filteredData;

    data.forEach((element: any) => {

      result.push([
        element.idPuntoVenta == null ? '': this.puntoVentas.nombre,
        element.vendedor == null ? '': element.vendedor,
        element.fechaEmision == null ? '': element.fechaEmision,
        textoNumeracionTicketRecibo(element),
        textoComprobanteSunatRecibo(element),
        (element.efact_estado || element.estado_ose || element.estado_sunat || '') as string,
        element.total == null ? '': element.total
      ]);

    });

    return result;
  }

  downloadPDFOnly(){
    this.funcionesService.showLoading();
    this.progressBar = true;

    var doc = new jsPDF.default('landscape');
    doc.setFontSize(30);
    doc.setFont("arial", "bold");
    doc.getLineHeight();
    doc.text("REPORTE DE TICKETS", 140, 30, {align: "center"});
    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
      margin: {top: 40},
      head: [[ "PUNTO VENTA", "USUARIO", "FECHA EMISIÓN", "TICKET (POS)", "CPE SUNAT", "ESTADO eFact", "TOTAL"]],
      body: this.generateData()
    });
    doc.save('Reporte de Tickets.pdf');

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  downloadExcel(){
    this.funcionesService.showLoading();
    this.progressBar = true;

    const title = 'REPORTE DE TICKETS';
    const header = [ "PUNTO VENTA", "USUARIO", "FECHA EMISIÓN", "TICKET (POS)", "CPE SUNAT", "ESTADO eFact", "TOTAL"];
    const data = this.MainDS.filteredData;
    let lista: any[] = [];

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('Tickets');

    // Add new row
    let titleRow = worksheet.addRow([title]);
    // Set font, size and style in title row.
    titleRow.font = { name: 'Arial', family: 4, size: 16, bold: true };

    worksheet.mergeCells(`A1:G1`);
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

    worksheet.getColumn(1).width = 36;
    worksheet.getColumn(2).width = 28;
    worksheet.getColumn(3).width = 22;
    worksheet.getColumn(4).width = 22;
    worksheet.getColumn(5).width = 22;
    worksheet.getColumn(6).width = 28;
    worksheet.getColumn(7).width = 14;

    this.MainDS.filteredData.forEach((element: any) => {
      lista.push(
        element.idPuntoVenta == null ? '': this.puntoVentas.nombre,
        element.vendedor == null ? '': element.vendedor,
        element.fechaEmision == null ? '': element.fechaEmision,
        textoNumeracionTicketRecibo(element),
        textoComprobanteSunatRecibo(element),
        (element.efact_estado || element.estado_ose || element.estado_sunat || '') as string,
        element.total == null ? '': element.total
      );
      worksheet.addRow(lista);
      lista = [];
    });

    worksheet.addRow([]);

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'Reporte de Tickets.xlsx');
    });

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }
}
