import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Proveedor } from 'src/app/modulos/mantenimientos/proveedor/model/proveedor';
import { ProveedorService } from 'src/app/modulos/mantenimientos/proveedor/service/proveedor.service';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

import { Productos } from '../model/productos';
import { ProveedoresProductos } from '../model/proveedoresProductos';
import { ProveedoresProductosService } from '../service/ProveedoresProductos.service';

@Component({
  selector: 'app-modalAsignarProveedores',
  templateUrl: './modalAsignarProveedores.component.html',
  providers: [ProveedoresProductosService],
})
export class ModalAsignarProveedoresComponent implements OnInit {
  @Input() fromParent: any;

  // FormGroup
  formGroup: FormGroup | any;
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  productos: Productos = new Productos();

  // Progress Bar
  progressBar: boolean = false;

  //COMBOS
  cboProveedores: Proveedor[] = [];

  // PRINCIPAL
  MainDC: string[] = ['index', 'proveedor', 'fecha', 'acciones'];
  MainDS: MatTableDataSource<ProveedoresProductos> =
    new MatTableDataSource<ProveedoresProductos>();
  @ViewChild('pagMain', { static: true }) pagMain: MatPaginator | any;

  constructor(
    public activeModal: NgbActiveModal,
    private funcionesService: FuncionesService,
    private proveedoresService: ProveedoresProductosService,
    private proveedorService: ProveedorService,
    private fb: FormBuilder
  ) {
    this.new_fgMain();
  }

  new_fgMain() {
    this.formGroup = this.fb.group({
      id: 0,
      idPuntoVenta: ['', Validators.required],
      puntoVenta: ['', Validators.required],
      idProveedor: ['', Validators.required],
      razonsocial: [''],
      numeroDoi: [''],
      idProducto: ['', Validators.required],
      nombre: [''],
      codigoBarra: [''],
      stockActual: [''],
      precio: [''],
      precioCompra: [''],
      proveedores: '',
    });
  }

  get getMain() {
    return this.formGroup.controls;
  }

  ngOnInit() {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.formGroup.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.formGroup.get('puntoVenta').setValue(this.puntoVentas.nombre);

    this.productos = this.fromParent.productos;
    this.formGroup.get('idProducto').setValue(this.productos.id);
    this.formGroup.get('nombre').setValue(this.productos.nombre);
    this.formGroup.get('codigoBarra').setValue(this.productos.codigoBarra);
    this.formGroup.get('stockActual').setValue(this.productos.stockActual);
    this.formGroup.get('precio').setValue(this.productos.precio);
    this.formGroup.get('precioCompra').setValue(this.productos.precioCompra);

    this.cargarProveedores();
    this.loadMain();
  }

  loadMain() {
    this.funcionesService.showLoading();
    this.proveedoresService
      .cargarProveedoresProductos(this.puntoVentas.id, this.productos.id)
      .subscribe(
        (response) => {
          if (response.status === 200) {
            this.funcionesService.hideLoading();
            this.MainDS = new MatTableDataSource<ProveedoresProductos>(
              response.detalles
            );
            this.MainDS.paginator = this.pagMain;
          } else {
            this.funcionesService.hideLoading();
            this.funcionesService.showWarning(response.message);
          }
        },
        (error) => {
          this.funcionesService.hideLoading();
          this.funcionesService.showWarning(error.error.message);
        }
      );
  }

  selectEvent(event: Proveedor) {
    this.formGroup.get('idProveedor').setValue(event.id);
    this.formGroup.get('razonsocial').setValue(event.razonsocial);
    this.formGroup.get('numeroDoi').setValue(event.numeroDoi);
  }

  cargarProveedores() {
    this.funcionesService.showLoading();
    this.proveedorService
      .obtenerProveedor(this.puntoVentas.id)
      .subscribe((response) => {
        this.cboProveedores = response.proveedores;
        this.cboProveedores = this.cboProveedores.filter(
          (x) => parseInt(x.status) === 1
        );
        this.funcionesService.hideLoading();
      });
  }

  eliminarRegistro(element: Productos) {
    this.funcionesService.mensajeConfirmar(
      '¿Desea eliminar este registro?',
      '',
      (result: any) => {
        if (result.isConfirmed) {
          element.opcion = 2;
          element.status = 0;
          this.funcionesService.showLoading();
          this.proveedoresService.deleteProveedoresProductos(element).subscribe(
            (response) => {
              if (response.status === 200) {
                this.funcionesService.showSuccess(response.message);
                this.loadMain();
                this.funcionesService.hideLoading();
              } else {
                this.funcionesService.showError(response.message);
                this.funcionesService.hideLoading();
                return;
              }
            },
            (err: any) => {
              console.log(err);
              this.funcionesService.hideLoading();
            }
          );
        }
      }
    );
  }

  crudRegistros() {
    if (this.formGroup.invalid) {
      this.funcionesService.swalError('Información incorrecta o incompleta');
    } else {
      let titulo: string = '';
      if (parseInt(this.formGroup.get('id').value) === 0) {
        titulo = '¿Estas seguro de guardar el registro?';
      } else {
        titulo = '¿Estas seguro de modificar el registro?';
      }

      this.funcionesService.mensajeConfirmar(titulo, '', (resultado: any) => {
        if (resultado.isConfirmed) {
          this.funcionesService.showLoading();
          this.progressBar = true;
          this.proveedoresService
            .crudProveedoresProductos(this.formGroup.value)
            .subscribe((response: any) => {
              if (response.code === 200) {
                this.funcionesService.showSuccess(response.message);
                this.loadMain();
                this.formGroup.get('proveedores').setValue('');
                this.funcionesService.hideLoading();
                this.progressBar = false;
              } else {
                this.funcionesService.showWarning(response.message);
                this.funcionesService.hideLoading();
                this.progressBar = false;
              }
            });
        }
      });
    }
  }

  cerrarModal(){
    const oReturn: any = new Object();

    oReturn['modal'] = 'proveedores';
    oReturn['value'] = 'loadAgain';

    this.activeModal.close(oReturn);
    this.progressBar = false;
    return;
  }
}
