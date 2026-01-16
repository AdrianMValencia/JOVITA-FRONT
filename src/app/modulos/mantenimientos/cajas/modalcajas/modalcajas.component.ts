import { Component, Input, OnInit } from '@angular/core';
import { Cajas } from '../models/cajas';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SeriesTickets } from '../../seriestickets/models/seriesTickets';
import { CajasService } from '../service/cajas.service';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SeriesticketsService } from '../../seriestickets/service/seriestickets.service';
import { PuntosVenta } from '../../puntosventa/model/puntosVenta';

@Component({
  selector: 'app-modalcajas',
  templateUrl: './modalcajas.component.html',
  providers: [CajasService, SeriesticketsService]
})
export class ModalcajasComponent implements OnInit {

  @Input() fromParent: any;
  cajas: Cajas = new Cajas(0, '', '', '', '', '', true);
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  progressBar: boolean | any = false;

  // FormGroup
  formGroup: FormGroup | any;
  titulo: string = '';
  cboSeriesTickets: SeriesTickets[] = [];

  constructor(
    public cajasService: CajasService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private seriesticketsService: SeriesticketsService
  ) {
    this.new_form();
  }

  new_form() {
    this.formGroup = this.fb.group({
      id: 0,
      idPuntoVenta: ['', [Validators.required]],
      puntoVenta: ['', [Validators.required]],
      idSerieTicket: [''],
      nombre: ['', [Validators.required]],
      observaciones: [''],
      status: [true, [Validators.required]],
      series: ['']
    });
  }

  get getNumeracionTickets() { return this.formGroup.controls; }

  ngOnInit() {
    this.funcionesService.showLoading();
    this.progressBar = true;

    const opc = this.fromParent.opcion;
    const array = this.fromParent.cajas;
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.formGroup.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.formGroup.get('puntoVenta').setValue(this.puntoVentas.nombre);

    this.cargarSeriesTickets();

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        idPuntoVenta: array.idPuntoVenta,
        puntoVenta: array.puntoVenta,
        idSerieTicket: array.idSerieTicket,
        nombre: array.nombre,
        observaciones: array.observaciones,
        status: array.status,
        series: array.series
      });

      this.selectEvent(array.series);

      this.titulo = 'Modificar Caja ' + array.nombre;
    }else{
      this.titulo = 'Agregar Caja';
    }

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  cargarSeriesTickets(){
    this.seriesticketsService.cargarSeriesTickets(this.puntoVentas.id).subscribe(response => {
      this.cboSeriesTickets = response.seriesTickets;
    });
  }

  selectEvent(event: SeriesTickets){
    this.formGroup.get('idSerieTicket').setValue(event.id);
  }

  crudRegistros(form: FormGroup){

    if (form.invalid) {
      this.funcionesService.swalError('Información incorrecta o incompleta');
    }else{
      if(form.value.idSerieTicket === ''){
        this.funcionesService.showError('Seleccione la Serie de Ticket');
      }else{

        let titulo: string = '';
        if (this.fromParent.opcion === '1' || this.fromParent.opcion === 1) {
          titulo = '¿Estas seguro de guardar el registro?';
        }else{
          titulo = '¿Estas seguro de modificar el registro?';
        }
        this.funcionesService.mensajeConfirmar(titulo, '', (resultado: any) => {
          if (resultado.isConfirmed) {

            this.progressBar = true;
            this.funcionesService.showLoading();

            let vFormGroup = form.value;
            this.cajas.id = vFormGroup.id;
            this.cajas.idPuntoVenta = vFormGroup.idPuntoVenta;
            this.cajas.puntoVenta = vFormGroup.puntoVenta;
            this.cajas.idSerieTicket = vFormGroup.idSerieTicket != null ? vFormGroup.idSerieTicket: '';
            this.cajas.nombre = form.value.nombre != null ? form.value.nombre : '';
            this.cajas.observaciones = vFormGroup.observaciones != null ? vFormGroup.observaciones: '';
            this.cajas.status = vFormGroup.status != null ? vFormGroup.status : '';
            this.cajas.opcion = this.fromParent.opcion;

            this.cajasService.crudCajas(this.cajas).subscribe((response: any) => {

              if (response.status === 200) {
                this.funcionesService.showSuccess(response.message);

                const oReturn: any = new Object();

                oReturn['modal'] = 'cajas';
                oReturn['value'] = 'loadAgain';

                this.activeModal.close(oReturn);
                this.progressBar = false;
                return;
              }
              else {
                this.funcionesService.showError(response.message);
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
