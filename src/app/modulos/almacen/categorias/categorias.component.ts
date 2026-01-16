import { Component, OnInit, ViewChild, Type } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

import { NgbModalOptions, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

import { Productos } from '../productos/model/productos';
import { ModalCategoriasComponent } from './modalCategorias/modalCategorias.component';
import { ModalProductosCategorias } from './modalProductosCategorias/modalProductosCategorias.component';
import { Categorias } from './model/categorias';
import { CategoriasService } from './service/categorias.service';
import { environment } from 'src/environments/environment.prod';
import { ModalImagenCategoriaComponent } from './modalImagenCategoria/modalImagenCategoria.component';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');

// Modals
const MODALS: { [name: string]: Type<any> } = {
  categorias: ModalCategoriasComponent,
  productos: ModalProductosCategorias,
  imagen: ModalImagenCategoriaComponent
};

@Component({
  selector: 'app-categorias',
  templateUrl: './categorias.component.html',
  providers: [CategoriasService],
})
export class CategoriasComponent implements OnInit {
  // FormGroup
  fgMain: FormGroup | any;

  categorias: Categorias = new Categorias(0, '', 1);
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  productos: Productos = new Productos();
  opcion: number = 0;

  // Progress Bar
  progressBar: boolean = false;

  // PRINCIPAL
  MainDC: string[] = ['nombre', 'productos', 'imagen', 'status', 'acciones'];
  MainDS: MatTableDataSource<Categorias> = new MatTableDataSource<Categorias>();
  @ViewChild('pagMain', { static: true }) pagMain: MatPaginator | any;

  NgbModalOptions: NgbModalOptions = {
    size: 'xl',
    centered: true,
    scrollable: true,
    keyboard: false,
    backdrop: 'static',
    windowClass: 'modal-holder',
  };

  lista: Categorias[] = [];

  constructor(
    public CategoriasService: CategoriasService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    private _modalService: NgbModal
  ) {
    this.new_fgMain();
  }

  new_fgMain() {
    this.fgMain = this.fb.group({
      idPuntoVenta: '',
      nombre: '',
      fechaIni: '',
      fechaFin: '',
      puntoventa: '',
    });

    this.fgMain.valueChanges.subscribe((value: any) => {
      const filter = {
        ...value,
        name: value.nombre.trim().toLowerCase(),
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
    this.progressBar = true;
    this.funcionesService.showLoading();
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.fgMain.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.fgMain.get('puntoventa').setValue(this.puntoVentas.nombre);
    this.loadMain();
    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  openImagenModal(categoria: Categorias) {
      const modalRef = this._modalService.open(MODALS['imagen'], { size: 'md', centered: true });
      modalRef.componentInstance.categoriaId = categoria.id;
      modalRef.componentInstance.imagenUrl = categoria.imagen ? `${environment.BASE_URL_UPLOAD}${categoria.imagen}` : '';
      modalRef.result.then(async (result: any) => {
        if (result.modal === 'imagen' && (result.value === 'uploaded' || result.value === 'deleted')) {
          await this.loadMain();
        }
      }, () => {});
  }

  openModal(name: string) {
    const modalRef = this._modalService.open(
      MODALS[name],
      this.NgbModalOptions
    );
    const obj: any = new Object();

    switch (name) {
      case 'categorias':
        obj['opcion'] = this.opcion;
        obj['categorias'] = this.categorias;
        obj['lista'] = this.lista;
        modalRef.componentInstance.fromParent = obj;
        break;
      case 'productos':
          obj['productos'] = this.productos;
          modalRef.componentInstance.fromParent = obj;
          break;
    }

    modalRef.result.then(
      async (result) => {
        switch (result.modal) {
          case 'categorias':
            if (result.value === 'loadAgain') {
              this.funcionesService.showLoading();
              this.progressBar = true;
              await this.loadMain();
              this.funcionesService.hideLoading();
              this.progressBar = false;
            }
            break;
        }
      },
      (reason) => {}
    );
  }

  limpiar() {
    this.fgMain = this.fb.group({
      idPuntoVenta: '',
      nombre: '',
      fechaIni: '',
      fechaFin: '',
      puntoventa: '',
    });

    this.loadMain();
  }

  crudRegistros() {
    this.opcion = 1;
    this.openModal('categorias');
  }

  viewDetail(element: any) {
    this.opcion = 2;
    this.categorias = element;
    this.openModal('categorias');
  }

  verProductos(element: Productos){
    this.productos = element;
    this.openModal('productos');
  }

  loadMain() {
    this.CategoriasService.obtenerCategorias(this.puntoVentas.id).subscribe(
      (response) => {
        this.lista = response.categorias;
        this.MainDS = new MatTableDataSource<Categorias>(response.categorias);
        this.MainDS.paginator = this.pagMain;

        this.MainDS.filterPredicate = function (
          data: Categorias,
          filter: string
        ): boolean {
          return data.nombre.trim().toLowerCase().includes(filter);
        };

        this.MainDS.filterPredicate = ((data: Categorias, filter: any) => {
          const a =
            !filter.nombre ||
            data.nombre
              .trim()
              .toLowerCase()
              .includes(filter.nombre.trim().toLowerCase());
          const b =
            !filter.idPuntoVenta ||
            parseInt(data.idPuntoVenta) === parseInt(filter.idPuntoVenta);
          const c =
            !filter.fechaIni ||
            (new Date(this.funcionesService.formatearFecha4(data.created_at)) >
              new Date(filter.fechaIni) &&
              new Date(this.funcionesService.formatearFecha4(data.created_at)) <
                new Date(filter.fechaFin));
          return a && b && c;
        }) as (PeriodicElement: any, string: any) => boolean;
      },
      (error) => {
        console.log(error);
      }
    );
  }

  eliminarRegistro(element: Categorias) {
    this.funcionesService.mensajeConfirmar(
      '¿Desea eliminar este registro?',
      '',
      (result: any) => {
        if (result.isConfirmed) {
          this.CategoriasService.deleteCategorias(element).subscribe(
            (response) => {
              this.funcionesService.showLoading();
              if (response.status === 200) {
                this.progressBar = true;
                this.funcionesService.showSuccess(response.message);
                this.loadMain();
                this.funcionesService.hideLoading();
                this.progressBar = false;
              } else {
                this.funcionesService.showError(response.message);
                this.funcionesService.hideLoading();
                this.progressBar = false;
                return;
              }
            },
            (err: any) => {
              console.log(err);
              this.funcionesService.hideLoading();
              this.progressBar = false;
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
        element.idPuntoVenta == null ? '' : this.puntoVentas.nombre,
        element.nombre == null ? '' : element.nombre,
        element.observaciones == null ? '' : element.observaciones,
        element.status == true ? 'ACTIVO' : 'INACTIVO',
      ]);
    });

    return result;
  }

  downloadPDF() {
    this.funcionesService.showLoading();
    this.progressBar = true;

    var doc = new jsPDF.default('landscape');
    doc.setFontSize(30);
    doc.setFont('arial', 'bold');
    doc.getLineHeight();
    doc.text('CATEGORIAS', 140, 30, { align: 'center' });
    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186] },
      margin: { top: 40 },
      head: [
        [
          'PUNTO DE VENTA',
          'CATEGORIAS',
          'ABREVIATURA',
          'OBSERVACIONES',
          'ESTADO',
        ],
      ],
      body: this.generateData(),
    });
    doc.save('Reporte Categorias.pdf');

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  downloadExcel() {
    this.funcionesService.showLoading();
    this.progressBar = true;

    const title = 'REPORTE CATEGORIAS';
    const header = [
      'PUNTO DE VENTA',
      'CATEGORIAS',
      'ABREVIATURA',
      'OBSERVACIONES',
      'ESTADO',
    ];
    const data = this.MainDS.filteredData;
    let lista: any[] = [];

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('Categorias');

    // Add new row
    let titleRow = worksheet.addRow([title]);
    // Set font, size and style in title row.
    titleRow.font = { name: 'Arial', family: 4, size: 16, bold: true };

    worksheet.mergeCells(`A1:E1`);
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

    worksheet.getColumn(1).width = 40;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 10;
    worksheet.getColumn(4).width = 40;
    worksheet.getColumn(5).width = 20;

    data.forEach((element: any) => {
      lista.push(
        element.idPuntoVenta == null ? '' : this.puntoVentas.nombre,
        element.nombre == null ? '' : element.nombre,
        element.observaciones == null ? '' : element.observaciones,
        element.status == true ? 'ACTIVO' : 'INACTIVO'
      );
      worksheet.addRow(lista);
      lista = [];
    });

    worksheet.addRow([]);

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      fs.saveAs(blob, 'Reporte Categorias.xlsx');
    });

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }
}
