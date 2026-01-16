import { Component, OnInit, Input } from '@angular/core';
import { DevolucionesService } from '../service/devoluciones.service';
import { Devoluciones } from '../models/devoluciones';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Recibos } from '../../recibos/model/recibos';
import { RecibosDetalles } from '../../recibos/model/recibosDetalles';
import { Items } from 'src/app/shared/services/items/items';
import { ItemsService } from 'src/app/shared/services/items/items.service';

@Component({
  selector: 'app-modaldevoluciones',
  templateUrl: './modaldevoluciones.component.html',
  providers: [DevolucionesService, ItemsService]
})
export class ModaldevolucionesComponent implements OnInit {

  @Input() fromParent: any;
  devoluciones: Devoluciones = new Devoluciones(0, '', '', '0', '', '', '0', '', '', '', '', false, '0', '', true, '');
  recibos: Recibos = new Recibos(0, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', true, '', '');
  detalles: RecibosDetalles = new RecibosDetalles(0, '', '', '', '', '', '', '', '', '', '', '', '');

    // Progress Bar
    progressBar: boolean | any;

    // FormGroup
    formGroup: FormGroup | any;

    cboMotivos: Items[] = [];
    mostrar: boolean = false;

    constructor(
      public devolucionesService: DevolucionesService,
      private itemsServce: ItemsService,
      public funcionesService: FuncionesService,
      private fb: FormBuilder,
      public activeModal: NgbActiveModal
    ) {
      this.new_Modal();
    }

    new_Modal() {
      this.formGroup = this.fb.group({
        id: 0,
        stock: [false],
        cantidad: '',
        motivo: [0, [Validators.required]],
        detalle: ['', [Validators.required]]
      });
    }

    get getModal() { return this.formGroup.controls; }

    ngOnInit() {
      this.funcionesService.showLoading();
      this.progressBar = true;

      this.recibos = this.fromParent.recibos;
      this.detalles = this.fromParent.detalles;
      this.cargarMotivos();

      this.funcionesService.hideLoading();
      this.progressBar = false;
    }

    cargarMotivos(){
      this.itemsServce.cargarItems('motivo').subscribe(response => {
        this.cboMotivos = response.items;
      });
    }

    showOptions(event: any){
      if(event.checked){
        this.mostrar = true;
      }else{
        this.mostrar = false;
      }
    }

    saveDevoluciones(form: FormGroup){
      if(form.invalid){
        this.funcionesService.showError('Información incorrecta o incompleta');
      }else{

        if(form.value.stock){

          if(parseInt(this.formGroup.get("motivo").value) === 0){
            this.funcionesService.showError('Seleccione un motivo de devolución');
          }else{

            if(parseFloat(form.value.cantidad) > parseFloat(this.detalles.cantidad)){
              this.funcionesService.showError('La cantidad ha devolver no puede ser mayor que la cantidad vendida');
            }else{

              this.funcionesService.mensajeConfirmar('', '¿Desea realizar la devolución?', (result: any) => {
                if(result.isConfirmed){

                  let vfbModal = form.value;
                  this.devoluciones.idPuntoVenta = this.recibos.idPuntoVenta;
                  this.devoluciones.puntoventa = this.recibos.puntoventa.nombre;
                  this.devoluciones.idRecibos = this.recibos.id;
                  this.devoluciones.series = this.recibos.series;
                  this.devoluciones.numeracion = this.recibos.numeracion;
                  this.devoluciones.idProducto = this.detalles.idProducto;
                  this.devoluciones.codigoBarra = this.detalles.codigoBarra;
                  this.devoluciones.nombre = this.detalles.nombre;
                  this.devoluciones.cantidad = this.detalles.cantidad;
                  this.devoluciones.precio = this.detalles.precio;
                  this.devoluciones.stock = vfbModal.stock == null ? '': vfbModal.stock;
                  this.devoluciones.motivo = vfbModal.motivo == null ? '': vfbModal.motivo;
                  this.devoluciones.detalle = vfbModal.detalle == null ? '': vfbModal.detalle;

                  this.funcionesService.showLoading();
                  this.progressBar = true;

                  this.devolucionesService.crudDevoluciones(this.devoluciones).subscribe((response: any) => {

                    if (response.status === 200) {
                      this.funcionesService.showSuccess(response.message);

                      const oReturn: any = new Object();

                      oReturn['modal'] = 'devoluciones';
                      oReturn['value'] = 'loadAgain';

                      this.activeModal.close(oReturn);
                      this.funcionesService.hideLoading();
                      this.progressBar = false;
                      return;
                    }
                    else {
                      this.funcionesService.showError(response.message);
                      this.funcionesService.hideLoading();
                       this.progressBar = false;
                      return;
                    }
                  }, (err: any) => {
                    console.log(err);
                    this.funcionesService.hideLoading();
                     this.progressBar = false;
                  });
                }
              });
            }
          }
        }else{

          if(parseFloat(form.value.cantidad) > parseFloat(this.detalles.cantidad)){
            this.funcionesService.showError('La cantidad ha devolver no puede ser mayor que la cantidad vendida');
          }else{

            this.funcionesService.mensajeConfirmar('', '¿Desea realizar la devolución?', (result: any) => {
              if(result.isConfirmed){

                let vfbModal = form.value;
                this.devoluciones.idPuntoVenta = this.recibos.idPuntoVenta;
                this.devoluciones.puntoventa = this.recibos.puntoventa.nombre;
                this.devoluciones.idRecibos = this.recibos.id;
                this.devoluciones.series = this.recibos.series;
                this.devoluciones.numeracion = this.recibos.numeracion;
                this.devoluciones.idProducto = this.detalles.idProducto;
                this.devoluciones.codigoBarra = this.detalles.codigoBarra;
                this.devoluciones.nombre = this.detalles.nombre;
                this.devoluciones.cantidad = this.detalles.cantidad;
                this.devoluciones.precio = this.detalles.precio;
                this.devoluciones.stock = vfbModal.stock == null ? '': vfbModal.stock;
                this.devoluciones.motivo = vfbModal.motivo == null ? '': vfbModal.motivo;
                this.devoluciones.detalle = vfbModal.detalle == null ? '': vfbModal.detalle;

                this.funcionesService.showLoading();
                this.progressBar = true;

                this.devolucionesService.crudDevoluciones(this.devoluciones).subscribe((response: any) => {

                  if (response.status === 200) {
                    this.funcionesService.showSuccess(response.message);

                    const oReturn: any = new Object();

                    oReturn['modal'] = 'devoluciones';
                    oReturn['value'] = 'loadAgain';

                    this.activeModal.close(oReturn);
                    this.funcionesService.hideLoading();
                    this.progressBar = false;
                    return;
                  }
                  else {
                    this.funcionesService.showError(response.message);
                    this.funcionesService.hideLoading();
                     this.progressBar = false;
                    return;
                  }
                }, (err: any) => {
                  console.log(err);
                  this.funcionesService.hideLoading();
                   this.progressBar = false;
                });
              }
            });
          }
        }
      }
    }

}
