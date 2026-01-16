import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MovimientoInventarioProductos } from './models/movimiento-inventario-productos';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { MovimientosInventarioProductosService } from './service/movimientos-inventario-productos.service';

@Component({
  selector: 'app-movimiento-inventario-productos',
  templateUrl: './movimiento-inventario-productos.component.html',
  providers: [MovimientosInventarioProductosService]
})
export class MovimientoInventarioProductosComponent implements OnInit {
    // FormGroup
    fgMain: FormGroup | any;

    almacenes: MovimientoInventarioProductos = new MovimientoInventarioProductos(0);
    puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
    puntoVentas: PuntosVenta = new PuntosVenta();
    opcion: number = 0;

    // Progress Bar
    progressBar: boolean = false;

    // PRINCIPAL
    MainDC: string[] = ['id', 'status'];
    MainDS: MatTableDataSource<MovimientoInventarioProductos> = new MatTableDataSource<MovimientoInventarioProductos>();
    @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

  constructor(
    private movimientoInventarioProductos: MovimientosInventarioProductosService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
  ){
     this.new_fgMain();
  }

  new_fgMain(){
    this.fgMain = this.fb.group({
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
    this.funcionesService.showLoading();
    this.progressBar = true;
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.fgMain.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.fgMain.get('puntoventa').setValue(this.puntoVentas.nombre);
    this.loadMain();
    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  limpiar(){
     this.fgMain = this.fb.group({
       idPuntoVenta: '',
       nombre: '',
       fechaIni: '',
       fechaFin: '',
       puntoventa:''
     });

     this.loadMain();
   }

  loadMain() {

    this.movimientoInventarioProductos.obtenerMovimientoInventarioProducto(this.puntoVentas.id).subscribe(response => {

      this.MainDS = new MatTableDataSource<MovimientoInventarioProductos>(response.almacenes);
      this.MainDS.paginator = this.pagMain;

      // this.MainDS.filterPredicate = function(data: MovimientoInventarioProductos, filter: string): boolean {
      //   return data.nombre.trim().toLowerCase().includes(filter);
      // };

      this.MainDS.filterPredicate = ((data: MovimientoInventarioProductos, filter: any ) => {
        // const a = !filter.nombre || data.nombre.trim().toLowerCase().includes(filter.nombre.trim().toLowerCase());
        // const b = !filter.idPuntoVenta || parseInt(data.idPuntoVenta) === parseInt(filter.idPuntoVenta);
        // const c = !filter.fechaIni ||  new Date(this.funcionesService.formatearFecha4(data.created_at)) > new Date(filter.fechaIni) && new Date(this.funcionesService.formatearFecha4(data.created_at)) < new Date(filter.fechaFin);
        // return a && b && c;
      }) as (PeriodicElement: any, string: any) => boolean;

    }, error => {
      console.log(error);
    });
  }
}
