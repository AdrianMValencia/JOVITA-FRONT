import { Component, OnInit } from '@angular/core';

import { User } from 'src/app/modulos/Seguridad/models/User';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

import { CierreCaja } from '../models/cierreCaja';
import { CierrecajaService } from '../service/cierrecaja.service';

@Component({
  selector: 'app-entradadinero',
  templateUrl: './entradadinero.component.html',
  providers: [CierrecajaService]
})
export class EntradadineroComponent implements OnInit {
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

  calcularEntradaDinero(event: any){
    if(event.value !== ''){
      this.cierreCajas.ingresoSobranteTotal = (parseFloat(event.value)).toFixed(2);
    }
  }

  GUARDARENTRADAEFECTIVO(tipo: string): any{
    if(this.cierreCajas.entradaDinero === ''){
      this.funcionesService.showError('Ingrese la entrada de dinero');
      return false;
    }

    this.funcionesService.mensajeConfirmar('', '¿Desea registrar la entrada de dinero?', (result: any) => {
      if(result.isConfirmed){

        this.funcionesService.showLoading();
        this.cierreCajas.entradaDinero = parseFloat(this.cierreCajas.entradaDinero);
        this.cierreCajas.ingresoSobrante = 0.00;
        this.cierreCajas.inicioCaja = 0.00;
        this.cierreCajas.tipo = tipo;
        this.cierreCajas.salidaDinero = 0.00;
        this.cierreCajas.pagoProveedores = 0.00;
        this.cierreCajas.salidasTotal = 0.00;
        this.cierreCajas.numeroTicket = '';
        this.cierreCajas.pagoCreaditos = 0.00;

        this.cierrecajaService.crudCierreCaja(this.cierreCajas).subscribe(response => {
          if (response.status === 200) {
            this.funcionesService.showSuccess('La entrada de dinero se registro correctamente');
            this.cierreCajas.entradaDinero = '';
            this.cierreCajas.entradaTotal = '';
            this.cierreCajas.ingresoSobranteTotal = '';
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
