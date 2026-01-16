import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CategoriasService } from '../service/categorias.service';
import { Categorias } from '../model/categorias';
import { FuncionesService } from '../../../../shared/services/funciones.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';

@Component({
  selector: 'app-modalCategorias',
  templateUrl: './modalCategorias.component.html',
  providers: [CategoriasService]
})
export class ModalCategoriasComponent implements OnInit {

  @Input() fromParent: any;

  categorias: Categorias = new Categorias(0, '', '', '', true, 1, '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  progressBar: boolean | any;

  // FormGroup
  formGroup: FormGroup | any;
  titulo: string = '';

  constructor(
    public CategoriasService: CategoriasService,
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
      observaciones: [''],
      status: [true],
      puntoventa: ['']
    });
  }

  get getModal() { return this.formGroup.controls; }

  ngOnInit() {
    this.funcionesService.showLoading();
    this.progressBar = true;

    const opc = this.fromParent.opcion;
    const array = this.fromParent.categorias;

    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.formGroup.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.formGroup.get('puntoventa').setValue(this.puntoVentas.nombre);

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        idPuntoVenta: parseInt(array.idPuntoVenta),
        nombre: array.nombre,
        observaciones: array.observaciones,
        status: array.status
      });
      this.titulo = 'Modificar Categoria ' + array.moneda;
    }else{
      this.titulo = 'Agregar Categoria';
    }

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }


  saveCategorias(form: FormGroup) {

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

          let vfbModal = this.formGroup.value;
          this.categorias.id = vfbModal.id;
          this.categorias.idPuntoVenta = vfbModal.idPuntoVenta == null ? '': vfbModal.idPuntoVenta;
          this.categorias.nombre = vfbModal.nombre == null ? '': vfbModal.nombre;
          this.categorias.observaciones = vfbModal.observaciones == null ? '' : vfbModal.observaciones;
          this.categorias.status = vfbModal.status == null ? '' : vfbModal.status;
          this.categorias.opcion = this.fromParent.opcion;

          const lista: Categorias[] = this.fromParent.lista;
          let count: number = 0;

          if(this.fromParent.opcion === '1'){
            lista.forEach(element => {
              if(element.nombre === this.categorias.nombre){
                count += 1;
              }
            });

          }else{

            lista.forEach(element => {
              if(element.nombre === this.categorias.nombre){
                if(element.id !== this.categorias.id){
                  count += 1;
                }
              }
            });
          }

          if (count === 0) {

            this.CategoriasService.crudCategorias(this.categorias).subscribe((response: any) => {

              if (response.status === 200) {
                this.funcionesService.showSuccess(response.message);

                const oReturn: any = new Object();

                oReturn['modal'] = 'categorias';
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
            this.funcionesService.showError('Categoria ya existe');
            this.funcionesService.hideLoading();
            this.progressBar = false;
          }
        }
      });
    }
  }

  async delay(ms: number) {
    await new Promise<void>(resolve => setTimeout(() => resolve(), ms)).then();
  }
}
