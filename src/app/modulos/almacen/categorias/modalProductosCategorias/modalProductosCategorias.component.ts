import { Component, Input, OnInit, Type, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

import { NgbActiveModal, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

import { ModalProductosComponent } from '../../productos/modalProductos/modalProductos.component';
import { Productos } from '../../productos/model/productos';
import { ProductosService } from '../../productos/service/Productos.service';
import { UnidadMedidas } from '../../unidadmedidas/models/unidadmedidas';
import { Categorias } from '../model/categorias';
declare var $: any;

// Modals
const MODALS: { [name: string]: Type<any> } = {
  productos: ModalProductosComponent
};

@Component({
  selector: 'app-modalProductosCategorias',
  templateUrl: './modalProductosCategorias.component.html'
})
export class ModalProductosCategorias implements OnInit {

  @Input() fromParent: any;

 // FormGroup
  fgMain: FormGroup | any;

  productos: Productos = new Productos(0, '', '', '0', '', '', '0', '', '0', '', '', '', '', '', '', '', '', '', '', true, '', 1, '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  opcion: number = 0;

  // Progress Bar
  progressBar: boolean = false;

  // PRINCIPAL
  MainDC: string[] = ['index', 'unidadMedidas', 'nombre', 'stockActual', 'precioCompra', 'precio', 'barcode', 'status', 'acciones'];
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

  //Combos
  cboCategorias: Categorias[] = [];
  cboUnidadMedidas: UnidadMedidas[] = [];
  lista: Productos[] = [];

  constructor(
    public productosService: ProductosService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    private _modalService: NgbModal,
    public activeModal: NgbActiveModal
  ) {
    this.new_fgMain();
  }

  new_fgMain(){
    this.fgMain = this.fb.group({
      codigoBarra: '',
      idPuntoVenta: '',
      nombre: '',
      fechaIni: '',
      fechaFin: '',
      puntoventa:''
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
    this.fgMain.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.fgMain.get('puntoventa').setValue(this.puntoVentas.nombre);
    $("#codigoBarra").focus();
    this.loadMain();
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
            await this.loadMain();
          }
          break;
      }

    }, (reason) => { });
  }

  limpiar(){
    this.fgMain = this.fb.group({
      codigoBarra: '',
      idPuntoVenta: '',
      nombre: '',
      fechaIni: '',
      fechaFin: '',
      puntoventa:''
    });

    this.loadMain();
  }

  barCode(productos: Productos){
    this.productosService.obtenerBarCode(productos.id).subscribe(response => {
      const src = `data:image/png;base64,${response}`;
      const link = document.createElement("a");
      link.href = src;
      link.download = productos.codigoBarra + ".png";
      link.click();
    });

  }

  crudRegistros(){
    this.opcion = 1;
    this.openModal('productos');
  }

  viewDetail(element: any) {
    this.opcion = 2;
    this.productos = element;
    this.openModal('productos');
  }

  loadMain() {
    this.funcionesService.showLoading();
    // this.productosService.obtenerProductos(this.puntoVentas.id).subscribe(response => {

      this.lista = this.fromParent.productos;
      this.MainDS = new MatTableDataSource<Productos  >(this.fromParent.productos);
      this.MainDS.paginator = this.pagMain;
      this.funcionesService.hideLoading();

      this.MainDS.filterPredicate = function(data: Productos, filter: string): boolean {
        return data.nombre.trim().toLowerCase().includes(filter);
      };

      this.MainDS.filterPredicate = ((data: Productos, filter: any ) => {
        const a = !filter.codigoBarra || data.codigoBarra === filter.codigoBarra;
        const b = !filter.nombre || data.nombre.trim().toLowerCase().includes(filter.nombre.trim().toLowerCase());
        const c = !filter.idPuntoVenta || parseInt(data.idPuntoVenta) === parseInt(filter.idPuntoVenta);
        const d = !filter.fechaIni ||  new Date(this.funcionesService.formatearFecha4(data.created_at)) >= new Date(filter.fechaIni) && new Date(this.funcionesService.formatearFecha4(data.created_at)) <= new Date(filter.fechaFin);
        return a && b && c && d;
      }) as (PeriodicElement: any, string: any) => boolean;
    // }, error => {
    //   console.log(error);
    //   this.funcionesService.hideLoading();
    //   this.progressBar = false;
    // });
  }

  eliminarRegistro(element: Productos){
    this.funcionesService.mensajeConfirmar('¿Desea eliminar este registro?', '', (result: any) => {
      if (result.isConfirmed) {
        element.opcion = 2;
        element.status = 0;
        this.funcionesService.showLoading();
        this.productosService.crudProductos(element).subscribe(response => {
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

  configurarProducto(productos: Productos): boolean{
    let retornar: boolean = false;
    if(parseFloat(productos.stockActual) > 0 && parseFloat(productos.stockActual) <= parseFloat(productos.stockMinimo)){
      retornar = true;
    }
    return retornar;
  }

  configurarProductoVacio(productos: Productos): boolean{
    let retornar: boolean = false;
    if(parseFloat(productos.stockActual) === 0){
      retornar = true;
    }

    return retornar;
  }

}
