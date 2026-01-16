import { Component, OnInit, Type, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { AjusteInventario } from "./models/ajuste-inventario";
import { PuntosVenta } from "../../mantenimientos/puntosventa/model/puntosVenta";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { FuncionesService } from "src/app/shared/services/funciones.service";
import { AjustesInventarioService } from "./service/ajustes-inventario.service";
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { ProductosService } from "../productos/service/Productos.service";
import { Productos } from "../productos/model/productos";
import { NgbModal, NgbModalOptions } from "@ng-bootstrap/ng-bootstrap";
import { CrudAjusteInventarioComponent } from "./crud-ajuste-inventario/crud-ajuste-inventario.component";

// Modals
const MODALS: { [name: string]: Type<any> } = {
  ajustesInventario: CrudAjusteInventarioComponent,
};

@Component({
  selector: "app-ajustes-inventario",
  templateUrl: "./ajustes-inventario.component.html",
  styleUrls: ["./ajustes-inventario.component.scss"]
})

export class AjustesInventarioComponent implements OnInit {

  // FormGroup
  fgMain: FormGroup | any;

  ajustesInventario: AjusteInventario = new AjusteInventario(0, '', '', '', '', '', '', '', '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  opcion: number = 0;

  //COMBOS
  cboProductos: Productos[] = [];
  selectedRowIndex: any;

  // PRINCIPAL
  MainDC: string[] = ['index', 'puntoVenta', 'fecha', 'categoria', 'producto', 'codigo', 'cantidad', 'acciones'];
  MainDS: MatTableDataSource<AjusteInventario> = new MatTableDataSource<AjusteInventario>();
  @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

  NgbModalOptions: NgbModalOptions = {
    size: 'xl',
    centered: true,
    scrollable: true,
    keyboard: false,
    backdrop: 'static',
    windowClass: 'modal-holder'
  };

  constructor(
    public ajustesInventarioService: AjustesInventarioService,
    public funcionesService: FuncionesService,
    private productosService: ProductosService,
    private fb: FormBuilder,
    private _modalService: NgbModal
  ) {
    this.new_fgMain();
  }

  new_fgMain(){
    this.fgMain = this.fb.group({
      puntoVenta:'',
      codigo_barras: '',
      idProducto: '',
      productos: '',
      fechaIni: '',
      fechaFin: '',
    });

    this.fgMain.valueChanges.subscribe((value: any) => {
      if(value.codigo_barras === null){
        value.codigo_barras = '';
      }
      const filter = { ...value, name: value.codigo_barras } as string;
      this.MainDS.filter = filter;

      if (this.MainDS.paginator) {
        this.MainDS.paginator.firstPage();
      }
    });
  }

   get getMain() { return this.fgMain.controls; }

  ngOnInit() {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.fgMain.get('puntoVenta').setValue(this.puntoVentas.nombre);
    this.fgMain.get('fechaIni').setValue(this.funcionesService.primerDiaMes());
    this.fgMain.get('fechaFin').setValue(this.funcionesService.ultimoDiaMes());
    this.cargarProductos();
    this.loadMain();
  }

  crudRegistros(){
     this.opcion = 1;
     this.openModal('ajustesInventario');
   }

  viewDetail(element: any) {
     this.opcion = 2;
     this.openModal('ajustesInventario', element);
   }

  openModal(name: string, ajustesInventario: AjusteInventario | any = null) {

    const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
    const obj: any = new Object();

    switch (name) {
      case 'ajustesInventario':
        obj['opcion'] = this.opcion;
        obj['ajustesInventario'] = ajustesInventario;
        obj['productos'] = this.cboProductos;
        modalRef.componentInstance.fromParent = obj;
      break;
    }

    modalRef.result.then(async (result) => {

      switch (result.modal) {
        case 'ajustesInventario':
          if (result.value === 'loadAgain') {
              await this.loadMain();
          }
          break;
      }

    }, (reason) => { });
  }

  selectEventProductos(event: any){
    this.fgMain.get('productos').setValue(event);
    this.fgMain.get('idProducto').setValue(event.id);
  }

  loadMain() {
    this.funcionesService.showLoading();
    this.ajustesInventarioService.obtenerAjusteInventario(this.puntoVentas.id).subscribe(response => {

      this.MainDS = new MatTableDataSource<AjusteInventario>(response.ajustes);
      this.MainDS.paginator = this.pagMain;

      this.MainDS.filterPredicate = function(data: AjusteInventario, filter: string): boolean {
        return data.id.includes(filter);
      };

      this.MainDS.filterPredicate = ((data: AjusteInventario, filter: any ) => {
        const a = !filter.codigo_barras || data.codigo_barras.toLowerCase().includes(filter.codigo_barras.toLowerCase());
        const b = !filter.productos || parseInt(data.id) === filter.productos.id;
        const c = !filter.fechaIni ||  new Date(this.funcionesService.formatearFecha4(data.created_at)) > new Date(filter.fechaIni) && new Date(this.funcionesService.formatearFecha4(data.created_at)) < new Date(filter.fechaFin);
        return a && b && c;
      }) as (PeriodicElement: any, string: any) => boolean;
      this.funcionesService.hideLoading();
    }, error => {
      console.log(error);
    });
  }

  cargarProductos(){
    this.productosService.cargarProductosVentas(this.puntoVentas.id).subscribe(response => {
      this.cboProductos = response.productos;
    });
  }

  eliminarRegistro(element: AjusteInventario){
    this.funcionesService.mensajeConfirmar('¿Desea eliminar este registro?', '', (result: any) => {
      if (result.isConfirmed) {
        this.ajustesInventarioService.deleteAjusteInventario(element).subscribe(response => {
          this.funcionesService.showLoading();
          if (response.status === 200) {
            this.funcionesService.showSuccess(response.message);
            this.loadMain();
            this.funcionesService.hideLoading();
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

  generateData() {
     var result: any[] = [];
     var data = this.MainDS.filteredData;

     data.forEach((element: any) => {

       result.push([
         element.puntoVenta,
         this.funcionesService.formatearFecha5(this.funcionesService.formatearFecha4(element.created_at)),
         element.categoria == null ? '': element.categoria,
         element.nombreProducto == null ? '': element.nombreProducto,
         element.codigo_barras == null ? '': element.codigo_barras,
         element.cantidad == null ? '': element.cantidad
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
     doc.text("REPORTE AJUSTES POR INVENTARIO", 140, 30, {align: "center"});
     doc.autoTable({
       styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
       margin: {top: 40},
       head: [[ "PUNTO DE VENTA", "FECHA", "CATEGORIA", "PRODUCTO", "CODIGO DE BARRAS", "CANTIDAD"]],
       body: this.generateData()
     });
     doc.save('Reporte Ajustes por Inventario.pdf');

     this.funcionesService.hideLoading();
   }

   downloadExcel(){
     this.funcionesService.showLoading();

     const title = 'REPORTE AJUSTES POR INVENTARIO';
     const header = [ "PUNTO DE VENTA", "FECHA", "CATEGORIA", "PRODUCTO", "CODIGO DE BARRAS", "CANTIDAD"];
     const data = this.MainDS.filteredData;
     let lista: any[] = [];

     let workbook = new Workbook();
     let worksheet = workbook.addWorksheet('Ajustes por Inventario');

     // Add new row
     let titleRow = worksheet.addRow([title]);
     // Set font, size and style in title row.
     titleRow.font = { name: 'Arial', family: 4, size: 16, bold: true };

     worksheet.mergeCells(`A1:F1`);
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
     worksheet.getColumn(4).width = 40;
     worksheet.getColumn(5).width = 20;
     worksheet.getColumn(6).width = 20;

     data.forEach((element: any) => {
       lista.push(
         element.puntoVenta,
         this.funcionesService.formatearFecha5(this.funcionesService.formatearFecha4(element.created_at)),
         element.categoria == null ? '': element.categoria,
         element.nombreProducto == null ? '': element.nombreProducto,
         element.codigo_barras == null ? '': element.codigo_barras,
         element.cantidad == null ? '': element.cantidad
       );
       worksheet.addRow(lista);
       lista = [];
     });

     worksheet.addRow([]);

     workbook.xlsx.writeBuffer().then((data: any) => {
       const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
       fs.saveAs(blob, 'Reporte Ajustes por Inventario.xlsx');
     });

     this.funcionesService.hideLoading();
   }
}
