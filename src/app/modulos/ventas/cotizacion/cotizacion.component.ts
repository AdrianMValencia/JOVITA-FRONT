import { FuncionesService, APP_DATE_FORMATS } from './../../../shared/services/funciones.service';
import { Clientes } from './../../mantenimientos/clientes/Model/clientes';
import { NgbModalOptions, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MatPaginator } from '@angular/material/paginator';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Cotizacion } from './model/cotizacion';
import { FormGroup, FormBuilder } from '@angular/forms';
import { CotizacionService } from './service/cotizacion.service';
import { ModalCotizacionComponent } from './modalCotizacion/modalCotizacion.component';
import { Component, OnInit, Type, ViewChild } from '@angular/core';
import * as _moment from 'moment';
import { DownloadPDFComponent } from './downloadPDF/downloadPDF.component';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { DetallesCotizacion } from './model/detallesCotizacion';
import { Recibos } from '../recibos/model/recibos';
import { ModalRecibosComponent } from '../../ventas/recibos/modalRecibos/modalRecibos.component';
import { ClientesService } from '../../mantenimientos/clientes/Service/clientes.service';
import { ProductosService } from '../../almacen/productos/service/Productos.service';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { Productos } from '../../almacen/productos/model/productos';
import { VentasAnimations } from '../Animations/ventas.animations';

// Modals
const MODALS: { [name: string]: Type<any> } = {
  cotizacion: ModalCotizacionComponent,
  downloadPDF: DownloadPDFComponent,
  recibos: ModalRecibosComponent
};

@Component({
  selector: 'app-cotizacion',
  templateUrl: './cotizacion.component.html',
  providers: [ CotizacionService, ClientesService, ProductosService ],
  styleUrls: ['./cotizacion.component.scss'],
  animations: [ VentasAnimations ]
})
export class CotizacionComponent implements OnInit {

// FormGroup
fgMain: FormGroup | any;
cotizacion: Cotizacion = new Cotizacion(0, '', '', '', '', '', '', '', '', '', '', '', '', '', '');
puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
puntoVentas: PuntosVenta = new PuntosVenta();
opcion: number = 0;

// Progress Bar
pbMain: boolean = false;

// PRINCIPAL
MainDC: string[] = ['numero', 'documento', 'razonSocial', 'fechaCotizacion', 'total', 'status', 'pdf', 'excel', 'documentos', 'acciones', 'more'];
MainDS: MatTableDataSource<Cotizacion> = new MatTableDataSource<Cotizacion>();
@ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

  // DETALLE
  ExpandedDC: string[] = [
    'nombre',
    'precio',
    'cantidad',
    'porcentajeDesc',
    'subtotal',
    'igv',
    'total'
  ];

  ExpandedDS: MatTableDataSource<DetallesCotizacion> | any = new MatTableDataSource([]);
  @ViewChild('pagExpanded', {static: false}) pagExpanded: MatPaginator | any;
  @ViewChild('mtExpanded', {static: false}) mtExpanded: MatTable<DetallesCotizacion> | any;
  aDetail: Array<DetallesCotizacion> | any;
  expandedMore: Cotizacion | any;

  NgbModalOptions: NgbModalOptions = {
    size: 'xl',
    centered: true,
    scrollable: true,
    keyboard: false,
    backdrop: 'static',
    windowClass: 'modal-holder'
  };

  //Combos
  cboClientes: Clientes[] = [];
  cboProductos: Productos [] = [];

  estados: any[] = [
    {id: 1, name: 'PENDIENTE', color: 'darkgoldenrod'},
    {id: 2, name: 'ATENDIDO', color: 'green'},
    {id: 3, name: 'CANCELADO', color: 'red'},
  ]

  documentos: any[] = [
    {id: 1, name: 'RECIBO', color: 'darkgoldenrod'}
  ]

  constructor(
    public cotizacionService: CotizacionService,
    public clientesService: ClientesService,
    public productosService: ProductosService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    private _modalService: NgbModal
  ) {
    this.new_fgMain();
  }

  new_fgMain(){
    this.fgMain = this.fb.group({
      idCliente: '',
      numero: '',
      idProducto: [{ value: ''}],
      fechaIni: '',
      fechaFin: '',
      clientes: '',
      productos: ''
    });

    this.fgMain.valueChanges.subscribe((value: any) => {
      const filter = { ...value, numero: value.numero } as string;
      this.MainDS.filter = filter;

      if (this.MainDS.paginator) {
        this.MainDS.paginator.firstPage();
      }

      this.expandedMore = null;
    });
  }

  get getMain() { return this.fgMain.controls; }

  ngOnInit() {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.loadMain();
    this.cargarClientes();
    this.cargarProductos();
  }

  openModal(name: string) {

    const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
    const obj: any = new Object();

    switch (name) {
      case 'cotizacion':
        obj['opcion'] = this.opcion;
        obj['cotizacion'] = this.cotizacion;
        modalRef.componentInstance.fromParent = obj;
      break;
      case 'downloadPDF':
        obj['cotizacion'] = this.cotizacion;
        modalRef.componentInstance.fromParent = obj;
      break;
      case 'ventas':
        obj['opcion'] = this.opcion;
        obj['cotizacion'] = this.cotizacion;
        modalRef.componentInstance.fromParent = obj;
      break;
      case 'recibos':
        obj['opcion'] = this.opcion;
        obj['cotizacion'] = this.cotizacion;
        modalRef.componentInstance.fromParent = obj;
      break;
    }

    modalRef.result.then(async (result) => {

      switch (result.modal) {
        case 'cotizacion':
          if (result.value === 'loadAgain') {

            this.funcionesService.showLoading();
            this.pbMain = true;
            await this.loadMain();
            this.funcionesService.hideLoading();
            this.pbMain = false;
          }
          break;
      }

    }, (reason) => { });
  }

  limpiar(){
    this.fgMain = this.fb.group({
      idCliente: '',
      numero: '',
      idProducto: [{ value: ''}],
      fechaIni: '',
      fechaFin: '',
      clientes: '',
      productos: ''
    });

    this.loadMain();
  }

  crudRegistros(){
    this.opcion = 1;
    this.openModal('cotizacion');
  }

  viewDetail(element: any) {
    if(element.status === 1){
      this.opcion = 2;
      this.cotizacion = element;
      this.openModal('cotizacion');
    }
  }

  loadMain() {

    this.funcionesService.showLoading();
    this.cotizacionService.obtenerrCotizacion(this.puntoVentas.id).subscribe(response => {

      this.MainDS = new MatTableDataSource<Cotizacion>(response.cotizacion);
      this.MainDS.paginator = this.pagMain;
      this.funcionesService.hideLoading();

      this.MainDS.filterPredicate = function(data: Cotizacion, filter: string): boolean {
        return data.numero.trim().toLowerCase().includes(filter);
      };

      this.MainDS.filterPredicate = ((data: Cotizacion, filter: any ) => {
        const a = !filter.clientes || data.idCliente === filter.clientes.id;
        const b = !filter.numero || data.numero.trim().toLowerCase().includes(filter.numero);
        const c = !filter.fechaIni ||  new Date(this.funcionesService.formatearFecha4(data.fechaCotizacion)) > new Date(filter.fechaIni) && new Date(this.funcionesService.formatearFecha4(data.fechaCotizacion)) < new Date(filter.fechaFin);
        const d = this.cantPerso(data.id) > 0;
        return a && b && c && d;
      }) as (PeriodicElement: any, string: any) => boolean;

      this.cotizacionService.cargarDetalles().subscribe(response => {
        this.aDetail  = response.cotizacionDetalles;
      });

    }, error => {
      console.log(error);
    });
  }

  cantPerso(id: number) {

    const sText = this.fgMain.get("productos").value.id as string;
    let detail: DetallesCotizacion[] = [];

    Object.values(this.aDetail).forEach((element: any) => {
      if (parseInt(element.idCotizacion) === id ) {
        detail.push(element);
      }
    });

    const aFilter = detail.filter( (x: any) => {
      const a = !sText || parseInt(x.idProducto) === parseInt(sText);
      return a;
    });

    return aFilter.length;
  }

  clickExpanded(row: Cotizacion) {
    if ( this.expandedMore === row ) {
      // Limpiar
      this.expandedMore = null;
      this.ExpandedDS = new MatTableDataSource([]);

      if (this.ExpandedDS.paginator) {
        this.ExpandedDS.paginator.firstPage();
      }

    } else {

      let aFilter: DetallesCotizacion[] = [];

      Object.values(this.aDetail).forEach((element: any) => {
        if (parseInt(element.idCotizacion) === row.id ) {
          aFilter.push(element);
        }
      });

      if ( this.fgMain.get("idProducto").value !== null) {
        if(this.fgMain.get("idProducto").value.value !== ''){
          let sFilter = this.fgMain.get("idProducto").value as string;
          aFilter = this.aDetail.filter( (x: any) => {
            return  parseInt(x.idProducto) === parseInt(sFilter) && parseInt(x.idCotizacion) === parseInt(row.id);
          });
        }
      }

      this.ExpandedDS = new MatTableDataSource<DetallesCotizacion>(aFilter);
      this.ExpandedDS.paginator = null;
      // this.ExpandedDS.paginator = this.pagExpanded;

      this.expandedMore = row;
      this.mtExpanded.renderRows();
    }
  }

  cargarClientes(){
    this.clientesService.obtenerClientes(this.puntoVentas.id).subscribe(response => {
      this.cboClientes = response.clientes;
    });
  }

  cargarProductos(){
    this.productosService.cargarProductosVentas(this.puntoVentas.id).subscribe(response => {
      this.cboProductos = response.productos;
    });
  }

  cambiarEstado(event: any, id: number){
    this.funcionesService.showLoading();
    this.pbMain = true;
    this.cotizacionService.cambiarEstado(event.value, id).subscribe(response => {
      if(response.status === 200){
        this.funcionesService.showSuccess(response.message);
        this.loadMain();
        this.funcionesService.hideLoading();
        this.pbMain = false;
      }else{
        this.funcionesService.showLoading();
        this.pbMain = false;
        this.funcionesService.showError(response.message);
      }
    });
  }

  deleteCotizaicon(cotizacion: Cotizacion) {

    this.funcionesService.showLoading();
    this.pbMain = true;

    this.cotizacionService.crudCotizacion(cotizacion).subscribe((response: any) => {

      if(response.status = 200){

        this.funcionesService.showSuccess(response.message);
        this.funcionesService.hideLoading();
        this.pbMain = false;

      }else{
        this.funcionesService.showError(response.message);
        this.funcionesService.hideLoading();
        this.pbMain = false;
      }
    }, (error: any) => {
      this.funcionesService.showError(error.error.errors[0].message);
      this.funcionesService.hideLoading();
      this.pbMain = false;
    });
  }

  generarDocumentos(event: any, cotizacion: Cotizacion){
    this.opcion = 4;
    this.cotizacion = cotizacion;

    if(parseInt(event.value) === 1){
      this.openModal('recibos');
    }else if(parseInt(event.value) === 2){
      this.openModal('ventas');
    }
  }

  downloadPDF(cotizacion: Cotizacion){
    this.cotizacion = cotizacion;
    this.openModal('downloadPDF');
  }

  downloadExcel(cotizacion: Cotizacion){
    this.funcionesService.showLoading();
    this.pbMain = true;

    const title = 'PEDIDO N° ' + cotizacion.numero;
    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('Pedido');

    // Add new row
    let titleRow = worksheet.addRow([title]);
    // Set font, size and style in title row.
    titleRow.font = { name: 'Arial', family: 4, size: 16, bold: true };

    worksheet.mergeCells(`A1:J1`);
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };

    // Blank Row
    worksheet.addRow([]);
    // ==================================================================================
    // ==================================================================================

    //CABECERA
    const headerCab = ["N° Doc", "Cliente", "Fecha"]

    const headerRowCabecera = worksheet.addRow(headerCab);
    let listaCab: any[] = [];
    listaCab.push(cotizacion.documento, cotizacion.razonSocial, cotizacion.fechaCotizacion);

    headerRowCabecera.eachCell((cell, number) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '828380' },
        bgColor: { argb: 'FF0000FF' }
      };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    worksheet.getColumn(1).width = 20;
    worksheet.getColumn(2).width = 60;
    worksheet.getColumn(3).width = 20;

    worksheet.addRow(listaCab);
    // ==================================================================================
    // ==================================================================================

    // Blank Row
    worksheet.addRow([]);

    const header = ["N°", "Descripcion", "Cantidad", "Valor Unitario", "Precio Unitario", "Descuento", "IGV", "Sub Total", "Total"]
    const data: Cotizacion[] = cotizacion.detalles;
    let lista: any[] = [];

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

    worksheet.getColumn(1).width = 10;
    worksheet.getColumn(2).width = 60;
    worksheet.getColumn(3).width = 10;
    worksheet.getColumn(4).width = 10;
    worksheet.getColumn(5).width = 10;
    worksheet.getColumn(6).width = 10;
    worksheet.getColumn(7).width = 10;
    worksheet.getColumn(8).width = 10;
    worksheet.getColumn(9).width = 10;

    data.forEach((element: DetallesCotizacion, index: any) => {
      lista.push(index + 1, element.descripcion, element.cantidad, (element.precio / 1.18).toFixed(2), element.precio, element.montoDesc, element.igv, element.subtotal, element.total);
      worksheet.addRow(lista);
      lista = [];
    });
    worksheet.addRow([]);

    // ==================================================================================
    // ==================================================================================

     //TOTALES
     const headerTotales = ["", "", "Sub Total", "IGV", "Total"]

     const headerRowTotales = worksheet.addRow(headerTotales);
     let listaTotales: any[] = [];
     listaTotales.push('', '', cotizacion.subtotal, cotizacion.impuesto, cotizacion.total);

     headerRowTotales.eachCell((cell, number) => {
       cell.fill = {
         type: 'pattern',
         pattern: 'solid',
         fgColor: { argb: '828380' },
         bgColor: { argb: 'FF0000FF' }
       };
       cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
     });

     worksheet.getColumn(3).width = 10;
     worksheet.getColumn(4).width = 20;
     worksheet.getColumn(5).width = 20;
     worksheet.getColumn(6).width = 20;

     worksheet.addRow(listaTotales);
     // ==================================================================================
    // ==================================================================================

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'Pedido ' + cotizacion.numero + '.xlsx');
    });

    this.funcionesService.hideLoading();
    this.pbMain = false;
  }

}
