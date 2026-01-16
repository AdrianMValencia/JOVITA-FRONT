import { Component, OnInit, Type, ViewChild } from '@angular/core';
import { FuncionesService } from '../../../shared/services/funciones.service';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { PuntosventaService } from '../../mantenimientos/puntosventa/service/puntosventa.service';
import { MatTableDataSource } from '@angular/material/table';
import { Productos } from '../productos/model/productos';
import { MatPaginator } from '@angular/material/paginator';
import { ProductosService } from '../productos/service/Productos.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ModalProductosComponent } from '../productos/modalProductos/modalProductos.component';
declare var $:any;
// Modals
const MODALS: { [name: string]: Type<any> } = {
  productos: ModalProductosComponent
};

@Component({
  selector: 'app-stocktiendas',
  templateUrl: './stocktiendas.component.html',
  providers: [ProductosService, PuntosventaService]
})
export class StocktiendasComponent implements OnInit {

  productos: Productos = new Productos(0, '', '', '0', '', '', '0', '', '0', '', '', '', '', '', '', '', '', '', '', true, '', 1, '');
  // FormGroup
  fgMain: FormGroup | any;
  puntoVenta: string = '';
  opcion: number = 0;
  lista: Productos[] = [];
  cboPuntoVenta: PuntosVenta[] = [];
  idPuntoVenta: number = 0;

  // PRINCIPAL
  MainDC: string[] = ['categoria', 'unidadMedidas', 'nombre', 'stockActual', 'precio', 'status', 'acciones'];
  MainDS: MatTableDataSource<Productos> = new MatTableDataSource<Productos>();
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
    private productosService: ProductosService,
    private puntosVentaService: PuntosventaService,
    private funcionesService: FuncionesService,
    private fb: FormBuilder,
    private _modalService: NgbModal
  ){
    this.new_fgMain();
  }

  new_fgMain(){
    this.fgMain = this.fb.group({
      nombre: '',
      codigoBarra: ''
    });

    this.fgMain.valueChanges.subscribe((value: any) => {
      const filter = { ...value, name: value.nombre.trim().toLowerCase() } as string;
      this.MainDS.filter = filter;

      if (this.MainDS.paginator) {
        this.MainDS.paginator.firstPage();
      }
    });
  }

  get getMain() { return this.fgMain.controls; }

  ngOnInit(): void {
    this.cargarPuntoVenta();
  }

  cargarPuntoVenta(){
    this.funcionesService.showLoading();
    this.puntosVentaService.cargarPuntosVenta().subscribe(response => {
      this.cboPuntoVenta = response.puntosVenta;
      this.funcionesService.hideLoading();
    });
  }

  viewDetail(element: any) {
    this.opcion = 2;
    this.productos = element;
    this.openModal('productos');
  }

  openModal(name: string) {

    const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
    const obj: any = new Object();

    switch (name) {
      case 'productos':
        obj['opcion'] = this.opcion;
        obj['productos'] = this.productos;
        obj['lista'] = this.lista;
        modalRef.componentInstance.fromParent = obj;
      break;
    }

    modalRef.result.then(async (result) => {

      switch (result.modal) {
        case 'productos':
          if (result.value === 'loadAgain') {

            this.cargarProductos(this.idPuntoVenta);
          }
          break;
      }

    }, (reason) => { });
  }

  eliminarRegistro(element: Productos){
    this.funcionesService.mensajeConfirmar('¿Desea eliminar este registro?', '', (result: any) => {
      if (result.isConfirmed) {
        this.funcionesService.showLoading();
        this.productosService.deleteProductos(element).subscribe(response => {
          if (response.status === 200) {
            this.funcionesService.showSuccess(response.message);
            this.cargarPuntoVenta();
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

  eventSeleccion(event: any){
    this.idPuntoVenta = event.id;
    this.puntoVenta = event.nombre;
    $("#codigoBarra").focus();
    this.cargarProductos(event.id);
  }

  cargarProductos(idPuntoVenta: number){
    this.funcionesService.showLoading();
    this.productosService.obtenerProductos(idPuntoVenta).subscribe(response => {
      if(response.status === 200){
       this.lista = response.productos;
       this.MainDS = new MatTableDataSource<Productos  >(response.productos);
       this.MainDS.paginator = this.pagMain;
       this.funcionesService.hideLoading();

       this.MainDS.filterPredicate = function(data: Productos, filter: string): boolean {
         return data.nombre.trim().toLowerCase().includes(filter);
       };

       this.MainDS.filterPredicate = ((data: Productos, filter: any ) => {
         const a = !filter.nombre || data.nombre.trim().toLowerCase().includes(filter.nombre.trim().toLowerCase());
         const b = !filter.codigoBarra || data.codigoBarra === filter.codigoBarra;
         return a && b;
       }) as (PeriodicElement: any, string: any) => boolean;
      }
     });
  }

  downloadExcel(){
    this.funcionesService.showLoading();

    const title = 'STOCK DE TIENDAS';
    const header = [ "PUNTO DE VENTA", "PRODUCTO", "CODIGO ANTIGUO", "CODIGO BARRA", "CATEGORIA", "UNIDAD MEDIDA", "STOCK MINIMO", "STOCK MAXIMO", "STOCK ACTUAL", "STOCK ALERTA", "PRECIO", "PRECIO MINIMO", "PRECIO MAXIMO", "PRECIO MAYOR", "OBSERVACIONES", "ESTADO"];
    const data = this.MainDS.filteredData;
    let lista: any[] = [];

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('Productos');

    // Add new row
    let titleRow = worksheet.addRow([title]);
    // Set font, size and style in title row.
    titleRow.font = { name: 'Arial', family: 4, size: 16, bold: true };

    worksheet.mergeCells(`A1:P1`);
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
    worksheet.getColumn(13).width = 30;
    worksheet.getColumn(14).width = 30;
    worksheet.getColumn(15).width = 30;
    worksheet.getColumn(16).width = 30;

    data.forEach((element: any) => {
      lista.push(
        element.idPuntoVenta == null ? '': this.puntoVenta,
        element.nombre == null ? '': element.nombre,
        element.codigoAntiguo == null ? '': element.codigoAntiguo,
        element.codigoBarra == null ? '': element.codigoBarra,
        element.idCategoria == null ? '': element.categorias.nombre,
        element.idUm == null ? '': element.um.nombre,
        element.stockMinimo == null ? '': element.stockMinimo,
        element.stockMaximo == null ? '': element.stockMaximo,
        element.stockActual == null ? '': element.stockActual,
        element.stockAlerta == null ? '': element.stockAlerta,
        element.precio == null ? '': element.precio,
        element.precioMinimo == null ? '': element.precioMinimo,
        element.precioMaximo == null ? '': element.precioMaximo,
        element.precioMayor == null ? '': element.precioMayor,
        element.observaciones == null ? '': element.observaciones,
        element.status == true ? 'ACTIVO' : 'INACTIVO'
      );
      worksheet.addRow(lista);
      lista = [];
    });

    worksheet.addRow([]);

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'Stock de tiendas.xlsx');
    });

    this.funcionesService.hideLoading();
  }
}
