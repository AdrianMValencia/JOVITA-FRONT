import { Component, OnInit, Type, ViewChild } from '@angular/core';
import { FuncionesService } from '../../../shared/services/funciones.service';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Pedidos } from './model/pedidos';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModalOptions, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MatPaginator } from '@angular/material/paginator';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');
import { saveAs } from 'file-saver';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { PedidosDetalles } from './model/pedidosDetalles';
import { ProductosService } from '../../almacen/productos/service/Productos.service';
import { Productos } from '../../almacen/productos/model/productos';
import { Usuarios } from '../../Usuarios/models/Usurarios';
import { PedidosService } from './service/pedidos.service';
import { ModalPedidosComponent } from './modalPedidos/modalPedidos.component';
import { ModalpedidospdfComponent } from './modalpedidospdf/modalpedidospdf.component';

// Modals
const MODALS: { [name: string]: Type<any> } = {
  pedidos: ModalPedidosComponent,
  downloadPDF: ModalpedidospdfComponent
};

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.component.html',
  providers: [ PedidosService ]
})
export class PedidosComponent implements OnInit {

  // FormGroup
  fgMain: FormGroup | any;

  pedidos: Pedidos = new Pedidos(0, '', '', '0', '', '', '', false, '', '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  opcion: number = 0;

  // Progress Bar
  progressBar: boolean = false;

  // PRINCIPAL
  MainDC: string[] = ['pedido', 'fechaPedido', 'puntoVenta', 'vendedor', 'total', 'pdf', 'acciones'];
  MainDS: MatTableDataSource<Pedidos> = new MatTableDataSource<Pedidos>();
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
  cboProductos: Productos[] = [];
  cboVendedores: Usuarios[] = [];
  cboPuntoVentas: PuntosVenta[] = [];
  aDetail: PedidosDetalles[] = [];

  currentPage: number = 0;
  perPage: number = 10;
  totalRows: number = 0;

  cargandoProductos: boolean = false;

  constructor(
    public pedidosService: PedidosService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    private _modalService: NgbModal
  ) {
    this.new_fgMain();
  }

  new_fgMain(){
    this.fgMain = this.fb.group({
      idPuntoVenta: '',
      idUsuario: '',
      idProducto: '',
      codigoBarra: '',
      fechaIni: '',
      fechaFin: '',
      puntoventa:'',
      usuarios: '',
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
      case 'pedidos':
        obj['opcion'] = this.opcion;
        obj['pedidos'] = this.pedidos;
        obj['productos'] = this.cboProductos;
        obj['usuarios'] = this.cboVendedores;
        obj['puntoVentas'] = this.cboPuntoVentas;
        modalRef.componentInstance.fromParent = obj;
      break;
      case 'downloadPDF':
        obj['pedidos'] = this.pedidos;
        modalRef.componentInstance.fromParent = obj;
      break;
    }

    modalRef.result.then((result) => {

      switch (result.modal) {
        case 'pedidos':
          if (result.value === 'loadAgain') {
            this.buscar();
          }
          break;
      }
    }, (reason) => { });
  }

  crudRegistros(){
    this.opcion = 1;
    this.openModal('pedidos');
  }

  viewDetail(element: any) {
    this.opcion = 2;
    this.pedidos = element;

    let detalles: PedidosDetalles[] = [];
    this.aDetail.forEach(detail => {
      if (parseInt(detail.idPedido) === parseInt(element.id)) {
        detalles.push(detail);
      }
    });

    this.pedidos.detalles = detalles;
    this.openModal('pedidos');
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
    this.pedidosService.buscarPorFecha(this.currentPage, this.perPage, this.fgMain.get('fechaIni').value, this.fgMain.get('fechaFin').value, this.puntoVentas.id).subscribe(response => {
      if(response.status === 200){
        this.funcionesService.hideLoading();

        this.cboProductos = response.productos;
        this.cboVendedores = response.usuarios;
        this.cboPuntoVentas = response.puntoVentas;
        this.cargandoProductos = true;

        this.aDetail  = response.detalles;
        this.MainDS = new MatTableDataSource<Pedidos>(response.pedidos);
        this.MainDS.paginator = this.pagMain;
        this.MainDS.filterPredicate = function(data: Pedidos, filter: string): boolean {
          return data.idPuntoVenta.includes(filter);
        };

        this.MainDS.filterPredicate = ((data: Pedidos, filter: any ) => {
          const a = !filter.usuarios || parseInt(data.idUsuario) === parseInt(filter.usuarios.id);
          const b = this.cantPerso(data.id) > 0;
          return a && b;
        }) as (PeriodicElement: any, string: any) => boolean;
      }
    });
  }

  cantPerso(id: number) {

    const sText = this.fgMain.get("productos").value.id as string;
    const sText2 = this.fgMain.get("codigoBarra").value.id as string;
    let detail: PedidosDetalles[] = [];

    Object.values(this.aDetail).forEach((element: any) => {
      if (parseInt(element.idCompra) === id ) {
        detail.push(element);
      }
    });

    const aFilter = detail.filter( (x: any) => {
      const a = !sText || parseInt(x.idProducto) === parseInt(sText);
      const b = !sText2 || parseInt(x.codigoBarra) === parseInt(sText2);
      return a;
    });

    return aFilter.length;
  }

  eliminarRegistro(element: Pedidos){
    this.funcionesService.mensajeConfirmar('¿Desea eliminar este registro?', '', (result: any) => {
      if (result.isConfirmed) {
        this.funcionesService.showLoading();
        this.pedidosService.deletePedidos(element).subscribe(response => {
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

  downloadPDFIndivual(element: Pedidos){
    this.pedidos = element;
    this.openModal('downloadPDF');
  }

  generateData() {
    var result: any[] = [];
    var data = this.MainDS.filteredData;

    data.forEach((element: any) => {

      result.push([
        element.id = element.id,
        element.created_at == null ? '': this.funcionesService.formatearFecha5(element.created_at),
        element.idPuntoVenta == null ? '': this.puntoVentas.nombre,
        element.puntoVentaLlegada == null ? '': element.puntoVentaLlegada,
        element.vendedor == null ? '': element.vendedor,
        element.total == null ? '': parseFloat(element.total).toFixed(2),
        element.observaciones == null ? '': element.observaciones,
        element.status == 1 ? 'ACTIVO': 'INACTIVO'
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
    doc.text("REPORTE DE PEDIDOS DE PRODUCTOS POR VENDEDORES", 140, 30, {align: "center"});
    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
      margin: {top: 40},
      head: [[ "NRO DE PEDIDO", "FECHA DE PEDIDO", "PUNTO DE VENTA SALIDA", "PUNTO DE VENTA DESTINO", "VENDEDOR", "TOTAL PEDIDO", "ESTADO"]],
      body: this.generateData()
    });
    doc.save('Reporte Pedidos.pdf');

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  downloadExcel(){
    this.funcionesService.showLoading();
    this.progressBar = true;

    const title = 'REPORTE DE PEDIDOS DE PRODUCTOS POR VENDEDORES';
    const header = [ "NRO DE PEDIDO", "FECHA DE PEDIDO", "PUNTO DE VENTA SALIDA", "PUNTO DE VENTA DESTINO", "VENDEDOR", "TOTAL PEDIDO", "ESTADO"];
    const data = this.MainDS.filteredData;
    let lista: any[] = [];

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('Pedidos');

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
    worksheet.getColumn(5).width = 30;
    worksheet.getColumn(6).width = 30;
    worksheet.getColumn(7).width = 30;

    data.forEach((element: any) => {
      lista.push(
        element.id = element.id,
        element.created_at == null ? '': this.funcionesService.formatearFecha5(element.created_at),
        element.idPuntoVenta == null ? '': this.puntoVentas.nombre,
        element.puntoVentaLlegada == null ? '': element.puntoVentaLlegada,
        element.vendedor == null ? '': element.vendedor,
        element.total == null ? '': parseFloat(element.total).toFixed(2),
        element.observaciones == null ? '': element.observaciones,
        element.status == 1 ? 'ACTIVO': 'INACTIVO'
      );
      worksheet.addRow(lista);
      lista = [];
    });

    worksheet.addRow([]);

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'Reporte Pedidos.xlsx');
    });

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }
}
