import { Component, OnInit } from '@angular/core';

import { User } from 'src/app/modulos/Seguridad/models/User';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

import { CierreCaja } from '../models/cierreCaja';
import { CierrecajaService } from '../service/cierrecaja.service';

@Component({
  selector: 'app-salidadinero',
  templateUrl: './salidadinero.component.html',
  providers: [CierrecajaService]
})
export class SalidadineroComponent implements OnInit {
  cierreCajas: CierreCaja = new CierreCaja(0, '', '', '', '', '', '', '', '', '', '', '', '', 0, '', '', '', '', 0, '', '', 0, '', 0, '', 0);
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  usuarioStorage: string | any = localStorage.getItem('usuario');
  usuarios: User = new User();

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
  }

  calcularSalidaDinero(event: any){
    if(event.value !== ''){
      this.cierreCajas.salidasTotal = parseFloat(event.value).toFixed(2);
    }
  }

  GUARDARSALIDAPROVEEDORES(tipo: string): any{
    if(this.cierreCajas.salidaDinero === ''){
      this.funcionesService.showError('Ingese la salida de dinero');
      return false;
    }

    this.funcionesService.mensajeConfirmar('', '¿Desea registrar la salida de dinero?', (result: any) => {
      if(result.isConfirmed){

        this.funcionesService.showLoading();
        this.cierreCajas.entradaDinero = 0.00;
        this.cierreCajas.ingresoSobrante = 0.00;
        this.cierreCajas.inicioCaja = 0.00;
        this.cierreCajas.entradaTotal = 0.00
        this.cierreCajas.tipo = tipo;
        this.cierreCajas.salidaDinero = parseFloat(this.cierreCajas.salidaDinero);
        this.cierreCajas.pagoProveedores = 0.00;
        this.cierreCajas.numeroTicket = '';
        this.cierreCajas.pagoCreaditos = 0.00;

        this.cierrecajaService.crudCierreCaja(this.cierreCajas).subscribe(response => {
          if (response.status === 200) {
            this.funcionesService.showSuccess('Salida de dinero registrada correctamente');
            this.cierreCajas.salidaDinero = '';
            this.cierreCajas.salidasTotal = '';
            this.cierreCajas.motivo = '';
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
