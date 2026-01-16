import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

import { User } from 'src/app/modulos/Seguridad/models/User';
import { Cajas } from 'src/app/modulos/mantenimientos/cajas/models/cajas';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

import { CierreCaja } from '../models/cierreCaja';
import { CierrecajaService } from '../service/cierrecaja.service';

@Component({
  selector: 'app-ingreso-sobrante',
  templateUrl: './ingreso-sobrante.component.html',
  providers: [CierrecajaService]
})
export class IngresoSobranteComponent implements OnInit {

  cierreCajas: CierreCaja = new CierreCaja(0, '', '', '', '', '', '', '', '', '', '', '', '', 0, '', '', '', '', 0, '', '', 0, '', 0);
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  usuarioStorage: string | any = localStorage.getItem('usuario');
  usuarios: User = new User();

    // PRINCIPAL
    MainDC: string[] = ['usuario', 'fecha', 'motivo', 'ingresoSobrante', 'acciones'];
    MainDS: MatTableDataSource<CierreCaja> = new MatTableDataSource<CierreCaja>();
    @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

  constructor(
    public cierrecajaService: CierrecajaService,
    public funcionesService: FuncionesService,
  ){}

  ngOnInit(): void {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.cierreCajas.idPuntoVenta = this.puntoVentas.id;
    this.cierreCajas.puntoventa = this.puntoVentas.nombre;
    this.usuarios = JSON.parse(this.usuarioStorage);
    this.cierreCajas.idUsuario = this.usuarios.id;
    this.cierreCajas.usuario = this.usuarios.nombre;

    let fecha: Date = new Date();
    this.cierreCajas.fecha = this.funcionesService.generarFechaLocal3(fecha);

    this.listaIngresoSobrante();
  }

  listaIngresoSobrante(){
    this.funcionesService.showLoading();
    this.cierrecajaService.listaIngresoSobrante(this.puntoVentas.id).subscribe(response =>{
      this.funcionesService.hideLoading();
      this.MainDS = new MatTableDataSource<CierreCaja>(response.cierreCajas);
      this.MainDS.paginator = this.pagMain;
    });
  }

  calcularEntradaDinero(event: any){
    if(event.value !== ''){
      this.cierreCajas.ingresoSobranteTotal = (parseFloat(event.value)).toFixed(2);
    }
  }

  GUARDARENTRADAEFECTIVO(tipo: string): any{
    if(this.cierreCajas.ingresoSobrante === ''){
      this.funcionesService.showError('Ingrese el ingreso sobrante');
      return false;
    }

    this.funcionesService.mensajeConfirmar('', '¿Desea registrar el ingreso sobrante?', (result: any) => {
      if(result.isConfirmed){

        this.funcionesService.showLoading();
        this.cierreCajas.ingresoSobrante = parseFloat(this.cierreCajas.ingresoSobrante);
        this.cierreCajas.entradaDinero = 0.00;
        this.cierreCajas.inicioCaja = 0.00;
        this.cierreCajas.tipo = tipo;
        this.cierreCajas.salidaDinero = 0.00;
        this.cierreCajas.pagoProveedores = 0.00;
        this.cierreCajas.salidasTotal = 0.00;
        this.cierreCajas.numeroTicket = '';
        this.cierreCajas.pagoCreaditos = 0.00;
        this.cierreCajas.entradaTotal = 0.00;
        this.cierreCajas.numeroTicket = '';

        this.cierrecajaService.crudCierreCaja(this.cierreCajas).subscribe(response => {
          if (response.status === 200) {
            this.funcionesService.showSuccess('el ingreso sobrante se registro correctamente');
            this.cierreCajas.ingresoSobrante = '';
            this.cierreCajas.ingresoSobranteTotal = '';
            this.cierreCajas.motivo = '';
            this.listaIngresoSobrante();
            this.funcionesService.hideLoading();
            return;
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

    eliminarRegistro(element: Cajas){
      this.funcionesService.mensajeConfirmar('¿Desea eliminar este registro?', '', (result: any) => {
        if (result.isConfirmed) {
          this.funcionesService.showLoading();
          this.cierrecajaService.deleteCierreCaja(element).subscribe(response => {

            if (response.status === 200) {
              this.funcionesService.showSuccess(response.message);
              this.listaIngresoSobrante();
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
