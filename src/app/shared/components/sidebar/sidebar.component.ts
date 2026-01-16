import { Component, OnInit } from '@angular/core';

import { UserService } from 'src/app/modulos/Seguridad/services/user.service';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { PuntosventaService } from 'src/app/modulos/mantenimientos/puntosventa/service/puntosventa.service';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
declare var $: any;

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  providers: [UserService, PuntosventaService]
})
export class SidebarComponent implements OnInit {

  puntoVentas: PuntosVenta = new PuntosVenta();
  idRol: number | any = 0;
  puntoVenta: PuntosVenta[] = [];

  constructor(
    public userService: UserService,
    public puntosventaService: PuntosventaService,
    public funciones: FuncionesService
  ){}

  ngOnInit(): void {

    $('.navbar-minimalize').on('click', function (event: any) {
      event.preventDefault();
      $("body").toggleClass("mini-navbar");
      if (!$('body').hasClass('mini-navbar') || $('body').hasClass('body-small')) {
        // Hide menu in order to smoothly turn on when maximize menu
        $('#side-menu').hide();
        // For smoothly turn on menu
        setTimeout(
            function () {
                $('#side-menu').fadeIn(400);
            }, 200);
    } else if ($('body').hasClass('fixed-sidebar')) {
        $('#side-menu').hide();
        setTimeout(
            function () {
                $('#side-menu').fadeIn(400);
            }, 100);
    } else {
        // Remove all inline style from jquery fadeIn function to reset menu state
        $('#side-menu').removeAttr('style');
    }
  });

    let puntosVenta: string | any = localStorage.getItem('puntosVenta');
    this.puntoVentas = JSON.parse(puntosVenta);

    let usuarioJson: string | any = localStorage.getItem('usuario');
    this.idRol = JSON.parse(usuarioJson).idRol;

    this.puntosventaService.cargarPuntosVenta().subscribe((data: any) => {
      this.puntoVenta = data.puntosVenta;
    });
  }

  validarPuntoVenta(target: any): any{
    this.funciones.showSuccess('Punto de Venta cambiado correctamente');

    let puntoVentas: any[] = this.puntoVenta;
    let puntoVenta: PuntosVenta = new PuntosVenta();

    puntoVentas.forEach(element => {
      if(parseInt(element.id) === parseInt(target.value)){
        puntoVenta = element;
      }
    });

    localStorage.removeItem('puntosVenta');
    localStorage.setItem('puntosVenta', JSON.stringify(puntoVenta));
    location.reload();
  }
}
