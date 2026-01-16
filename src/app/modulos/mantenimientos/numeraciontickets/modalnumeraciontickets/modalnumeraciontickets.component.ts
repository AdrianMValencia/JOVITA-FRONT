import { Component, Input, OnInit } from '@angular/core';
import { SeriesticketsService } from '../../seriestickets/service/seriestickets.service';
import { NumeracionticketsService } from '../service/numeraciontickets.service';
import { NumeracionTickets } from '../models/numeracionTickets';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SeriesTickets } from '../../seriestickets/models/seriesTickets';
import { PuntosVenta } from '../../puntosventa/model/puntosVenta';

@Component({
  selector: 'app-modalnumeraciontickets',
  templateUrl: './modalnumeraciontickets.component.html',
  providers: [NumeracionticketsService, SeriesticketsService]
})
export class ModalnumeracionticketsComponent implements OnInit {

  @Input() fromParent: any;
  numeracionTickets: NumeracionTickets = new NumeracionTickets(0, '', '', '', '', '', true);
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  progressBar: boolean | any = false;

  // FormGroup
  formGroup: FormGroup | any;
  titulo: string = '';
  cboSeriesTickets: SeriesTickets[] = [];

  constructor(
    public numeracionTicketsService: NumeracionticketsService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private seriesticketsService: SeriesticketsService
  ) {
    this.new_cajas();
  }

  new_cajas() {
    this.formGroup = this.fb.group({
      id: 0,
      idSeriesTickets: [''],
      numeroInicio: ['', Validators.required],
      numeroFin: ['', Validators.required],
      numeroActual: ['', Validators.required],
      observaciones: [''],
      status: [true, Validators.required],
      series: ['']
    });
  }

  get getNumeracionTickets() { return this.formGroup.controls; }

  ngOnInit() {
    this.funcionesService.showLoading();
    this.progressBar = true;

    const opc = this.fromParent.opcion;
    const array = this.fromParent.numeracionTickets;
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);

    this.cargarSeriesTickets();

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        idSeriesTickets: array.idSeriesTickets,
        numeroInicio: array.numeroInicio,
        numeroFin: array.numeroFin,
        numeroActual: array.numeroActual,
        observaciones: array.observaciones,
        status: array.status,
        series: array.series
      });

      this.selectEvent(array.series);

      this.titulo = 'Modificar Numeración de Tickets';
    }else{
      this.titulo = 'Agregar Numeración de Tickets';
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
    this.formGroup.get('idSeriesTickets').setValue(event.id);
  }

  crudNumeracionTickets(form: FormGroup){

    if (form.invalid) {
      this.funcionesService.swalError('Información incorrecta o incompleta');
    }else{
      if(form.value.idSeriesTickets === ''){
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
            this.numeracionTickets.id = vFormGroup.id;
            this.numeracionTickets.idSeriesTickets = vFormGroup.idSeriesTickets != null ? vFormGroup.idSeriesTickets: '';
            this.numeracionTickets.numeroInicio = form.value.numeroInicio != null ? form.value.numeroInicio : '';
            this.numeracionTickets.numeroFin = form.value.numeroFin != null ? form.value.numeroFin : '';
            this.numeracionTickets.numeroActual = form.value.numeroActual != null ? form.value.numeroActual : '';
            this.numeracionTickets.observaciones = vFormGroup.observaciones != null ? vFormGroup.observaciones: '';
            this.numeracionTickets.status = vFormGroup.status != null ? vFormGroup.status : '';
            this.numeracionTickets.opcion = this.fromParent.opcion;

            this.numeracionTicketsService.crudNumeracionTickets(this.numeracionTickets).subscribe((response: any) => {

              if (response.status === 200) {
                this.funcionesService.showSuccess(response.message);

                const oReturn: any = new Object();

                oReturn['modal'] = 'numeracionTickets';
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
