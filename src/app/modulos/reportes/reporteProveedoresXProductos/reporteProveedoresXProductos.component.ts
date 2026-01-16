import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import * as moment from 'moment';
import { Productos } from 'src/app/modulos/almacen/productos/model/productos';
import { ProductosService } from 'src/app/modulos/almacen/productos/service/Productos.service';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

import { ReporteProveedoresProductos } from '../model/reportProveedoresProducto';
import { ReportesService } from '../service/reportes.service';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');

@Component({
  selector: 'app-reporteProveedoresXProductos',
  templateUrl: './reporteProveedoresXProductos.component.html',
  providers: [ReportesService, ProductosService],
})
export class ReporteProveedoresXProductosComponent implements OnInit {
  // FormGroup
  formGroup: FormGroup | any;

  reporteInventario: ReporteProveedoresProductos =
    new ReporteProveedoresProductos('', '', '', '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  progressBar: boolean = false;

  // PRINCIPAL
  MainDC: string[] = ['index', 'producto', 'proveedor', 'precio'];
  MainDS: MatTableDataSource<ReporteProveedoresProductos> =
    new MatTableDataSource<ReporteProveedoresProductos>();
  @ViewChild('pagMain', { static: true }) pagMain: MatPaginator | any;

  //COMBOS
  cboProductos: Productos[] = [];

  constructor(
    public service: ReportesService,
    public funcionesService: FuncionesService,
    private productosService: ProductosService,
    private fb: FormBuilder
  ) {
    this.new_fgMain();
  }

  new_fgMain() {
    this.formGroup = this.fb.group({
      idProducto: '',
      productos: '',
    });

    this.formGroup.valueChanges.subscribe((value: any) => {
      if (value.idProducto === null) {
        value.idProducto = '';
      }
      const filter = {
        ...value,
        name: value.idProducto.trim().toLowerCase(),
      } as string;
      this.MainDS.filter = filter;

      if (this.MainDS.paginator) {
        this.MainDS.paginator.firstPage();
      }
    });
  }

  get getMain() {
    return this.formGroup.controls;
  }

  ngOnInit() {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.cargarProductos();
    this.loadMain();
  }

  selectEventProductos(event: any) {
    this.formGroup.get('productos').setValue(event);
    this.formGroup.get('idProducto').setValue(event.id);
  }

  loadMain() {
    this.funcionesService.showLoading();
    this.service.proveedoresProductos(this.puntoVentas.id).subscribe(
      (response) => {
        this.MainDS = new MatTableDataSource<ReporteProveedoresProductos>(
          response.productosProveedor
        );
        this.MainDS.paginator = this.pagMain;
        this.funcionesService.hideLoading();

        this.MainDS.filterPredicate = function (
          data: ReporteProveedoresProductos,
          filter: string
        ): boolean {
          return data.idProducto.includes(filter);
        };

        this.MainDS.filterPredicate = ((
          data: ReporteProveedoresProductos,
          filter: any
        ) => {
          const a =
            !filter.productos ||
            parseInt(data.idProducto) === filter.productos.id;
          return a;
        }) as (PeriodicElement: any, string: any) => boolean;
      },
      (error) => {
        console.log(error);
      }
    );
  }

  cargarProductos() {
    this.productosService
      .cargarProductosVentas(this.puntoVentas.id)
      .subscribe((response) => {
        this.cboProductos = response.productos;
      });
  }

    generateData() {
    var result: any[] = [];
    var data = this.MainDS.filteredData;

    data.forEach((element: any) => {

      result.push([
        element.puntoVenta,
        element.nombre == null ? '': element.nombre,
        element.razonsocial == null ? '': element.razonsocial,
        element.precioCompra == null ? '': parseFloat(element.precioCompra).toFixed(2),
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
    doc.text("Proveedores por Producto", 150, 20, {align: "center"});

    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
      margin: {top: 60},
      head: [[
        'Punto de Venta',
        'Producto',
        'Proveedor',
        'Precio Ultima Compra'
      ]],
      body: this.generateData()
    });
    doc.save('Reporte_Proveedor_Productos.pdf');

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

    downloadExcel(){
      this.funcionesService.showLoading();
      this.progressBar = true;

      const title = 'Proveedores por Producto';
      const header = [
        'Punto de Venta',
        'Producto',
        'Proveedor',
        'Precio Ultima Compra'
      ];
      const data = this.MainDS.filteredData;
      let lista: any[] = [];

      let workbook = new Workbook();
      let worksheet = workbook.addWorksheet('Comision');

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

      worksheet.getColumn(1).width = 30;
      worksheet.getColumn(2).width = 30;
      worksheet.getColumn(3).width = 30;
      worksheet.getColumn(4).width = 20;

      data.forEach((element: any) => {
        lista.push(
          element.puntoVenta,
          element.nombre == null ? '': element.nombre,
          element.razonsocial == null ? '': element.razonsocial,
          element.precioCompra == null ? '': parseFloat(element.precioCompra).toFixed(2),
        );
        worksheet.addRow(lista);
        lista = [];
      });

      worksheet.addRow([]);

      workbook.xlsx.writeBuffer().then((data: any) => {
        const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        fs.saveAs(blob, 'Reporte_Proveedor_Productos.xlsx');
      });

      this.funcionesService.hideLoading();
      this.progressBar = false;
    }
}
