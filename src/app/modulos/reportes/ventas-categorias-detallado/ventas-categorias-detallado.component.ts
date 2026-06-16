import { Component, OnInit, ViewChild } from '@angular/core';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');
import { saveAs } from 'file-saver';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { ReportesService } from '../service/reportes.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { PuntosventaService } from '../../mantenimientos/puntosventa/service/puntosventa.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

@Component({
  selector: 'app-ventas-categorias-detallado',
  templateUrl: './ventas-categorias-detallado.component.html',
  styleUrls: ['./ventas-categorias-detallado.component.css'],
  providers: [ReportesService, PuntosventaService]
})
export class ReporteVentasCategoriasDetalladoComponent implements OnInit {

  // FormGroup
  fgMain: FormGroup | any;

  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  cboPuntoVenta: PuntosVenta[] = [];

  // Progress
  progressBar: boolean = false;

  // Table
  MainDC: string[] = ['puntoventa', 'fecha', 'categoria', 'codigoBarra', 'producto', 'precio', 'cantidad', 'total'];
  MainDS: MatTableDataSource<any> = new MatTableDataSource<any>();
  @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;
  currentPage: number = 1;
  perPage: number = 10;
  totalRows: number = 0;
  lastPage: number = 0;

  constructor(
    private fb: FormBuilder,
    private reportesService: ReportesService,
    private puntosventaService: PuntosventaService,
    public funcionesService: FuncionesService
  ){
    this.new_fgMain();
  }

  new_fgMain(){
    this.fgMain = this.fb.group({
      idPuntoVenta: '',
      puntoventa: '',
      fechaIni: '',
      fechaFin: ''
    });
  }

  get getMain() { return this.fgMain.controls; }

  ngOnInit(): void {
    try{
      this.puntoVentas = this.puntoVentaStorage ? JSON.parse(this.puntoVentaStorage) : new PuntosVenta();
    }catch(e){
      console.error('Error parsing puntosVenta from localStorage', e);
      this.puntoVentas = new PuntosVenta();
    }

    // If current user is JOVITA GENERAL (id 10), allow selecting punto de venta
    if(parseInt(this.puntoVentas?.id || '0') === 10){
      this.cargarPuntoVenta();
      this.fgMain.get('idPuntoVenta').setValue(10);
    }else{
      this.fgMain.get('idPuntoVenta').setValue(this.puntoVentas?.id || 0);
      this.fgMain.get('puntoventa').setValue(this.puntoVentas?.nombre || '');
    }

    // Note: per requirement, DO NOT perform search on init. Only on Buscar click.
  }

  cargarPuntoVenta(){
    this.puntosventaService.cargarPuntosVenta().subscribe((response: any) => {
      const puntos = response?.puntosVenta || response?.data || response || [];
      this.cboPuntoVenta = Array.isArray(puntos) ? puntos.filter((x: any) => parseInt(x.status) === 1) : [];
    }, error => {
      console.error('Error cargando puntos de venta', error);
      this.cboPuntoVenta = [];
    });
  }

  limpiar(){
    this.new_fgMain();
    if(parseInt(this.puntoVentas.id) !== 10){
      this.fgMain.get('idPuntoVenta').setValue(this.puntoVentas.id);
      this.fgMain.get('puntoventa').setValue(this.puntoVentas.nombre);
    }
    this.MainDS = new MatTableDataSource<any>([]);
  }

  buscar(resetPage: boolean = true): any{
    if(new Date(this.fgMain.get('fechaIni').value).getTime() > new Date(this.fgMain.get('fechaFin').value).getTime()){
      this.funcionesService.showError('La fecha de inicio no puede ser mayor que la fecha final');
      return false;
    }

    if(resetPage){
      this.currentPage = 1;
    }

    this.funcionesService.showLoading();
    this.progressBar = true;

    const idPunto = parseInt(this.fgMain.get('idPuntoVenta').value || 0);

    this.reportesService.ventasCategoriaDetallado(
      this.fgMain.get('fechaIni').value,
      this.fgMain.get('fechaFin').value,
      idPunto,
      this.currentPage,
      this.perPage
    ).subscribe((response: any) => {
      if(response.status === 200){
        this.funcionesService.hideLoading();
        const data = response.ventasCategoriaDetallado || response.ventas || response.reportes || response.data || [];
        const pagination = response.pagination || {};

        this.currentPage = parseInt(pagination.page, 10) || this.currentPage;
        this.perPage = parseInt(pagination.perPage, 10) || this.perPage;
        this.totalRows = parseInt(pagination.total, 10) || data.length || 0;
        this.lastPage = parseInt(pagination.lastPage, 10) || 0;

        this.MainDS = new MatTableDataSource<any>(data);
      }
      this.progressBar = false;
    }, error => {
      this.funcionesService.hideLoading();
      this.progressBar = false;
      console.log(error);
    });
  }

  onPageChange(event: any): void {
    this.currentPage = (event.pageIndex || 0) + 1;
    this.perPage = event.pageSize || this.perPage;
    this.buscar(false);
  }

  generateData() {
    var result: any[] = [];
    var data = this.MainDS.filteredData;

    data.forEach((element: any) => {
      result.push([
        element.PUNTOVENTA == null ? '': element.PUNTOVENTA,
        element.FECHA == null ? '': element.FECHA,
        element.CATEGORIA == null ? '': element.CATEGORIA,
        element.CODIGOBARRA == null ? '': element.CODIGOBARRA,
        element.PRODUCTO == null ? '': element.PRODUCTO,
        element.PRECIO == null ? '': parseFloat(element.PRECIO).toFixed(2),
        element.CANTIDADVENDIDA == null ? '': parseFloat(element.CANTIDADVENDIDA).toFixed(2),
        element.TOTAL == null ? '': parseFloat(element.TOTAL).toFixed(2)
      ]);
    });

    return result;
  }

  downloadPDF(){
    this.funcionesService.showLoading();
    this.progressBar = true;

    var doc = new jsPDF.default('landscape');
    doc.setFontSize(16);
    doc.text('Ventas por Categorías Detallado', 140, 20, {align: 'center'});
    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
      margin: {top: 30},
      head: [[ "PUNTO VENTA", "FECHA", "CATEGORIA", "CODIGO", "PRODUCTO", "PRECIO", "CANTIDAD", "TOTAL" ]],
      body: this.generateData()
    });
    doc.save('Ventas_Categorias_Detallado.pdf');

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  downloadExcel(){
    this.funcionesService.showLoading();
    this.progressBar = true;

    const title = 'Ventas por Categorías Detallado';
    const header = ["PUNTO VENTA", "FECHA", "CATEGORIA", "CODIGO", "PRODUCTO", "PRECIO", "CANTIDAD", "TOTAL"];
    const data = this.MainDS.filteredData;
    let lista: any[] = [];

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('VentasCategorias');

    let titleRow = worksheet.addRow([title]);
    titleRow.font = { name: 'Arial', family: 4, size: 14, bold: true };

    worksheet.mergeCells(`A1:H1`);
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.addRow([]);

    const headerRow = worksheet.addRow(header);

    headerRow.eachCell((cell, number) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '828380' }
      };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    worksheet.columns = [{width:30},{width:15},{width:30},{width:20},{width:60},{width:15},{width:15},{width:15}];

    data.forEach((element: any) => {
      lista.push(
        element.PUNTOVENTA == null ? '': element.PUNTOVENTA,
        element.FECHA == null ? '': element.FECHA,
        element.CATEGORIA == null ? '': element.CATEGORIA,
        element.CODIGOBARRA == null ? '': element.CODIGOBARRA,
        element.PRODUCTO == null ? '': element.PRODUCTO,
        element.PRECIO == null ? '': parseFloat(element.PRECIO).toFixed(2),
        element.CANTIDADVENDIDA == null ? '': parseFloat(element.CANTIDADVENDIDA).toFixed(2),
        element.TOTAL == null ? '': parseFloat(element.TOTAL).toFixed(2)
      );
      worksheet.addRow(lista);
      lista = [];
    });

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'Ventas_Categorias_Detallado.xlsx');
    });

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

}
