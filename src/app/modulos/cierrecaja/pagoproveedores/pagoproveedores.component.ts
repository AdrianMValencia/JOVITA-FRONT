import { Component, OnInit } from '@angular/core';

import { User } from 'src/app/modulos/Seguridad/models/User';
import { Compras } from 'src/app/modulos/compras/Ingresos/model/compras';
import { ComprasService } from 'src/app/modulos/compras/Ingresos/service/compras.service';
import { Proveedor } from 'src/app/modulos/mantenimientos/proveedor/model/proveedor';
import { ProveedorService } from 'src/app/modulos/mantenimientos/proveedor/service/proveedor.service';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { Medio } from 'src/app/modulos/ventas/recibos/model/medio';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { MediopagoService } from 'src/app/shared/services/mediopago/mediopago.service';

import { CierreCaja } from '../models/cierreCaja';
import { CierrecajaService } from '../service/cierrecaja.service';
declare var $: any;

@Component({
  selector: 'app-pagoproveedores',
  templateUrl: './pagoproveedores.component.html',
  providers: [CierrecajaService, ProveedorService, MediopagoService, ComprasService]
})
export class PagoproveedoresComponent implements OnInit {
  cierreCajas: CierreCaja = new CierreCaja(0, '', '', '', '', '', '', '', '', '', '', '', '', 0, '', '', '', '', 0, '', '', 0, '', 0, '', 0);
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  usuarioStorage: string | any = localStorage.getItem('usuario');
  usuarios: User = new User();

  cboProveedores: Proveedor[] = [];
  cboMedioPago: Medio[] = [];
  cboCompras: Compras[] = [];

  constructor(
    public cierrecajaService: CierrecajaService,
    private proveedorService: ProveedorService,
    private medioPagoService: MediopagoService,
    private comprasService: ComprasService,
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

    this.cargarProveedores();
    this.cargarMedioPago();
  }

  cargarCompras(){
    this.comprasService.obtenerCompras(this.puntoVentas.id).subscribe(response => {
      this.cboCompras = response.compras;
      this.cboCompras = this.cboCompras.filter(x => parseInt(x.status) === 1 && parseInt(x.idProveedor) === parseInt(this.cierreCajas.idProveedor));
    });
  }

  cargarMedioPago(){
    this.medioPagoService.cargarMedioPago(this.puntoVentas.id).subscribe(response => {
      this.cboMedioPago = response.tiposPago;
      this.cboMedioPago = this.cboMedioPago.filter(x => parseInt(x.status) === 1);
    });
  }

  cargarProveedores(){
    this.funcionesService.showLoading();
    this.proveedorService.obtenerProveedor(this.puntoVentas.id).subscribe(response => {
        this.cboProveedores = response.proveedores;
        this.cboProveedores = this.cboProveedores.filter(x => parseInt(x.status) === 1);
        this.funcionesService.hideLoading();
    });
  }

  calcularPagoProveedores(event: any){
    if(event.value !== ''){
      this.cierreCajas.salidasTotal = parseFloat(event.value).toFixed(2);
    }
  }

  datosProveedor(event: any){
    let proveedores: Proveedor[] = this.cboProveedores.filter(x => x.id === parseInt(event.value));
    if(proveedores.length > 0){
      this.cierreCajas.ruc = proveedores[0].numeroDoi;
      this.cierreCajas.razonSocial = proveedores[0].razonsocial;
      this.cargarCompras();
    }
  }

  cargarOtros(event: any){
    if(parseInt(event.value) === 999){
      $("#otros").focus();
    }
  }

  GUARDARSALIDAPROVEEDORES(tipo: string): any{
   if(parseInt(this.cierreCajas.idProveedor) === 0){
    this.funcionesService.showError('Seleccione un proveedor');
    return false;
    }
    if(this.cierreCajas.pagoProveedores === ''){
      this.funcionesService.showError('Ingrese los pagos a proveedores');
      return false;
    }

    this.funcionesService.mensajeConfirmar('', '¿Desea registrar el pago al Proveedor?', (result: any) => {
      if(result.isConfirmed){

        this.funcionesService.showLoading();
        this.cierreCajas.entradaDinero = 0.00;
        this.cierreCajas.ingresoSobrante = 0.00;
        this.cierreCajas.inicioCaja = 0.00;
        this.cierreCajas.entradaTotal = 0.00;
        this.cierreCajas.tipo = tipo;
        this.cierreCajas.salidaDinero = 0.00;
        this.cierreCajas.pagoProveedores = parseFloat(this.cierreCajas.pagoProveedores);
        this.cierreCajas.numeroTicket = '';
        this.cierreCajas.pagoCreaditos = 0.00;

        this.cierrecajaService.crudCierreCaja(this.cierreCajas).subscribe(response => {
          if (response.status === 200) {
            this.funcionesService.showSuccess('Pago de proveedores registrado correctamente');
            this.cierreCajas.pagoProveedores = '';
            this.cierreCajas.salidasTotal = '';
            this.cierreCajas.motivo = '';
            this.cierreCajas.idProveedor = 0;
            this.cierreCajas.ruc = '';
            this.cierreCajas.razonSocial = '';
            this.cierreCajas.idCompras = 0;
            this.cierreCajas.otros = '';
            this.cierreCajas.idMedioPago = 0;
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
