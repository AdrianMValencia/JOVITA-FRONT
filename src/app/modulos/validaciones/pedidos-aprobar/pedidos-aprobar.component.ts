import { Component, OnInit, Type, ViewChild } from '@angular/core';

declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');
import { saveAs } from 'file-saver';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { FormBuilder, FormGroup } from '@angular/forms';
import { OrdenRequerimiento } from '../../pedidos/orden-requerimiento/model/ordenRequerimiento';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Productos } from '../../almacen/productos/model/productos';
import { Usuarios } from '../../Usuarios/models/Usurarios';
import { OrdenRequerimientoDetalles } from '../../pedidos/orden-requerimiento/model/ordenRequerimientoDetalles';
import { OrdenRequerimientoService } from '../../pedidos/orden-requerimiento/service/orden-requerimiento.service';
import { ModalOrdenRequerimientoPdfComponent } from '../../pedidos/orden-requerimiento/modal-orden-requerimiento-pdf/modal-orden-requerimiento-pdf.component';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { ModalPedidosAprobarComponent } from './modal-pedidos-aprobar/modal-pedidos-aprobar.component';

// Modals
const MODALS: { [name: string]: Type<any> } = {
  ordenRequerimiento: ModalPedidosAprobarComponent,
  downloadPDF: ModalOrdenRequerimientoPdfComponent
};

@Component({
  selector: 'app-pedidos-aprobar',
  templateUrl: './pedidos-aprobar.component.html',
  providers: [OrdenRequerimientoService]
})
export class PedidosAprobarComponent implements OnInit {

 // FormGroup
  fgMain: FormGroup | any;

  ordenRequerimiento: OrdenRequerimiento = new OrdenRequerimiento(0, '', '', '0', '', '', '', false, '', '', '', '', '', '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  opcion: number = 0;

  // Progress Bar
  progressBar: boolean = false;

  // PRINCIPAL
  MainDC: string[] = ['pedido', 'fechaPedido', 'puntoVenta', 'vendedor', 'total', 'pdf', 'estadoActual', 'acciones'];
  MainDS: MatTableDataSource<OrdenRequerimiento> = new MatTableDataSource<OrdenRequerimiento>();
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
  aDetail: OrdenRequerimientoDetalles[] = [];

  currentPage: number = 0;
  perPage: number = 10;
  totalRows: number = 0;

  cargandoProductos: boolean = false;

  constructor(
    public ordenRequerimientoService: OrdenRequerimientoService,
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
      productos: '',
      estadoActual: [2]
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
    this.fgMain.get('estadoActual').setValue([2,3,4]);

    this.buscar();
  }

  openModal(name: string) {

    const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
    const obj: any = new Object();

    switch (name) {
      case 'ordenRequerimiento':
        obj['opcion'] = this.opcion;
        obj['ordenRequerimiento'] = this.ordenRequerimiento;
        obj['productos'] = this.cboProductos;
        obj['usuarios'] = this.cboVendedores;
        obj['puntoVentas'] = this.cboPuntoVentas;
        modalRef.componentInstance.fromParent = obj;
      break;
      case 'downloadPDF':
        obj['ordenRequerimiento'] = this.ordenRequerimiento;
        modalRef.componentInstance.fromParent = obj;
      break;
    }

    modalRef.result.then((result) => {

      switch (result.modal) {
        case 'ordenRequerimiento':
          if (result.value === 'loadAgain') {
            this.buscar();
          }
          break;
      }
    }, (reason) => { });
  }

  crudRegistros(){
    this.opcion = 1;
    this.openModal('ordenRequerimiento');
  }

  viewDetail(element: any) {
    this.opcion = 2;
    this.ordenRequerimiento = element;

    let detalles: OrdenRequerimientoDetalles[] = [];
    this.aDetail.forEach(detail => {
      if (parseInt(detail.idOrdenRequerimiento) === parseInt(element.id)) {
        detalles.push(detail);
      }
    });

    this.ordenRequerimiento.detalles = detalles;
    this.openModal('ordenRequerimiento');
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
    if(this.fgMain.get('estadoActual').value === ''){
      this.funcionesService.showError('Seleccione el estado');
      return false;
    }

    this.funcionesService.showLoading();
    this.ordenRequerimientoService.buscarPorFecha(this.currentPage, this.perPage, this.fgMain.get('fechaIni').value, this.fgMain.get('fechaFin').value, this.fgMain.get('estadoActual').value, this.puntoVentas.id).subscribe(response => {
      if(response.status === 200){
        this.funcionesService.hideLoading();

        this.cboProductos = response.productos;
        this.cboVendedores = response.usuarios;
        this.cboPuntoVentas = response.puntoVentas;
        this.cargandoProductos = true;

        this.aDetail  = response.detalles;
        this.MainDS = new MatTableDataSource<OrdenRequerimiento>(response.ordenRequerimiento);
        this.MainDS.paginator = this.pagMain;
        this.MainDS.filterPredicate = function(data: OrdenRequerimiento, filter: string): boolean {
          return data.idPuntoVenta.includes(filter);
        };

        this.MainDS.filterPredicate = ((data: OrdenRequerimiento, filter: any ) => {
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
    let detail: OrdenRequerimientoDetalles[] = [];

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

  eliminarRegistro(element: OrdenRequerimiento){
    this.funcionesService.mensajeConfirmar('¿Desea eliminar este registro?', '', (result: any) => {
      if (result.isConfirmed) {
        this.funcionesService.showLoading();
        this.ordenRequerimientoService.deleteOrdenRequerimiento(element).subscribe(response => {
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

  downloadPDFIndivual(element: OrdenRequerimiento){
    this.ordenRequerimiento = element;
    this.openModal('downloadPDF');
  }

  generateData() {
    var result: any[] = [];
    var data = this.MainDS.filteredData;

    data.forEach((element: any) => {

      result.push([
        element.id.toString().padStart(4, '0'),
        this.funcionesService.formatearFecha5(element.created_at),
        this.puntoVentas.nombre,
        element.vendedor == null ? '': element.vendedor,
        element.total == null ? '': parseFloat(element.total).toFixed(2),
        element.observaciones == null ? '': element.observaciones,
        parseInt(element.estadoActual) == 1 ? 'Pendiente de Pedido': parseInt(element.estadoActual) == 2 ? 'Pendiente de Aprobación' : 'Requerimiento Cancelado'
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
    doc.text("REPORTE ORDEN DE REQUERIMIENTO", 140, 30, {align: "center"});
    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
      margin: {top: 40},
      head: [[ "NRO DE PEDIDO", "FECHA DE PEDIDO", "PUNTO DE VENTA", "VENDEDOR", "TOTAL PEDIDO", "ESTADO"]],
      body: this.generateData()
    });
    doc.save('Reporte_Orden_Requerimientop.pdf');

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  downloadExcel(){
    this.funcionesService.showLoading();
    this.progressBar = true;

    const title = 'REPORTE ORDEN DE REQUERIMIENTO';
    const header = [ "NRO DE PEDIDO", "FECHA DE PEDIDO", "PUNTO DE VENTA", "VENDEDOR", "TOTAL PEDIDO", "ESTADO"];
    const data = this.MainDS.filteredData;
    let lista: any[] = [];

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('OrdenRequerimiento');

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
        element.id.toString().padStart(4, '0'),
        this.funcionesService.formatearFecha5(element.created_at),
        this.puntoVentas.nombre,
        element.vendedor == null ? '': element.vendedor,
        element.total == null ? '': parseFloat(element.total).toFixed(2),
        element.observaciones == null ? '': element.observaciones,
        parseInt(element.estadoActual) == 1 ? 'Pendiente de Pedido': parseInt(element.estadoActual) == 2 ? 'Pendiente de Aprobación' : 'Requerimiento Cancelado'
      );
      worksheet.addRow(lista);
      lista = [];
    });

    worksheet.addRow([]);

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'Reporte_Orden_Requerimientop.xlsx');
    });

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

}
