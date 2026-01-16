import { Component, Type, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';

import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { User } from 'src/app/modulos/Seguridad/models/User';
import { UsuarioService } from 'src/app/modulos/Usuarios/service/usuario.service';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { Items } from 'src/app/shared/services/items/items';
import { ItemsService } from 'src/app/shared/services/items/items.service';

import { ModaldetallesComponent } from '../modaldetalles/modaldetalles.component';
import { DetallesPagos } from '../models/detallesPagos';
import { PagosRealizar } from '../models/pagosrealizar';
import { PagosdetallesService } from '../service/pagosdetalles.service';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');

// Modals
const MODALS: { [name: string]: Type<any> } = {
  detalles: ModaldetallesComponent,
};

@Component({
  selector: 'app-detallespagorealizar',
  templateUrl: './detallespagorealizar.component.html',
  providers: [PagosdetallesService, ItemsService, UsuarioService]
})
export class DetallespagorealizarComponent implements OnInit {

    // FormGroup
    fgMain: FormGroup | any;

    pagos: PagosRealizar = new PagosRealizar(0, '', '', '0', '0', '0', '0', '', '', '', 1, true, '');
    detalles: DetallesPagos = new DetallesPagos(0, 0, '', '', '', '', '', true, '', 1);
    opcion: number = 0;
    idPagoRealizar: number = 0;

    // Progress Bar
    progressBar: boolean = false;

    // PRINCIPAL
    MainDC: string[] = ['fechaVencimiento', 'usuario', 'modalidad', 'cantidad', 'monto', 'interes', 'total', 'status', 'acciones'];
    MainDS: MatTableDataSource<DetallesPagos> = new MatTableDataSource<DetallesPagos>();
    @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

    NgbModalOptions: NgbModalOptions = {
      size: 'xl',
      centered: true,
      scrollable: true,
      keyboard: false,
      backdrop: 'static',
      windowClass: 'modal-holder'
    };

    cboTipo: Items[] = [];
    cboVendedores: User[] = [];

    constructor(
      public pagosrealizarService: PagosdetallesService,
      public itemsService: ItemsService,
      private usuarioService: UsuarioService,
      public funcionesService: FuncionesService,
      private fb: FormBuilder,
      private _modalService: NgbModal,
      private activatedRoute: ActivatedRoute
    ) {
      this.new_fgMain();
    }

    new_fgMain(){
      this.fgMain = this.fb.group({
        fechaIni: '',
        fechaFin: '',
        idUsuario:[''],
        idModalidad: ['']
      }, { validators: this.fechaRangeValidator });

      this.fgMain.valueChanges.subscribe((value: any) => {
        const filter = { ...value } as any;
        this.MainDS.filter = JSON.stringify(filter);

        if (this.MainDS.paginator) {
          this.MainDS.paginator.firstPage();
        }
      });
    }

    // Validador personalizado para verificar que fechaFin no sea menor que fechaIni
    fechaRangeValidator(control: AbstractControl): ValidationErrors | null {
      const fechaIni = control.get('fechaIni')?.value;
      const fechaFin = control.get('fechaFin')?.value;

      if (fechaIni && fechaFin && new Date(fechaFin) < new Date(fechaIni)) {
        return { fechaRangeInvalid: true };
      }
      return null;
    }

    get getMain() { return this.fgMain.controls; }

    ngOnInit() {
      this.funcionesService.showLoading();
      this.progressBar = true;

      this.cargarVendedores();
      this.cargarTipo();

      this.activatedRoute.params.subscribe((parametros: any) => {
        this.idPagoRealizar = parametros.id;
        this.loadMain();
        this.funcionesService.hideLoading();
        this.progressBar = false;
      });
    }

  cargarVendedores(){
    this.usuarioService.listarUsuarios().subscribe(response => {
      this.cboVendedores = response.usuarios;
      this.cboVendedores = this.cboVendedores.filter(x => parseInt(x.status) === 1);
    });
  }

  cargarTipo(){
    this.itemsService.cargarItems('modalidad').subscribe(response => {
      this.cboTipo = response.items;
    });
  }

    openModal(name: string) {

      const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
      const obj: any = new Object();

      switch (name) {
        case 'detalles':
          obj['opcion'] = this.opcion;
          obj['detalles'] = this.detalles;
          obj['pagos'] = this.pagos;
          obj['lista'] = this.MainDS.filteredData;
          modalRef.componentInstance.fromParent = obj;
        break;
      }

      modalRef.result.then(async (result) => {
        switch (result.modal) {
          case 'detalles':
            if (result.value === 'loadAgain') {
              await this.loadMain();
            }
            break;
        }

      }, (reason) => { });
    }

    crudRegistros(){
      this.opcion = 1;
      this.openModal('detalles');
    }

    viewDetail(element: any) {
      this.opcion = 2;
      this.detalles = element;
      this.openModal('detalles');
    }

    loadMain() {

      this.pagosrealizarService.obtenerPagosRealizar(this.idPagoRealizar).subscribe(response => {

        this.pagos = response.pagosRealizar;
        this.MainDS = new MatTableDataSource<DetallesPagos>(response.pagosDetalles);
        this.MainDS.paginator = this.pagMain;
        this.funcionesService.hideLoading();

        this.MainDS.filterPredicate = ((data: DetallesPagos, filterStr: string) => {
          const filter = JSON.parse(filterStr);

          // Función helper para normalizar fechas del servidor/base de datos
          const normalizarFechaData = (fecha: any): string => {
            if (!fecha) return '';
            const fechaObj = new Date(fecha);
            if (isNaN(fechaObj.getTime())) return '';

            const year = fechaObj.getFullYear();
            const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
            const day = String(fechaObj.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          };

          // Función helper para normalizar fechas del formulario (evita problemas de zona horaria)
          const normalizarFechaFormulario = (fecha: any): string => {
            if (!fecha) return '';

            // Si ya es un string con formato YYYY-MM-DD, lo devolvemos tal como está
            if (typeof fecha === 'string' && fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
              return fecha;
            }

            // Si es un string de fecha, parseamos sin crear objeto Date para evitar zona horaria
            if (typeof fecha === 'string') {
              const partes = fecha.split('-');
              if (partes.length === 3) {
                const year = partes[0];
                const month = partes[1].padStart(2, '0');
                const day = partes[2].padStart(2, '0');
                return `${year}-${month}-${day}`;
              }
            }

            // Como último recurso, usar Date pero ajustar zona horaria
            const fechaObj = new Date(fecha);
            if (isNaN(fechaObj.getTime())) return '';

            // Sumar offset de zona horaria para obtener fecha local correcta
            const fechaLocal = new Date(fechaObj.getTime() + (fechaObj.getTimezoneOffset() * 60000));
            const year = fechaLocal.getFullYear();
            const month = String(fechaLocal.getMonth() + 1).padStart(2, '0');
            const day = String(fechaLocal.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          };

          // Filtrar por fechas
          let a = true;
          if (filter.fechaIni && filter.fechaFin) {
            const fechaVencimientoNorm = normalizarFechaData(data.fechaVencimiento);
            const fechaInicioNorm = normalizarFechaFormulario(filter.fechaIni);
            const fechaFinalNorm = normalizarFechaFormulario(filter.fechaFin);

            const cumple = fechaVencimientoNorm >= fechaInicioNorm && fechaVencimientoNorm <= fechaFinalNorm;

            // Debug - mostrar todos los registros evaluados
            console.log('Evaluando registro:', {
              fechaVencimiento: data.fechaVencimiento,
              fechaVencimientoNorm: fechaVencimientoNorm,
              fechaInicioNorm: fechaInicioNorm,
              fechaFinalNorm: fechaFinalNorm,
              cumple: cumple,
              mostrar: cumple ? 'SÍ' : 'NO'
            });

            a = cumple;
          } else if (filter.fechaIni) {
            const fechaVencimientoNorm = normalizarFechaData(data.fechaVencimiento);
            const fechaInicioNorm = normalizarFechaFormulario(filter.fechaIni);

            a = fechaVencimientoNorm >= fechaInicioNorm;
          } else if (filter.fechaFin) {
            const fechaVencimientoNorm = normalizarFechaData(data.fechaVencimiento);
            const fechaFinalNorm = normalizarFechaFormulario(filter.fechaFin);

            const cumple = fechaVencimientoNorm <= fechaFinalNorm;

            // Debug - mostrar todos los registros evaluados
            console.log('Evaluando registro (solo fecha fin):', {
              fechaVencimiento: data.fechaVencimiento,
              fechaVencimientoNorm: fechaVencimientoNorm,
              fechaFinalNorm: fechaFinalNorm,
              cumple: cumple,
              mostrar: cumple ? 'SÍ' : 'NO'
            });

            a = cumple;
          }
          // Filtrar por usuario (solo si el filtro no está vacío)
          const b = !filter.idUsuario || (data.idUsuario && data.idUsuario.toString() === filter.idUsuario);
          // Filtrar por modalidad (solo si el filtro no está vacío)
          const c = !filter.idModalidad || (data.idModalidad && data.idModalidad.toString() === filter.idModalidad);
          return a && b && c;
        }) as (data: DetallesPagos, filter: string) => boolean;

      }, error => {
        console.log(error);
        this.funcionesService.hideLoading();
        this.progressBar = false;
      });
    }

    limpiar(){
      this.fgMain.patchValue({
        fechaIni: '',
        fechaFin: '',
        idUsuario: '',
        idModalidad: ''
      });
    }

    eliminarRegistro(element: DetallesPagos){
      this.funcionesService.mensajeConfirmar('¿Desea eliminar este registro?', '', (result: any) => {
        if (result.isConfirmed) {
          this.pagosrealizarService.deletePagosRealizar(element).subscribe(response => {
            this.funcionesService.showLoading();
            this.progressBar = true;

            if (response.status === 200) {
              this.funcionesService.showSuccess(response.message);
              this.loadMain();
              this.funcionesService.hideLoading();
              this.progressBar = false;
            }
            else {
              this.funcionesService.showError(response.message);
              this.funcionesService.hideLoading();
              this.progressBar = false;
              return;
            }
          }, (err: any) => {
            console.log(err);
            this.funcionesService.hideLoading();
              this.progressBar = false;
          });
        }
      });
    }

    generateData() {
      var result: any[] = [];
      var data = this.MainDS.filteredData;

      data.forEach((element: any) => {

        result.push([
          element.idPagoRealizar == null ? '': element.pagos.nombre,
          element.fechaVencimiento == null ? '': element.fechaVencimiento,
          this.getUsuarioNombre(element.idUsuario),
          this.getModalidadDescripcion(element.idModalidad),
          element.cantidad == null ? '': element.cantidad,
          element.monto == null ? '': element.monto,
          element.interes == null ? '': element.interes,
          element.total == null ? '': element.total,
          element.status == true ? 'ACTIVO' : 'INACTIVO'
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
      doc.text("REPORTE PAGOS A REALIZAR DETALLES", 140, 30, {align: "center"});
      doc.autoTable({
        styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
        margin: {top: 40},
        head: [["PAGOS A REALIZAR", "FECHA DE VENCIMIENTO", "USUARIO", "MODALIDAD", "CANTIDAD", "MONTO", "INTERES", "TOTAL", "ESTADO"]],
        body: this.generateData()
      });
      doc.save('Reporte Pagos a Realizar Detalles.pdf');

      this.funcionesService.hideLoading();
      this.progressBar = false;
    }

    downloadExcel(){
      this.funcionesService.showLoading();
      this.progressBar = true;

      const title = 'REPORTE PAGOS A REALIZAR DETALLES';
      const header = ["PAGOS A REALIZAR", "FECHA DE VENCIMIENTO", "USUARIO", "MODALIDAD", "CANTIDAD", "MONTO", "INTERES", "TOTAL", "ESTADO"];
      const data = this.MainDS.filteredData;
      let lista: any[] = [];

      let workbook = new Workbook();
      let worksheet = workbook.addWorksheet('Pagos a Realizar');

      // Add new row
      let titleRow = worksheet.addRow([title]);
      // Set font, size and style in title row.
      titleRow.font = { name: 'Arial', family: 4, size: 16, bold: true };

      worksheet.mergeCells(`A1:I1`);
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

      worksheet.getColumn(1).width = 40;
      worksheet.getColumn(2).width = 40;
      worksheet.getColumn(3).width = 40;
      worksheet.getColumn(4).width = 40;
      worksheet.getColumn(5).width = 10;
      worksheet.getColumn(6).width = 10;
      worksheet.getColumn(7).width = 40;
      worksheet.getColumn(8).width = 40;
      worksheet.getColumn(9).width = 10;

      data.forEach((element: any) => {
        lista.push(
          element.idPagoRealizar == null ? '': element.pagos.nombre,
          element.fechaVencimiento == null ? '': element.fechaVencimiento,
          this.getUsuarioNombre(element.idUsuario),
          this.getModalidadDescripcion(element.idModalidad),
          element.cantidad == null ? '': element.cantidad,
          element.monto == null ? '': element.monto,
          element.interes == null ? '': element.interes,
          element.total == null ? '': element.total,
          element.status == true ? 'ACTIVO' : 'INACTIVO'
        );
        worksheet.addRow(lista);
        lista = [];
      });

      worksheet.addRow([]);

      workbook.xlsx.writeBuffer().then((data: any) => {
        const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        fs.saveAs(blob, 'Reporte Pagos a Realizar Detalles.xlsx');
      });

      this.funcionesService.hideLoading();
      this.progressBar = false;
    }

    // Devuelve el nombre del usuario según el id
    getUsuarioNombre(idUsuario: any): string {
      const usuario = this.cboVendedores.find(u => u.id == idUsuario);
      return usuario ? usuario.nombre : idUsuario;
    }

    // Devuelve la descripción de la modalidad según el id
    getModalidadDescripcion(idModalidad: any): string {
      const modalidad = this.cboTipo.find(m => m.id == idModalidad);
      return modalidad ? modalidad.titulo : idModalidad;
    }
}
