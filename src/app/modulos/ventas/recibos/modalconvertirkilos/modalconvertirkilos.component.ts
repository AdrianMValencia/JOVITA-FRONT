import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { Recibos } from '../model/recibos';
import { Productos } from 'src/app/modulos/almacen/productos/model/productos';
declare var $: any;

@Component({
  selector: 'app-modalconvertirkilos',
  templateUrl: './modalconvertirkilos.component.html',
})
export class ModalconvertirkilosComponent implements OnInit {

  @Input() fromParent: any;
  recibos: Recibos = new Recibos(0, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', true, '', '');
  productos: Productos = new Productos(0, '', '0', '', '0', '', '', '', '', '', '', true, 1, '', '', false);
  cantidad: string = '1';
  precio: any = 0;

  // Progress Bar
  progressBar: boolean | any;

  constructor(
    public funcionesService: FuncionesService,
    public activeModal: NgbActiveModal
  ){}

  ngOnInit(): void {
    this.funcionesService.showLoading();
    this.progressBar = true;
    this.productos = this.fromParent.productos;
    $("#cantidad").focus();
    this.precio = (parseFloat(this.productos.precio) * parseFloat(this.cantidad)).toFixed(2);

    document.addEventListener("keydown", (event: any) =>{
      if (event.code === "Enter")
      {
          event.preventDefault();
          this.aceptar();
      }
      if (event.code === "Escape")
      {
          event.preventDefault();
          this.activeModal.dismiss();
      }
    });

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  calcular(event: any){
    this.cantidad = event.value;
    if(parseFloat(this.cantidad) !== 0 && this.cantidad !== ''){
      this.precio = (parseFloat(this.productos.precio) * parseFloat(this.cantidad)).toFixed(2);
    }else{
      this.precio = parseFloat(this.productos.precio).toFixed(2);
    }
  }

  calcular2(event: any){
    this.precio = event.value;
    if(parseFloat(this.precio) !== 0 && this.precio !== ''){
      this.cantidad = (parseFloat(this.precio) / parseFloat(this.productos.precio)).toFixed(2);
    }else{
      this.cantidad = parseFloat(this.productos.precio).toFixed(2);
    }
  }

  aceptar(): any{
    this.funcionesService.showLoading();
    this.progressBar = true;

    if(parseFloat(this.cantidad) === 0){
      this.funcionesService.showError('La cantidad no puede ser 0');
    }else{
      const oReturn: any = new Object();
      oReturn['modal'] = 'kilos';
      oReturn['value'] = 'loadAgain';
      oReturn['productos'] = this.productos;
      oReturn['precio'] = this.precio;
      oReturn['cantidad'] = this.cantidad;
      this.activeModal.close(oReturn);
      this.progressBar = false;
      this.funcionesService.hideLoading();
      return;
    }
  }
}
