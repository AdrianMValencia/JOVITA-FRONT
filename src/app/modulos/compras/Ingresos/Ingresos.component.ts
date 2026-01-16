import { Component, OnInit, Type, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

import { NgbModalOptions, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Productos } from 'src/app/modulos/almacen/productos/model/productos';
import { ProductosService } from 'src/app/modulos/almacen/productos/service/Productos.service';
import { Proveedor } from 'src/app/modulos/mantenimientos/proveedor/model/proveedor';
import { ProveedorService } from 'src/app/modulos/mantenimientos/proveedor/service/proveedor.service';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

import { ModalIngresosComponent } from './modalIngresos/modalIngresos.component';
import { Compras } from './model/compras';
import { ComprasService } from './service/compras.service';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');
import { saveAs } from 'file-saver';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { ComprasDetalles } from './model/comprasDetalles';

// Modals
const MODALS: { [name: string]: Type<any> } = {
  compras: ModalIngresosComponent
};

@Component({
  selector: 'app-Ingresos',
  templateUrl: './Ingresos.component.html',
  providers: [ ComprasService, ProveedorService, ProductosService ]
})
export class IngresosComponent implements OnInit {

  // FormGroup
  fgMain: FormGroup | any;

  compras: Compras = new Compras(0, '', '', '0', '', '', '', '0', '', '', '', '', '', '', true, '', 1, '', '', '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  opcion: number = 0;
  paginaActual: number = 1;

  // Progress Bar
  progressBar: boolean = false;

  // PRINCIPAL
  MainDC: string[] = ['idTipoDocumento', 'numeroTipoDocumento', 'fechaCompra', 'rucProveedor', 'razonSocial', 'total', 'acciones'];
  MainDS: MatTableDataSource<Compras> = new MatTableDataSource<Compras>();
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
  cboProveedores: Proveedor[] = [];
  cboProductos: Productos[] = [];
  aDetail: ComprasDetalles[] = [];

  currentPage: number = 0;
  perPage: number = 10;
  totalRows: number = 0;

  cargandoProductos: boolean = false;

  constructor(
    public comprasService: ComprasService,
    private proveedorService: ProveedorService,
    private productosService: ProductosService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    private _modalService: NgbModal
  ) {
    this.new_fgMain();
  }

  new_fgMain(){
    this.fgMain = this.fb.group({
      idPuntoVenta: '',
      idProveedor: '',
      idProducto: '',
      fechaIni: '',
      fechaFin: '',
      puntoventa:'',
      proveedores: '',
      productos: ''
    });


    this.fgMain.valueChanges.subscribe((value: any) => {
      const filter = { ...value, idPuntoVenta: value.idPuntoVenta } as string;
      this.MainDS.filter = filter;

      if (this.MainDS.paginator) {
        this.MainDS.paginator.firstPage();
      }
    });
  }

  get getMain() { return this.fgMain.controls; }

  ngOnInit() {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.fgMain.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.fgMain.get('puntoventa').setValue(this.puntoVentas.nombre);
    this.fgMain.get('fechaIni').setValue(this.funcionesService.generarFechaLocal(new Date));
    this.fgMain.get('fechaFin').setValue(this.funcionesService.generarFechaLocal(new Date));

    this.buscar();
  }

  openModal(name: string) {

    const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
    const obj: any = new Object();

    switch (name) {
      case 'compras':
        obj['opcion'] = this.opcion;
        obj['compras'] = this.compras;
        obj['productos'] = this.cboProductos;
        modalRef.componentInstance.fromParent = obj;
      break;
    }

    modalRef.result.then((result) => {

      switch (result.modal) {
        case 'compras':
          if (result.value === 'loadAgain') {
            // setTimeout(() => {
            //   location.reload();
            // }, 1000);
            this.buscar();
          }
          break;
      }
    }, (reason) => { });
  }

  limpiar(){
    this.fgMain = this.fb.group({
      idPuntoVenta: '',
      idProveedor: '',
      idProducto: '',
      fechaIni: this.funcionesService.generarFechaLocal(new Date),
      fechaFin: this.funcionesService.generarFechaLocal(new Date),
      puntoventa:'',
      proveedores: '',
      productos: ''
    });

    this. buscar();
  }

  crudRegistros(){
    this.opcion = 1;
    this.openModal('compras');
  }

  viewDetail(element: any) {
    this.opcion = 2;
    this.compras = element;

    let detalles: ComprasDetalles[] = [];
    this.aDetail.forEach(detail => {
      if (parseInt(detail.idCompra) === parseInt(element.id)) {
        detalles.push(detail);
      }
    });

    this.compras.detalles = detalles;
    this.openModal('compras');
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
    this.comprasService.buscarPorFecha(this.currentPage, this.perPage, this.fgMain.get('fechaIni').value, this.fgMain.get('fechaFin').value, this.puntoVentas.id).subscribe(response => {
      if(response.status === 200){
        this.funcionesService.hideLoading();
        this.cargarProveedores();
        this.cargarProductos();
        this.aDetail  = response.detalles;
        this.MainDS = new MatTableDataSource<Compras>(response.compras);
        this.MainDS.paginator = this.pagMain;
        // setTimeout(() => {
        //   this.pagMain.pageIndex = this.currentPage;
        //   this.pagMain.length = response.compras.total;
        // });

        this.MainDS.filterPredicate = function(data: Compras, filter: string): boolean {
          return data.idPuntoVenta.includes(filter);
        };

        this.MainDS.filterPredicate = ((data: Compras, filter: any ) => {
          const a = !filter.proveedores || parseInt(data.idProveedor) === parseInt(filter.proveedores.id);
          const b = this.cantPerso(data.id) > 0;
          return a && b;
        }) as (PeriodicElement: any, string: any) => boolean;
      }
    });
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.perPage = event.pageSize;
    this.buscar();
  }

  loadMain() {
    this.funcionesService.showLoading();
    this.comprasService.obtenerCompras(this.puntoVentas.id).subscribe(response => {
      this.MainDS = new MatTableDataSource<Compras>(response.compras);
      this.aDetail  = response.detalles;
      this.MainDS.paginator = this.pagMain;
      this.cargarProveedores();
      this.funcionesService.hideLoading();

      this.MainDS.filterPredicate = function(data: Compras, filter: string): boolean {
        return data.idPuntoVenta.includes(filter);
      };

      this.MainDS.filterPredicate = ((data: Compras, filter: any ) => {
        const a = !filter.proveedores || parseInt(data.idProveedor) === parseInt(filter.proveedores.id);
        const b = this.cantPerso(data.id) > 0;
          return a && b;
      }) as (PeriodicElement: any, string: any) => boolean;

    }, error => {
      console.log(error);
    });
  }

  cantPerso(id: number) {

    const sText = this.fgMain.get("productos").value.id as string;
    let detail: ComprasDetalles[] = [];

    Object.values(this.aDetail).forEach((element: any) => {
      if (parseInt(element.idCompra) === id ) {
        detail.push(element);
      }
    });

    const aFilter = detail.filter( (x: any) => {
      const a = !sText || parseInt(x.idProducto) === parseInt(sText);
      return a;
    });

    return aFilter.length;
  }

  eliminarRegistro(element: Compras){
    this.funcionesService.mensajeConfirmar('¿Desea eliminar este registro?', '', (result: any) => {
      if (result.isConfirmed) {
        this.funcionesService.showLoading();
        this.comprasService.deleteCompras(element).subscribe(response => {
          if (response.status === 200) {
            this.fgMain.get('fechaIni').setValue(this.funcionesService.generarFechaLocal(new Date));
            this.fgMain.get('fechaFin').setValue(this.funcionesService.generarFechaLocal(new Date));
            this. buscar();
            this.funcionesService.showSuccess(response.message);
            this.funcionesService.hideLoading();
            location.reload();
          }
          else {
            this.funcionesService.showError(response.message);
            this.funcionesService.hideLoading();
            return;
          }
        }, (err: any) => {
          console.log(err);
          this.funcionesService.hideLoading();
        });
      }
    });
  }

  cargarProveedores(){
    this.proveedorService.obtenerProveedor(this.puntoVentas.id).subscribe(response => {
      this.cboProveedores = response.proveedores;
    });
  }

  cargarProductos(){
    this.productosService.cargarProductosVentas(this.puntoVentas.id).subscribe(response => {
      this.cboProductos = response.productos;
      this.cargandoProductos = true;
    });
  }

  generateData() {
    var result: any[] = [];
    var data = this.MainDS.filteredData;

    data.forEach((element: any) => {

      result.push([
        element.idPuntoVenta == null ? '': this.puntoVentas.nombre,
        element.fechaCompra == null ? '': this.funcionesService.generarFechaLocalSUNAT(new Date(element.fechaCompra)),
        element.rucProveedor == null ? '': element.rucProveedor,
        element.nombreProveedor == null ? '': element.nombreProveedor,
        element.nombreTipoDocumento == null ? '': element.nombreTipoDocumento,
        element.numeroTipoDocumento == null ? '': element.numeroTipoDocumento,
        element.totalCompras == null ? '': parseFloat(element.totalCompras).toFixed(2)
      ]);

    });

    return result;
  }

  downloadPDF(){
    this.funcionesService.showLoading();
    this.progressBar = true;

    var doc = new jsPDF.default('landscape');
    doc.setFontSize(20);
    doc.setFont("arial", "bold");
    doc.getLineHeight();
    doc.text("REPORTE COMPRAS", 140, 30, {align: "center"});
    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
      margin: {top: 40},
      head: [[ "PUNTO DE VENTA", "FECHA DE COMPRA", "RUC PROVEEDOR", "NOMBRE PROVEEDOR", "TIPO DE DOCUMENTO", "NÚMERO DE DOCUMENTO", "TOTAL"]],
      body: this.generateData()
    });
    doc.save('Reporte Compras.pdf');

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  downloadExcel(){
    this.funcionesService.showLoading();
    this.progressBar = true;

    const title = 'REPORTE COMPRAS';
    const header = [ "PUNTO DE VENTA", "FECHA DE COMPRA", "RUC PROVEEDOR", "NOMBRE PROVEEDOR", "TIPO DE DOCUMENTO", "NÚMERO DE DOCUMENTO", "TOTAL"];
    const data = this.MainDS.filteredData;
    let lista: any[] = [];

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('Compras');

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

    worksheet.getColumn(1).width = 30;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 30;
    worksheet.getColumn(4).width = 30;
    worksheet.getColumn(5).width = 20;
    worksheet.getColumn(6).width = 20;
    worksheet.getColumn(7).width = 20;

    data.forEach((element: any) => {
      lista.push(
        element.idPuntoVenta == null ? '': this.puntoVentas.nombre,
        element.fechaCompra == null ? '': this.funcionesService.generarFechaLocalSUNAT(new Date(element.fechaCompra)),
        element.rucProveedor == null ? '': element.rucProveedor,
        element.nombreProveedor == null ? '': element.nombreProveedor,
        element.nombreTipoDocumento == null ? '': element.nombreTipoDocumento,
        element.numeroTipoDocumento == null ? '': element.numeroTipoDocumento,
        element.totalCompras == null ? '': parseFloat(element.totalCompras).toFixed(2)
      );
      worksheet.addRow(lista);
      lista = [];
    });

    worksheet.addRow([]);

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'Reporte Compras.xlsx');
    });

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  download(compras: Compras){
    let type: string = compras.archivo.split('.')[1];
    this.downloadPdf(compras.archivo, type, compras.numeroTipoDocumento);
  }

  downloadPdf(base64String: any, type: string, fileName: string) {
    const source = `data:${type};base64,${base64String}`;
    const link = document.createElement("a");
    link.href = source;
    link.download = `Documento-${fileName}.${type.split('/')[1]}`;
    link.click();
  }

}
