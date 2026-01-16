import { Component, OnInit, Input } from '@angular/core';
import { PagosrealizarService } from '../service/pagosrealizar.service';
import { BancosService } from '../../bancos/service/bancos.service';
import { MonedasService } from '../../monedas/service/monedas.service';
import { Bancos } from '../../bancos/model/bancos';
import { Monedas } from '../../monedas/model/monedas';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PuntosVenta } from '../../puntosventa/model/puntosVenta';
import { PagosRealizar } from '../models/pagosrealizar';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ItemsService } from 'src/app/shared/services/items/items.service';
import { Items } from 'src/app/shared/services/items/items';
import { UserService } from 'src/app/modulos/Seguridad/services/user.service';

@Component({
  selector: 'app-modalpagosrealizar',
  templateUrl: './modalpagosrealizar.component.html',
  providers: [PagosrealizarService, BancosService, MonedasService, ItemsService, UserService]
})
export class ModalpagosrealizarComponent implements OnInit {

  @Input() fromParent: any;

  pagos: PagosRealizar = new PagosRealizar(0, '', '', '0', '0', '0', '0', '', '', '', 1, true, '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  progressBar: boolean | any;

  // FormGroup
  formGroup: FormGroup | any;
  titulo: string = '';

  //Combos
  cboBancos: Bancos[] = [];
  cboMonedas: Monedas[] = [];
  cboPeriodicidad: Items[] = [];
  cboTipo: Items[] = [];

  constructor(
    public pagosrealizarService: PagosrealizarService,
    private bancosService: BancosService,
    private monedasService: MonedasService,
    private itemsService: ItemsService,
    private userService: UserService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal
  ) {
    this.new_Modal();
  }

  new_Modal() {
    this.formGroup = this.fb.group({
      id: 0,
      idPuntoVenta: ['', [Validators.required]],
      nombre: ['', [Validators.required]],
      periodicidad: [0],
      tipo: [0],
      idBanco: [0, [Validators.required]],
      idMoneda: [0, [Validators.required]],
      cantidad: ['', [Validators.required, Validators.pattern(/^-?(0|[1-9]\d*)?$/)]],
      monto: ['', [Validators.required, Validators.pattern(/^-?\d*[.,]?\d{0,2}$/)]],
      observaciones: [''],
      status: [true],
      puntoventa: ['']
    });
  }

  get getModal() { return this.formGroup.controls; }

  ngOnInit() {
    this.funcionesService.showLoading();
    this.progressBar = true;

    this.cargarBancos();
    this.cargarMonedas();
    this.cargarPeridocidad();
    this.cargarTipo();

    const opc = this.fromParent.opcion;
    const array = this.fromParent.pagos;

    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.formGroup.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.formGroup.get('puntoventa').setValue(this.puntoVentas.nombre);

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        idPuntoVenta: parseInt(array.idPuntoVenta),
        nombre: array.nombre,
        periodicidad: array.periodicidad,
        tipo: array.tipo,
        idBanco: parseInt(array.idBanco),
        idMoneda: parseInt(array.idMoneda),
        cantidad: array.cantidad,
        monto: array.monto,
        observaciones: array.observaciones,
        status: array.status,
        ubigeos: array.ubigeos
      });

      this.titulo = 'Modificar Pagos a Realizar ' + array.nombre;
    }else{
      this.titulo = 'Agregar Pagos a Realizar';
    }
    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  cargarBancos(){
    this.bancosService.cargarBancos().subscribe(response => {
      if(response.status !== 200){
        this.userService.logout();
      };

      this.cboBancos = response.bancos;
    });
  }

  cargarMonedas(){
    this.monedasService.cargarMonedas().subscribe(response => {
      this.cboMonedas = response.monedas;
    });
  }

  cargarPeridocidad(){
    this.itemsService.cargarItems('periodicidad').subscribe(response => {
      this.cboPeriodicidad = response.items;
    });
  }

  cargarTipo(){
    this.itemsService.cargarItems('tipo').subscribe(response => {
      this.cboTipo = response.items;
    });
  }

  saveRegistro(form: FormGroup) {

    if (form.invalid) {
      this.funcionesService.swalError('Información incorrecta o incompleta');
    }else{

      let titulo: string = '';
      if (this.fromParent.opcion === '1' || this.fromParent.opcion === 1) {
        titulo = '¿Estas seguro de guardar el registro?';
      }else{
        titulo = '¿Estas seguro de modificar el registro?';
      }

      this.funcionesService.mensajeConfirmar(titulo, '', (resultado: any) => {
        if (resultado.isConfirmed) {

          this.progressBar = false;
          this.funcionesService.showLoading();

          let vfbModal = form.value;
          this.pagos.id = vfbModal.id;
          this.pagos.idPuntoVenta = vfbModal.idPuntoVenta == null ? '': vfbModal.idPuntoVenta;
          this.pagos.nombre = vfbModal.nombre == null ? '' : vfbModal.nombre;
          this.pagos.periodicidad = vfbModal.periodicidad == null ? '': vfbModal.periodicidad;
          this.pagos.tipo = vfbModal.tipo == null ? '': vfbModal.tipo;
          this.pagos.idBanco = vfbModal.idBanco == null ? '' : vfbModal.idBanco;
          this.pagos.idMoneda = vfbModal.idMoneda == null ? '': vfbModal.idMoneda;
          this.pagos.cantidad = vfbModal.cantidad == null ? '' : vfbModal.cantidad;
          this.pagos.monto = vfbModal.monto == null ? '' : vfbModal.monto;
          this.pagos.observaciones = vfbModal.observaciones == null ? '' : vfbModal.observaciones;
          this.pagos.status = vfbModal.status == null ? '' : vfbModal.status;
          this.pagos.opcion = this.fromParent.opcion;

          const lista: PagosRealizar[] = this.fromParent.lista;
          let count: number = 0;

          if(this.fromParent.opcion === '1'){
            lista.forEach(element => {
              if(element.nombre === this.pagos.nombre){
                count += 1;
              }
            });

          }else{

            lista.forEach(element => {
              if(element.nombre === this.pagos.nombre){
                if(element.id !== this.pagos.id){
                  count += 1;
                }
              }
            });
          }

          if (count === 0) {

            this.pagosrealizarService.crudPagosRealizar(this.pagos).subscribe((response: any) => {

              if (response.status === 200) {
                this.funcionesService.showSuccess(response.message);

                const oReturn: any = new Object();

                oReturn['modal'] = 'pagos';
                oReturn['value'] = 'loadAgain';

                this.activeModal.close(oReturn);
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
          }else{
            this.funcionesService.showError('Pago ya existe');
            this.funcionesService.hideLoading();
            this.progressBar = false;
          }
        }
      });
    }
  }
}
