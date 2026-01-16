import { Component, OnInit, Type, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Categorias } from 'src/app/modulos/almacen/categorias/model/categorias';
import { CategoriasService } from 'src/app/modulos/almacen/categorias/service/categorias.service';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

import { ModalActualizacionInventariosComponent } from '../modalActualizacionInventarios/modalActualizacionInventarios.component';
import { ActualizacionInventarios } from '../models/inventarios';
import { ActualizacionInventariosService } from '../service/actualizacion-inventarios.service';

// Modals
const MODALS: { [name: string]: Type<any> } = {
  inventarios: ModalActualizacionInventariosComponent
};

@Component({
  selector: 'app-actualizacion-inventarios',
  templateUrl: './actualizacion-inventarios.component.html',
  providers: [ ActualizacionInventariosService, CategoriasService ]
})
export class ActualizacionInventariosComponent implements OnInit {

  // FormGroup
  fgMain: FormGroup | any;

  inventarios: ActualizacionInventarios = new ActualizacionInventarios(0, '', '', '', '', '', '', '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  opcion: number = 0;
  paginaActual: number = 1;

  // Progress Bar
  progressBar: boolean = false;

  //Combos
  cboCategorias: Categorias[] = [];

  // PRINCIPAL
  MainDC: string[] = ['index', 'fecha', 'categoria', 'acciones'];
  MainDS: MatTableDataSource<ActualizacionInventarios> = new MatTableDataSource<ActualizacionInventarios>();
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
    public inventariosService: ActualizacionInventariosService,
    public categoriasService: CategoriasService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    private _modalService: NgbModal
  ) {
    this.new_fgMain();
  }

  new_fgMain(){
    this.fgMain = this.fb.group({
      idPuntoVenta: '',
      fechaIni: '',
      fechaFin: '',
      puntoVenta:'',
      idCategoria: '',
      categoria: '',
      categorias: ''
    });
  }

  get getMain() { return this.fgMain.controls; }

  ngOnInit() {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.fgMain.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.fgMain.get('puntoVenta').setValue(this.puntoVentas.nombre);
    this.fgMain.get('fechaIni').setValue(this.funcionesService.generarFechaLocal(new Date));
    this.fgMain.get('fechaFin').setValue(this.funcionesService.generarFechaLocal(new Date));

    this.cargarCategorias();
    this.buscar();
  }

  cargarCategorias(){
    this.categoriasService.obtenerCategorias(this.puntoVentas.id).subscribe(response => {
      if(response.status === 200){
        this.cboCategorias = response.categorias;
      }
    });
  }

  selectEvent(event: any){
    this.fgMain.get('idCategoria').setValue(event.id);
    this.fgMain.get('categoria').setValue(event.nombre);
  }

  openModal(name: string) {

    const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
    const obj: any = new Object();

    switch (name) {
      case 'inventarios':
        obj['opcion'] = this.opcion;
        obj['inventarios'] = this.inventarios;
        modalRef.componentInstance.fromParent = obj;
      break;
    }

    modalRef.result.then((result) => {

      switch (result.modal) {
        case 'inventarios':
          if (result.value === 'loadAgain') {
            this.buscar();
          }
          break;
      }
    }, (reason) => { });
  }

  limpiar(){
    this.fgMain = this.fb.group({
      idPuntoVenta: '',
      fechaIni: this.funcionesService.generarFechaLocal(new Date),
      fechaFin: this.funcionesService.generarFechaLocal(new Date),
      puntoVenta:'',
      idCategoria: '',
      categoria: '',
      categorias: ''
    });

    this. buscar();
  }

  crudRegistros(): any{

    if(this.fgMain.get('idCategoria').value === ''){
      this.funcionesService.showWarning('Seleccione la categoria');
      return false;
    }
    if(this.fgMain.get('fechaIni').value === ''){
      this.funcionesService.showWarning('Ingrese la fecha de inicio');
      return false;
    }
    if(this.fgMain.get('fechaFin').value === ''){
      this.funcionesService.showWarning('Ingrese la fecha final');
      return false;
    }
    if(new Date(this.fgMain.get('fechaIni').value).getTime() > new Date(this.fgMain.get('fechaFin').value).getTime()){
      this.funcionesService.showWarning('La fecha de inicio no puede ser mayor que la fecha final');
      return false;
    }

    this.inventarios.idPuntoVenta = this.fgMain.get('idPuntoVenta').value;
    this.inventarios.puntoVenta = this.fgMain.get('puntoVenta').value;
    this.inventarios.fechaInicio = this.fgMain.get('fechaIni').value;
    this.inventarios.fechaFin = this.fgMain.get('fechaFin').value;
    this.inventarios.idCategoria = this.fgMain.get('idCategoria').value;
    this.inventarios.categoria = this.fgMain.get('categoria').value;

    this.opcion = 1;
    this.openModal('inventarios');
  }

  viewDetail(element: any) {
    this.opcion = 2;
    this.inventarios = element;
    this.openModal('inventarios');
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

    this.funcionesService.showLoading();
    this.inventariosService.buscarPorFecha(this.fgMain.get('fechaIni').value, this.fgMain.get('fechaFin').value, this.puntoVentas.id).subscribe(response => {
      if(response.status === 200){
        this.funcionesService.hideLoading();
        this.MainDS = new MatTableDataSource<ActualizacionInventarios>(response.inventarios);
        this.MainDS.paginator = this.pagMain;
      }
    });
  }

  eliminarRegistro(element: ActualizacionInventarios){
    this.funcionesService.mensajeConfirmar('¿Desea eliminar este registro?', '', (result: any) => {
      if (result.isConfirmed) {
        this.funcionesService.showLoading();
        this.inventariosService.deleteActualizacionInventarios(element).subscribe(response => {
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
}
