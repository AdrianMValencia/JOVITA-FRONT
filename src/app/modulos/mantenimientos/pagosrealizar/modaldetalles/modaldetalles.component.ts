import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { User } from 'src/app/modulos/Seguridad/models/User';
import { UsuarioService } from 'src/app/modulos/Usuarios/service/usuario.service';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { Items } from 'src/app/shared/services/items/items';
import { ItemsService } from 'src/app/shared/services/items/items.service';

import { DetallesPagos } from '../models/detallesPagos';
import { PagosRealizar } from '../models/pagosrealizar';
import { PagosdetallesService } from '../service/pagosdetalles.service';

@Component({
  selector: 'app-modaldetalles',
  templateUrl: './modaldetalles.component.html',
  providers: [PagosdetallesService, ItemsService, UsuarioService]
})
export class ModaldetallesComponent implements OnInit {
  @Input() fromParent: any;

  pagos: PagosRealizar = new PagosRealizar(0, '', '', '0', '0', '0', '0', '', '', '', 1, true, '');
  detalles: DetallesPagos = new DetallesPagos(0, 0, '', '', '', '', '', true, '', 1, '', '');

  // Progress Bar
  progressBar: boolean | any;

  // FormGroup
  formGroup: FormGroup | any;
  titulo: string = '';

  cboTipo: Items[] = [];
  cboVendedores: User[] = [];

  constructor(
    public pagosrealizarService: PagosdetallesService,
    public itemsService: ItemsService,
    private usuarioService: UsuarioService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal
  ) {
    this.new_Modal();
  }

  new_Modal() {
    this.formGroup = this.fb.group({
      id: 0,
      idPagoRealizar: ['', [Validators.required]],
      fechaVencimiento: ['', [Validators.required]],
      cantidad: ['', [Validators.required, Validators.pattern(/^-?(0|[1-9]\d*)?$/)]],
      monto: ['', [Validators.required]],
      interes: [''],
      total: [''],
      status: [true],
      idUsuario:[''],
      idModalidad: ['']
    });
  }

  get getModal() { return this.formGroup.controls; }

  ngOnInit() {
    this.funcionesService.showLoading();
    this.progressBar = true;

    const opc = this.fromParent.opcion;
    const array = this.fromParent.detalles;
    this.pagos = this.fromParent.pagos;
    this.formGroup.get('idPagoRealizar').setValue(this.pagos.id);
    this.cargarVendedores();
    this.cargarTipo();

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        idPagoRealizar: parseInt(array.idPagoRealizar),
        fechaVencimiento: array.fechaVencimiento,
        cantidad: array.cantidad,
        monto: parseFloat(array.monto).toFixed(2),
        interes: array.interes,
        total: (parseFloat(array.cantidad) * parseFloat(array.monto)).toFixed(2),
        status: array.status,
        idUsuario: array.idUsuario,
        idModalidad: array.idModalidad
      });

      this.titulo = 'Modificar Pagos a Realizar Detalle ';
    }else{
      this.titulo = 'Agregar Pagos a Realizar Detalle';
    }
    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  getPagoPersonal(): boolean{
    if (this.pagos.nombre.trim().includes('PERSONAL') || this.pagos.nombre.trim().includes('personal')) {
      this.formGroup.get('idUsuario').setValidators([Validators.required]);
      this.formGroup.get('idModalidad').setValidators([Validators.required]);
      this.formGroup.get('idUsuario').updateValueAndValidity();
      this.formGroup.get('idModalidad').updateValueAndValidity();
      return true;
    }else{
      return false;
    }
  }

  cargarVendedores(){
    this.usuarioService.listarUsuarios().subscribe(response => {
      this.cboVendedores = response.usuarios;
      this.cboVendedores = this.cboVendedores.filter(x => parseInt(x.status) === 1);
    });
  }

  cargarTipo(){
    this.itemsService.cargarItems('modalidad').subscribe(response => {
      this.cboTipo = response.items;
    });
  }

  calcularCantidadTotal(target: any){
    if (target.value !== '') {
      let total: any = 0;
      total = (parseFloat(target.value) * parseFloat(this.formGroup.get('monto').value == '' ? 0 : this.formGroup.get('monto').value)).toFixed(2);
      this.formGroup.get('total').setValue(total);
    }
  }
  calcularMontoTotal(target: any){
    if (target.value !== '') {
      let total: any = 0;
      total = (parseFloat(target.value) * parseFloat(this.formGroup.get('cantidad').value == '' ? 0 : this.formGroup.get('cantidad').value)).toFixed(2);
      this.formGroup.get('total').setValue(total);
    }
  }

  // Devuelve la fecha mínima permitida (hoy) en formato yyyy-MM-dd
  getMinFechaVencimiento(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  saveRegistro(form: FormGroup) {

    if (form.invalid) {
      // Marcar todos los controles como touched para mostrar las validaciones
      Object.values(form.controls).forEach(control => {
        control.markAsTouched();
      });
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
          this.detalles.id = vfbModal.id;
          this.detalles.idPagoRealizar = vfbModal.idPagoRealizar == null ? '' : vfbModal.idPagoRealizar;
          this.detalles.fechaVencimiento = vfbModal.fechaVencimiento == null ? '' : vfbModal.fechaVencimiento;
          this.detalles.cantidad = vfbModal.cantidad == null ? '' : vfbModal.cantidad;
          this.detalles.monto = vfbModal.monto == null ? '' : vfbModal.monto;
          this.detalles.interes = vfbModal.interes == null ? '' : vfbModal.interes;
          this.detalles.total = vfbModal.total == null ? '': vfbModal.total;
          this.detalles.status = vfbModal.status == null ? '' : vfbModal.status;
          this.detalles.opcion = this.fromParent.opcion;
          this.detalles.idUsuario = vfbModal.idUsuario == null ? '' : vfbModal.idUsuario;
          this.detalles.idModalidad = vfbModal.idModalidad == null ? '' : vfbModal.idModalidad;

          this.pagosrealizarService.crudPagosRealizar(this.detalles).subscribe((response: any) => {

            if (response.status === 200) {
              this.funcionesService.showSuccess(response.message);

              const oReturn: any = new Object();

              oReturn['modal'] = 'detalles';
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
      });
    }
  }
}
