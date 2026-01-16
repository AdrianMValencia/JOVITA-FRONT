import { Component, Input, OnInit, Type } from '@angular/core';

import { NgbActiveModal, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { User } from 'src/app/modulos/Seguridad/models/User';
import { UsuarioService } from 'src/app/modulos/Usuarios/service/usuario.service';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { TipospagoService } from 'src/app/modulos/mantenimientos/tipospagos/service/tipospago.service';
import { Medio } from 'src/app/modulos/ventas/recibos/model/medio';
import { RecibosMedioPago } from 'src/app/modulos/ventas/recibos/model/recibosMedioPago';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { MediopagoService } from 'src/app/shared/services/mediopago/mediopago.service';

import { ModalreportecierrecajaComponent } from '../modalreportecierrecaja/modalreportecierrecaja.component';
import { CierreCaja } from '../models/cierreCaja';
import { CierrecajaService } from '../service/cierrecaja.service';
// Modals
const MODALS: { [name: string]: Type<any> } = {
  downloadPDF: ModalreportecierrecajaComponent
};

@Component({
  selector: 'app-modalpreview',
  templateUrl: './modalpreview.component.html',
  providers: [MediopagoService, UsuarioService, TipospagoService, CierrecajaService]
})
export class ModalpreviewComponent implements OnInit {

  @Input() fromParent: any;
  cierreCajas: CierreCaja = new CierreCaja(0, '0', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  ListaCierreCajas: CierreCaja[] = [];
  medioPagos: RecibosMedioPago[] = [];
  // Progress Bar
  progressBar: boolean | any = false;

  cboVendedores: User[] = [];

  NgbModalOptions: NgbModalOptions = {
    size: 'xl',
    centered: true,
    scrollable: true,
    keyboard: false,
    backdrop: 'static',
    windowClass: 'modal-holder',
    fullscreen: 'xl'
  };

  constructor(
    public activeModal: NgbActiveModal,
    public funcionesService: FuncionesService,
    private medioPagoService: MediopagoService,
    private usuarioService: UsuarioService,
    private tipospagoService: TipospagoService,
    private _modalService: NgbModal,
    public cierrecajaService: CierrecajaService
  ){}

   ngOnInit(): any {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    let fecha: Date = new Date();
    this.cierreCajas.fecha = this.funcionesService.generarFechaLocal3(fecha);
    this.cargarVendedores();
    this.calcularCierreCaja();
  }

  calcularCierreCaja(){
    this.funcionesService.showLoading();
    this.progressBar = true;
    // this.ListaCierreCajas = this.fromParent.cierreCajas;

    this.cierreCajas.idPuntoVenta = this.puntoVentas.id;
    this.cierreCajas.puntoventa = this.puntoVentas.nombre;

    this.puntoVentas = JSON.parse(this.puntoVentaStorage);

    this.tipospagoService.obtenerTiposPago(this.puntoVentas.id).subscribe(result => {

      let resultado: Medio[] = result.tiposPago;
      let pagoEfectivo: Medio = new Medio();
      resultado = resultado.filter(x => x.nombre === 'Efectivo');
      if(resultado.length > 0){
        pagoEfectivo = resultado[0];
      }
      let pagosEfectivo: any = 0;
      this.medioPagoService.recibosMedioPago(this.puntoVentas.id, this.cierreCajas.idUsuario, this.cierreCajas.fecha).subscribe(response => {
        this.medioPagos = response.recibosMedioPago;

        this.medioPagos.forEach(element => {
          pagosEfectivo = (parseFloat(pagosEfectivo) + parseFloat(element.importe)).toFixed(2);
        });
        this.cierreCajas.pagosEfectivo = pagosEfectivo;

        let inicioCaja: any = 0;
        let entradaDinero: any = 0;
        let entradaTotal: any = 0;
        let salidaDinero: any = 0;
        let pagoProveedores: any = 0;
        let salidasTotal: any = 0;
        let pagoCreaditos: any = 0;
        let ingresoSobrante: any = 0;
        let ingresoSobranteTotal: any = 0;

        this.cierrecajaService.obtenerCierreCaja(this.puntoVentas.id).subscribe(response => {
          this.ListaCierreCajas = response.cierreCajas;

          this.ListaCierreCajas.forEach(element => {

            if(parseInt(this.cierreCajas.idUsuario) === 0){
              if(element.fecha.split(" ")[0] === this.cierreCajas.fecha.split("T")[0]){
                inicioCaja = (parseFloat(inicioCaja) + parseFloat(element.inicioCaja)).toFixed(2);
                entradaDinero = (parseFloat(entradaDinero) + parseFloat(element.entradaDinero)).toFixed(2);
                entradaTotal = (parseFloat(entradaTotal) + parseFloat(element.entradaTotal)).toFixed(2);
                salidaDinero = (parseFloat(salidaDinero) + parseFloat(element.salidaDinero)).toFixed(2);
                pagoProveedores = (parseFloat(pagoProveedores) + parseFloat(element.pagoProveedores)).toFixed(2);
                salidasTotal = (parseFloat(salidasTotal) + parseFloat(element.salidasTotal)).toFixed(2);
                pagoCreaditos = (parseFloat(pagoCreaditos) + parseFloat(element.pagoCreaditos)).toFixed(2);
                ingresoSobrante = (parseFloat(ingresoSobrante) + parseFloat(element.ingresoSobrante)).toFixed(2);
                ingresoSobranteTotal = (parseFloat(ingresoSobranteTotal) + parseFloat(element.ingresoSobranteTotal)).toFixed(2);
              }
            }else{

              if(element.fecha.split(" ")[0] === this.cierreCajas.fecha.split("T")[0] && parseInt(element.idUsuario) === parseInt(this.cierreCajas.idUsuario)){
                inicioCaja = (parseFloat(inicioCaja) + parseFloat(element.inicioCaja)).toFixed(2);
                entradaDinero = (parseFloat(entradaDinero) + parseFloat(element.entradaDinero)).toFixed(2);
                entradaTotal = (parseFloat(entradaTotal) + parseFloat(element.entradaTotal)).toFixed(2);
                salidaDinero = (parseFloat(salidaDinero) + parseFloat(element.salidaDinero)).toFixed(2);
                pagoProveedores = (parseFloat(pagoProveedores) + parseFloat(element.pagoProveedores)).toFixed(2);
                salidasTotal = (parseFloat(salidasTotal) + parseFloat(element.salidasTotal)).toFixed(2);
                pagoCreaditos = (parseFloat(pagoCreaditos) + parseFloat(element.pagoCreaditos)).toFixed(2);
                ingresoSobrante = (parseFloat(ingresoSobrante) + parseFloat(element.ingresoSobrante)).toFixed(2);
                ingresoSobranteTotal = (parseFloat(ingresoSobranteTotal) + parseFloat(element.ingresoSobranteTotal)).toFixed(2);
              }
            }
          });

          this.cierreCajas.inicioCaja = inicioCaja;
          this.cierreCajas.entradaDinero = entradaDinero;
          this.cierreCajas.entradaTotal = entradaTotal;
          this.cierreCajas.salidaDinero = salidaDinero;
          this.cierreCajas.pagoProveedores = pagoProveedores;
          this.cierreCajas.salidasTotal = salidasTotal;
          this.cierreCajas.pagoCreaditos = pagoCreaditos;
          this.cierreCajas.ingresoSobrante = ingresoSobrante;
          this.cierreCajas.ingresoSobranteTotal = ingresoSobranteTotal;

          this.cierreCajas.totalGeneral = ((((parseFloat(this.cierreCajas.entradaTotal) + parseFloat(this.cierreCajas.pagosEfectivo)) - parseFloat(this.cierreCajas.pagoCreaditos)) - parseFloat(this.cierreCajas.salidasTotal)) + parseFloat(this.cierreCajas.ingresoSobranteTotal)).toFixed(2);
          this.funcionesService.hideLoading();
          this.progressBar = false;
        });
      });

    });
  }

  abrirPDF(){
    this.openModal('downloadPDF');
  }

  openModal(name: string) {

    const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
    const obj: any = new Object();

    switch (name) {
    case 'downloadPDF':
        obj['cierreCajas'] = this.cierreCajas;
        modalRef.componentInstance.fromParent = obj;
      break;
    }

    modalRef.result.then(async (result) => {

      switch (result.modal) {
        case 'cierreCajas':
          if (result.value === 'loadAgain') {

            this.funcionesService.showLoading();
            this.progressBar = true;

            this.progressBar = false
            this.funcionesService.hideLoading();
          }
          break;
      }

    }, (reason) => { });
  }

  // selectEventUsuarios(usuarios: User){
  //   this.cierreCajas.idUsuario = usuarios.id;
  //   this.cierreCajas.usuario = usuarios.nombre;
  //   this.calcularCierreCaja();
  // }

  selectEventUsuarios(event: any){
    this.cierreCajas.idUsuario = parseInt(event.value);
    this.calcularCierreCaja();
  }

  cargarVendedores(){
    this.usuarioService.obtenerUsuarios(this.puntoVentas.id).subscribe(response => {
      this.cboVendedores = response.usuarios;
      this.cboVendedores = this.cboVendedores.filter(x => parseInt(x.status) === 1);
    });
  }
}
