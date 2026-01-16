import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { AbastecimientoDetalles } from '../../abastecimiento/models/abastecimientoDetalles';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Abastecimiento } from '../../abastecimiento/models/abastecimiento';

@Component({
  selector: 'app-modalabastecimientodetalles',
  templateUrl: './modalabastecimientodetalles.component.html',
})
export class ModalabastecimientodetallesComponent implements OnInit {

  @Input() fromParent: any;
  detalles: AbastecimientoDetalles[] = [];
  abastecimiento: Abastecimiento = new Abastecimiento();

  MainDC: string[] = ['puntoVenta', 'producto', 'precioCompra', 'cantidad'];
  MainDS: MatTableDataSource<AbastecimientoDetalles> = new MatTableDataSource<AbastecimientoDetalles>();
  @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

  constructor(
    public activeModal: NgbActiveModal
  ){}

  ngOnInit(): void {
    this.detalles = this.fromParent.detalles;
    this.abastecimiento = this.fromParent.abastecimiento;
    this.MainDS = new MatTableDataSource<AbastecimientoDetalles  >(this.detalles);
    this.MainDS.paginator = this.pagMain;
  }
}
