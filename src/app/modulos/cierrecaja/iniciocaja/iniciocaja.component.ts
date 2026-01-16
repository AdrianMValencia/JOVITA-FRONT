import { Component, OnInit } from '@angular/core';

import { User } from 'src/app/modulos/Seguridad/models/User';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

import { CierreCaja } from '../models/cierreCaja';
import { CierrecajaService } from '../service/cierrecaja.service';

@Component({
  selector: 'app-iniciocaja',
  templateUrl: './iniciocaja.component.html',
  providers: [CierrecajaService]
})
export class IniciocajaComponent implements OnInit {
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

  calcularInicioCaja(event: any){
    if(event.value !== ''){
      this.cierreCajas.entradaTotal = parseFloat(event.value).toFixed(2);
    }
  }

  GUARDARINICIOCAJA(tipo: string): any{
    if(this.cierreCajas.inicioCaja === ''){
      this.funcionesService.showError('Ingrese el monto de inicio de caja');
      return false;
    }

    this.funcionesService.mensajeConfirmar('', '¿Desea registrar el inicio de la caja?', (result: any) => {
      if(result.isConfirmed){

        this.funcionesService.showLoading();
        this.cierreCajas.entradaDinero = 0.00;
        this.cierreCajas.ingresoSobrante = 0.00;
        this.cierreCajas.inicioCaja = parseFloat(this.cierreCajas.inicioCaja);
        this.cierreCajas.tipo = tipo;
        this.cierreCajas.salidaDinero = 0.00;
        this.cierreCajas.pagoProveedores = 0.00;
        this.cierreCajas.salidasTotal = 0.00;
        this.cierreCajas.numeroTicket = '';
        this.cierreCajas.pagoCreaditos = 0.00;

        this.cierrecajaService.crudCierreCaja(this.cierreCajas).subscribe(response => {
          if (response.status === 200) {
            this.funcionesService.showSuccess('Inicio de caja registrado correctamente');
            this.cierreCajas.inicioCaja = '';
            this.cierreCajas.entradaTotal = '';
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
