import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { SuscriptoresService } from './service/suscriptores.service';
import { Suscriptor } from './model/suscriptor';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';

@Component({
  selector: 'app-suscriptores',
  templateUrl: './suscriptores.component.html',
  providers: [SuscriptoresService]
})
export class SuscriptoresComponent implements OnInit {

  // FormGroup para filtros
  fgFiltros: FormGroup | any;

  // PRINCIPAL
  MainDC: string[] = ['id', 'email', 'fecha'];
  MainDS: MatTableDataSource<Suscriptor> = new MatTableDataSource<Suscriptor>();
  @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

  constructor(
    private fb: FormBuilder,
    private suscriptoresService: SuscriptoresService,
    public funcionesService: FuncionesService
  ) {
    this.new_fgFiltros();
  }

  new_fgFiltros() {
    this.fgFiltros = this.fb.group({
      email: '',
      fechaIni: '',
      fechaFin: ''
    });

    this.fgFiltros.valueChanges.subscribe((value: any) => {
      this.MainDS.filter = JSON.stringify(value);
      if (this.MainDS.paginator) {
        this.MainDS.paginator.firstPage();
      }
    });
  }

  ngOnInit(): void {
    this.loadMain();
  }

  loadMain() {
    this.funcionesService.showLoading();
    this.suscriptoresService.obtenerSuscriptores().subscribe(response => {
      // Verificar si la respuesta es un array o un objeto con propiedad de array
      const suscriptores = Array.isArray(response) ? response : (response as any).suscriptores || (response as any).data || [];
      this.MainDS = new MatTableDataSource<Suscriptor>(suscriptores);
      this.MainDS.paginator = this.pagMain;
      
      // Configurar el filtro personalizado
      this.MainDS.filterPredicate = ((data: Suscriptor, filter: string) => {
        const filterObj = JSON.parse(filter);
        
        const matchEmail = !filterObj.email || 
          (data.email && data.email.toLowerCase().includes(filterObj.email.toLowerCase()));
        
        const matchFecha = !filterObj.fechaIni || !filterObj.fechaFin || 
          (data.created_at && 
           new Date(data.created_at) >= new Date(filterObj.fechaIni) && 
           new Date(data.created_at) <= new Date(filterObj.fechaFin));
        
        return matchEmail && matchFecha;
      }) as (data: any, filter: string) => boolean;

      this.funcionesService.hideLoading();
    }, error => {
      console.log(error);
      this.funcionesService.swalError('Error al cargar los suscriptores');
      this.funcionesService.hideLoading();
    });
  }

  limpiarFiltros() {
    this.fgFiltros.reset({
      email: '',
      fechaIni: '',
      fechaFin: ''
    });
  }

  downloadPDF() {
    this.funcionesService.showLoading();
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const col = ['ID', 'Email', 'Fecha de Suscripción'];
    const rows: any[] = [];

    const data = this.MainDS.filteredData.length > 0 ? this.MainDS.filteredData : this.MainDS.data;

    data.forEach((suscriptor: Suscriptor) => {
      const temp = [
        suscriptor.id,
        suscriptor.email,
        this.funcionesService.formatearFechaDDMMYYYY(suscriptor.created_at || '')
      ];
      rows.push(temp);
    });

    doc.text('Reporte de Suscriptores', 14, 15);
    doc.setFontSize(10);
    doc.text(`Fecha de generación: ${this.funcionesService.generarFechaLocal2(new Date())}`, 14, 22);
    doc.text(`Total de suscriptores: ${data.length}`, 14, 28);
    
    (doc as any).autoTable({
      head: [col],
      body: rows,
      startY: 32,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    doc.save(`suscriptores-${new Date().getTime()}.pdf`);
    this.funcionesService.hideLoading();
  }

  downloadExcel() {
    this.funcionesService.showLoading();

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Suscriptores');

    // Configurar columnas
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Email', key: 'email', width: 40 },
      { header: 'Fecha de Suscripción', key: 'fecha', width: 20 }
    ];

    // Estilos del encabezado
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF428BCA' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    const data = this.MainDS.filteredData.length > 0 ? this.MainDS.filteredData : this.MainDS.data;

    // Agregar datos
    data.forEach((suscriptor: Suscriptor) => {
      worksheet.addRow({
        id: suscriptor.id,
        email: suscriptor.email,
        fecha: this.funcionesService.formatearFechaDDMMYYYY(suscriptor.created_at || '')
      });
    });

    // Guardar archivo
    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, `suscriptores-${new Date().getTime()}.xlsx`);
      this.funcionesService.hideLoading();
    });
  }
}
