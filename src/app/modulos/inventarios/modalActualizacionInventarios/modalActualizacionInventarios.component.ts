import { Component, Input, OnInit, ViewChild } from '@angular/core';
declare var $: any;
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');
import { saveAs } from 'file-saver';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { InventariosDetalles } from '../models/inventariosDetalles';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { ActualizacionInventariosService } from '../service/actualizacion-inventarios.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Productos } from '../../almacen/productos/model/productos';
import { ActualizacionInventarios } from '../models/inventarios';

@Component({
  selector: 'app-modalActualizacionInventarios',
  templateUrl: './modalActualizacionInventarios.component.html',
  providers: [ActualizacionInventariosService],
})
export class ModalActualizacionInventariosComponent implements OnInit {
  // FormGroup
  fgMain: FormGroup | any;

  inventarios: ActualizacionInventarios = new ActualizacionInventarios(
    0,
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // PRINCIPAL
  MainDC: string[] = [
    'index',
    'categoria',
    'codigoBarra',
    'productos',
    'stockActual',
    'stockInventario',
    'diferenciaCantidad',
    'precio',
    'diferenciaPrecio',
  ];
  MainDS: MatTableDataSource<InventariosDetalles> =
    new MatTableDataSource<InventariosDetalles>();
  @ViewChild('pagMain', { static: true }) pagMain: MatPaginator | any;

  @Input() fromParent: any;

  constructor(
    public funcionesService: FuncionesService,
    private inventariosService: ActualizacionInventariosService,
    public activeModal: NgbActiveModal,
    private fb: FormBuilder
  ) {
    this.new_fgMain();
  }

  new_fgMain() {
    this.fgMain = this.fb.group({
      codigoBarra: '',
    });

    this.fgMain.valueChanges.subscribe((value: any) => {
      const filter = {
        ...value,
        name: value.codigoBarra.trim().toLowerCase(),
      } as string;
      this.MainDS.filter = filter;

      if (this.MainDS.paginator) {
        this.MainDS.paginator.firstPage();
      }
    });
  }

  get getMain() {
    return this.fgMain.controls;
  }

  ngOnInit() {
    this.funcionesService.showLoading();
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    let inventariosDetalles: InventariosDetalles[] = [];

    if (parseInt(this.fromParent.opcion) === 1) {
      this.inventariosService
        .buscarProductos(this.fromParent.inventarios)
        .subscribe(
          (response) => {
            this.funcionesService.hideLoading();
            let productos: Productos[] = [];
            productos = response.productos;

            productos.forEach((element) => {
              inventariosDetalles.push({
                id: 0,
                idInventario: 0,
                idCategoria: this.fromParent.inventarios.idCategoria,
                categoria: this.fromParent.inventarios.categoria,
                codigoBarra: element.codigoBarra,
                idProducto: element.id,
                productos: element.nombre,
                stockActual: element.stockActual,
                stockInventario: element.stockActual,
                diferenciaCantidad: 0,
                precio: element.precio,
                diferenciaPrecio: 0,
              });
            });

            inventariosDetalles.sort((a, b) => a.productos.localeCompare(b.productos));

            this.MainDS = new MatTableDataSource<InventariosDetalles>(
              inventariosDetalles
            );
            this.MainDS.paginator = this.pagMain;

            this.MainDS.filterPredicate = function (
              data: Productos,
              filter: string
            ): boolean {
              return data.codigoBarra.trim().toLowerCase().includes(filter);
            };

            this.MainDS.filterPredicate = ((data: Productos, filter: any) => {
              const a =
                !filter.codigoBarra ||
                data.codigoBarra
                  .trim()
                  .toLowerCase()
                  .includes(filter.codigoBarra.trim().toLowerCase());
              return a;
            }) as (PeriodicElement: any, string: any) => boolean;
          },
          (error) => {
            console.log(error);
            this.funcionesService.hideLoading();
          }
        );
    } else {
      this.inventariosService
        .obtenerActualizacionInventarios(this.fromParent.inventarios.id)
        .subscribe(
          (response) => {
            this.funcionesService.hideLoading();
            this.inventarios = response.inventarios;
            inventariosDetalles = this.inventarios.detalles;
            inventariosDetalles.sort((a, b) => a.productos.localeCompare(b.productos));

            this.MainDS = new MatTableDataSource<InventariosDetalles>(
              inventariosDetalles
            );
            this.MainDS.paginator = this.pagMain;

            this.MainDS.filterPredicate = function (
              data: Productos,
              filter: string
            ): boolean {
              return data.codigoBarra.trim().toLowerCase().includes(filter);
            };

            this.MainDS.filterPredicate = ((data: Productos, filter: any) => {
              const a =
                !filter.codigoBarra ||
                data.codigoBarra
                  .trim()
                  .toLowerCase()
                  .includes(filter.codigoBarra.trim().toLowerCase());
              return a;
            }) as (PeriodicElement: any, string: any) => boolean;
          },
          (error) => {
            console.log(error);
            this.funcionesService.hideLoading();
          }
        );
    }
  }

  calcularTotales(element: InventariosDetalles) {
    if (element.stockInventario !== '') {
      if (parseFloat(element.stockInventario) > 0) {
        element.diferenciaCantidad =
          parseFloat(element.stockInventario) - parseFloat(element.stockActual);
        element.diferenciaPrecio =
          parseFloat(element.diferenciaCantidad) * parseFloat(element.precio);
      } else {
        this.funcionesService.showWarning('El stock inventario no puede ser 0');
      }
    } else {
      this.funcionesService.showWarning('Ingrese una cantidad');
    }
  }

  configurarProducto(diferenciaPrecio: any): boolean {
    let retornar: boolean = false;
    if (parseFloat(diferenciaPrecio) < 0) {
      retornar = true;
    }

    return retornar;
  }

  saveInventarios(): any {
    this.funcionesService.mensajeConfirmar(
      '¿Desea registrar esta actualización de inventario?',
      '',
      (result: any) => {
        if (result.isConfirmed) {
          this.funcionesService.showLoading();
          this.inventarios = this.fromParent.inventarios;
          this.inventarios.detalles = this.MainDS.filteredData;
          this.inventariosService
            .crudActualizacionInventarios(this.inventarios)
            .subscribe(
              (response) => {
                if (response.status === 200) {
                  this.funcionesService.hideLoading();
                  this.funcionesService.showSuccess(response.message);
                  const oReturn: any = new Object();
                  oReturn['modal'] = 'inventarios';
                  oReturn['value'] = 'loadAgain';
                  this.activeModal.close(oReturn);
                } else {
                  this.funcionesService.hideLoading();
                  this.funcionesService.showWarning(response.message);
                }
              },
              (error) => {
                this.funcionesService.hideLoading();
                this.funcionesService.showError(error.error.message);
              }
            );
        }
      }
    );
  }

  generateData() {
    var result: any[] = [];
    var data = this.MainDS.filteredData;

    data.forEach((element: any) => {
      result.push([
        this.puntoVentas.nombre,
        element.categoria == null ? '' : element.categoria,
        element.codigoBarra == null ? '' : element.codigoBarra,
        element.productos == null ? '' : element.productos,
        element.stockActual == null
          ? ''
          : parseFloat(element.stockActual).toFixed(2),
        element.stockInventario == null
          ? ''
          : parseFloat(element.stockInventario).toFixed(2),
        element.diferenciaCantidad == null
          ? ''
          : parseFloat(element.diferenciaCantidad).toFixed(2),
        element.precio == null ? '' : parseFloat(element.precio).toFixed(2),
        element.diferenciaPrecio == null
          ? ''
          : parseFloat(element.diferenciaPrecio).toFixed(2),
      ]);
    });

    result.sort((a, b) => a.productos.localeCompare(b.productos));

    return result;
  }

  downloadPDF() {
    this.funcionesService.showLoading();

    var doc = new jsPDF.default('landscape');
    doc.setFontSize(30);
    doc.setFont('arial', 'bold');
    doc.getLineHeight();
    doc.text('REPORTE ACTUALIZACIÓN DE INVENTARIOS', 140, 30, {
      align: 'center',
    });
    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186] },
      margin: { top: 40 },
      head: [
        [
          'PUNTO DE VENTA',
          'CATEGORIA',
          'CODIGO BARRA',
          'PRODUCTO',
          'STOCK ACTUAL',
          'STOCK INVENTARIO',
          'DIFERENCIA CANTIDAD',
          'PRECIO PRODUCTO',
          'DIFERENCIA PRECIO',
        ],
      ],
      body: this.generateData(),
    });
    doc.save('Reporte_Actualizacion_Inventario.pdf');

    this.funcionesService.hideLoading();
  }

  downloadExcel() {
    this.funcionesService.showLoading();

    const title = 'REPORTE ACTUALIZACIÓN DE INVENTARIOS';
    const header = [
      'PUNTO DE VENTA',
      'CATEGORIA',
      'CODIGO BARRA',
      'PRODUCTO',
      'STOCK ACTUAL',
      'STOCK INVENTARIO',
      'DIFERENCIA CANTIDAD',
      'PRECIO PRODUCTO',
      'DIFERENCIA PRECIO',
    ];
    const data = this.MainDS.filteredData;
    let lista: any[] = [];

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('Actualizacion Inventario');

    // Add new row
    let titleRow = worksheet.addRow([title]);
    // Set font, size and style in title row.
    titleRow.font = { name: 'Arial', family: 4, size: 16, bold: true };

    worksheet.mergeCells(`A1:I1`);
    worksheet.getCell('A1').alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };

    // Blank Row
    worksheet.addRow([]);

    // Add Header Row
    const headerRow = worksheet.addRow(header);

    headerRow.eachCell((cell, number) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '828380' },
        bgColor: { argb: 'FF0000FF' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
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

    data.forEach((element: any) => {
      lista.push(
        this.puntoVentas.nombre,
        element.categoria == null ? '' : element.categoria,
        element.codigoBarra == null ? '' : element.codigoBarra,
        element.productos == null ? '' : element.productos,
        element.stockActual == null
          ? ''
          : parseFloat(element.stockActual).toFixed(2),
        element.stockInventario == null
          ? ''
          : parseFloat(element.stockInventario).toFixed(2),
        element.diferenciaCantidad == null
          ? ''
          : parseFloat(element.diferenciaCantidad).toFixed(2),
        element.precio == null ? '' : parseFloat(element.precio).toFixed(2),
        element.diferenciaPrecio == null
          ? ''
          : parseFloat(element.diferenciaPrecio).toFixed(2)
      );
      worksheet.addRow(lista);
      lista = [];
    });

    data.sort((a, b) => a.productos.localeCompare(b.productos));

    worksheet.addRow([]);

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      fs.saveAs(blob, 'Reporte_Actualizacion_Inventario.xlsx');
    });

    this.funcionesService.hideLoading();
  }
}
