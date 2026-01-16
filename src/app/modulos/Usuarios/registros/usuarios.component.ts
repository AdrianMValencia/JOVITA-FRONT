import { Component, OnInit, ViewChild, Type } from '@angular/core';
import { ModalUsuariosComponent } from '../modalUsuarios/modalUsuarios.component';
import { UsuarioService } from '../service/usuario.service';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Usuarios } from '../models/Usurarios';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { NgbModalOptions, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FuncionesService } from '../../../shared/services/funciones.service';
import { Roles } from '../models/Roles';
declare const require: any;
const jsPDF = require('jspdf');
require('jspdf-autotable');
import { saveAs } from 'file-saver';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { AsignarusuariosComponent } from '../asignarusuarios/asignarusuarios.component';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';

// Modals
const MODALS: { [name: string]: Type<any> } = {
  usuarios: ModalUsuariosComponent,
  asignar: AsignarusuariosComponent
};

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  providers: [UsuarioService ]
})
export class UsuariosComponent implements OnInit {

    // FormGroup
    fgMain: FormGroup | any;

    usuarios: Usuarios = new Usuarios(0, '', '', '', '', '', '', '', '', '', '',  true);
    puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
    puntoVentas: PuntosVenta = new PuntosVenta();
    opcion: number = 0;

   // Progress Bar
    progressBar: boolean = false;

    //COMBOS
    cboRoles: Roles[] = [];
    lista: Usuarios[] = [];

    // PRINCIPAL
    MainDC: string[] = ['nombreRol', 'nombre', 'usuario', 'celular', 'asignar', 'imagen', 'status', 'acciones'];
    MainDS: MatTableDataSource<Usuarios> = new MatTableDataSource<Usuarios>();
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
    public usuariosService: UsuarioService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    private _modalService: NgbModal
  ) {
    this.new_fgMain();
  }

  new_fgMain(){
    this.fgMain = this.fb.group({
      idRol: '',
      nombre: '',
      usuario: '',
      roles: ''
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

  ngOnInit() {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.loadMain();
    this.cargarRoles();
  }

  openModal(name: string) {

    const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
    const obj: any = new Object();

    switch (name) {
      case 'usuarios':
        obj['opcion'] = this.opcion;
        obj['usuarios'] = this.usuarios;
        obj['lista'] = this.lista;
        modalRef.componentInstance.fromParent = obj;
      break;
      case 'asignar':
        obj['usuarios'] = this.usuarios;
        modalRef.componentInstance.fromParent = obj;
      break;
    }

    modalRef.result.then(async (result) => {

      switch (result.modal) {
        case 'usuarios':
          if (result.value === 'loadAgain') {

            this.funcionesService.showLoading();
            this.progressBar = true;
            await this.loadMain();
            this.funcionesService.hideLoading();
            this.progressBar = false;
          }
          break;
      }

    }, (reason) => { });
  }

  selectEventRol(event: Roles){
    this.fgMain.get('idRol').setValue(event.id);
  }

  crudRegistros(){
    this.opcion = 1;
    this.openModal('usuarios');
  }

  viewDetail(element: any) {
    this.opcion = 2;
    this.usuarios = element;
    this.openModal('usuarios');
  }

  asignarPuntoVenta(element: any) {
    this.usuarios = element;
    this.openModal('asignar');
  }

  loadMain() {
    this.funcionesService.showLoading();
    this.usuariosService.obtenerUsuarios(this.puntoVentas.id).subscribe(response => {

      response.usuarios.forEach((element: any) => {
        element.idRol = parseInt(element.idRol);
      });
      this.lista = response.usuarios;
      this.MainDS = new MatTableDataSource<Usuarios>(response.usuarios);
      this.MainDS.paginator = this.pagMain;

      this.MainDS.filterPredicate = function(data: Usuarios, filter: string): boolean {
        return data.nombre.trim().toLowerCase().includes(filter);
      };

      this.MainDS.filterPredicate = ((data: Usuarios, filter: any ) => {
        const a = !filter.idRol || data.idRol === filter.idRol;
        const b = !filter.nombre || data.nombre.trim().toLowerCase().includes(filter.nombre.trim().toLowerCase());
        const c = !filter.usuario || data.usuario.trim().toLowerCase().includes(filter.usuario.trim().toLowerCase());
        return a && b && c;
      }) as (PeriodicElement: any, string: any) => boolean;
      this.funcionesService.hideLoading();
    }, error => {
      console.log(error);
      this.funcionesService.hideLoading();
    });
  }

  cargarRoles(){
    this.usuariosService.cargarRoles().subscribe(response => {
      this.cboRoles = response.roles;
    });
  }

  cambiarRoles(idRol: number, id: number){
    this.funcionesService.showLoading();
    this.progressBar = true;

    let usuarios: Usuarios = new Usuarios();
    usuarios.id = id;
    usuarios.idRol = idRol;
    this.usuariosService.cambiarRoles(usuarios).subscribe(response => {

      this.funcionesService.showSuccess(response.message);
      this.loadMain();
      this.funcionesService.hideLoading();
      this.progressBar = false;
    }, error => {
      this.funcionesService.hideLoading();
      this.progressBar = false;
    });
  }

  eliminarRegistro(element: Usuarios){
    this.funcionesService.mensajeConfirmar('¿Desea eliminar este registro?', '', (result: any) => {
      if (result.isConfirmed) {
        // this.usuariosService.deleteUsuarios(element).subscribe(response => {
          this.funcionesService.showLoading();
        this.usuariosService.cambiarEstado(element.id).subscribe((response: any) => {
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
        element.idRol == null ? '': element.roles.nombreRol,
        element.nombre == null ? '': element.nombre,
        element.usuario == null ? '': element.usuario,
        element.email == null ? '': element.email,
        element.direccion == null ? '': element.direccion,
        element.telefono == null ? '': element.telefono,
        element.celular == null ? '': element.celular,
        element.ciudad == null ? '': element.ciudad,
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
    doc.text("REPORTE USUARIOS", 140, 30, {align: "center"});
    doc.autoTable({
      styles: { lineWidth: 0.2, lineColor: [41, 128, 186]},
      margin: {top: 40},
      head: [[ "ROL", "NOMBRE", "USUARIO", "CORREO", "DIRECCION", "TELEFONO", "CELULAR", "CIUDAD", "ESTADO"]],
      body: this.generateData()
    });
    doc.save('Reporte Usuarios.pdf');

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  downloadExcel(){
    this.funcionesService.showLoading();
    this.progressBar = true;

    const title = 'REPORTE USUARIOS';
    const header = [ "ROL", "NOMBRE", "USUARIO", "CORREO", "DIRECCION", "TELEFONO", "CELULAR", "CIUDAD", "ESTADO"];
    const data = this.MainDS.filteredData;
    let lista: any[] = [];

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('Usuarios');

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

    worksheet.getColumn(1).width = 30;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 30;
    worksheet.getColumn(4).width = 30;
    worksheet.getColumn(5).width = 20;
    worksheet.getColumn(6).width = 20;
    worksheet.getColumn(7).width = 20;
    worksheet.getColumn(8).width = 30;
    worksheet.getColumn(8).width = 30;

    data.forEach((element: any) => {
      lista.push(
        element.idRol == null ? '': element.roles.nombreRol,
        element.nombre == null ? '': element.nombre,
        element.usuario == null ? '': element.usuario,
        element.email == null ? '': element.email,
        element.direccion == null ? '': element.direccion,
        element.telefono == null ? '': element.telefono,
        element.celular == null ? '': element.celular,
        element.ciudad == null ? '': element.ciudad,
        element.status == true ? 'ACTIVO' : 'INACTIVO'
      );
      worksheet.addRow(lista);
      lista = [];
    });

    worksheet.addRow([]);

    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'Reporte Usuarios.xlsx');
    });

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }
}
