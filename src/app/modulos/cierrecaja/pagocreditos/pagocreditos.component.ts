import { Component, OnInit } from '@angular/core';

import { User } from 'src/app/modulos/Seguridad/models/User';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { Recibos } from 'src/app/modulos/ventas/recibos/model/recibos';
import { RecibosService } from 'src/app/modulos/ventas/recibos/service/recibos.service';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

import { CierreCaja } from '../models/cierreCaja';
import { CierrecajaService } from '../service/cierrecaja.service';

@Component({
  selector: 'app-pagocreditos',
  templateUrl: './pagocreditos.component.html',
  providers: [CierrecajaService]
})
export class PagocreditosComponent implements OnInit {
  cierreCajas: CierreCaja = new CierreCaja(0, '', '', '', '', '', '', '', '', '', '', '', '', 0, '', '', '', '', 0, '', '', 0, '', 0, '', 0);
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  usuarioStorage: string | any = localStorage.getItem('usuario');
  usuarios: User = new User();

  cboRecibos: Recibos[] = [];

  constructor(
    public cierrecajaService: CierrecajaService,
    private recibosService: RecibosService,
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
    this.cargarRecibos();
  }

  cargarRecibos(){
    this.recibosService.cargarRecibos(this.puntoVentas.id).subscribe(response => {
      this.cboRecibos = response.recibos;
    });
  }

  calcularEntradaDinero(event: any){
    if(event.value !== ''){
      this.cierreCajas.entradaTotal = (parseFloat(event.value)).toFixed(2);
    }
  }

  GUARDARPAGOSCREDITOS(tipo: string): any{
    if(this.cierreCajas.numeroTicket === ''){
      this.funcionesService.showError('Ingese el número de ticket');
      return false;
    }
    if(this.cierreCajas.pagoCreaditos === ''){
      this.funcionesService.showError('Ingrese el pago a crédito');
      return false;
    }

    this.funcionesService.mensajeConfirmar('', '¿Desea registrar los pagos a crédito?', (result: any) => {
      if(result.isConfirmed){

        this.funcionesService.showLoading();
        this.cierreCajas.entradaDinero = 0.00;
        this.cierreCajas.ingresoSobrante = 0.00;
        this.cierreCajas.inicioCaja = 0.00;
        this.cierreCajas.entradaTotal = 0.00
        this.cierreCajas.tipo = tipo;
        this.cierreCajas.salidaDinero = 0.00;
        this.cierreCajas.pagoProveedores = 0.00;
        this.cierreCajas.salidasTotal = 0.00;
        this.cierreCajas.pagoCreaditos = parseFloat(this.cierreCajas.pagoCreaditos);

        this.cierrecajaService.crudCierreCaja(this.cierreCajas).subscribe(response => {
          if (response.status === 200) {
            this.funcionesService.showSuccess('Los pagos a crédito se registrarón correctamente');
            this.cierreCajas.numeroTicket = 0;
            this.cierreCajas.pagoCreaditos = '';
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
}
