import { Component, Input, OnInit } from '@angular/core';
import { SeriesticketsService } from '../service/seriestickets.service';
import { PuntosventaService } from '../../puntosventa/service/puntosventa.service';
import { SeriesTickets } from '../models/seriesTickets';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PuntosVenta } from '../../puntosventa/model/puntosVenta';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-modalseriestickets',
  templateUrl: './modalseriestickets.component.html',
  providers: [SeriesticketsService, PuntosventaService],
})
export class ModalseriesticketsComponent implements OnInit {

  @Input() fromParent: any;
  seriesTickets: SeriesTickets = new SeriesTickets(0, '', '', '', true);
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  progressBar: boolean | any = false;

  // FormGroup
  formGroup: FormGroup | any;
  titulo: string = '';
  cboPuntoVentas: PuntosVenta[] = [];

  constructor(
    public puntosVentaService: PuntosventaService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private seriesticketsService: SeriesticketsService
  ) {
    this.new_seriesTickets();
  }

  new_seriesTickets() {
    this.formGroup = this.fb.group({
      id: 0,
      serie: ['', Validators.required],
      idPuntoVenta: [''],
      observaciones: [''],
      status: [true, Validators.required],
      puntoventa: ['']
    });
  }

  get getSeriesTickets() { return this.formGroup.controls; }

  ngOnInit() {
    this.funcionesService.showLoading();
    this.progressBar = true;

    const opc = this.fromParent.opcion;
    const array = this.fromParent.seriesTickets;
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.formGroup.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.formGroup.get('puntoventa').setValue(this.puntoVentas.nombre);

    this.cargarPuntosVenta();

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        serie: array.serie,
        idPuntoVenta: array.idPuntoVenta,
        observaciones: array.observaciones,
        status: array.status,
        puntoventa: array.puntoventa.nombre
      });

      this.selectEvent(array.puntoventa);

      this.titulo = 'Modificar Serie Tickets ' + array.serie;
    }else{
      this.titulo = 'Agregar Serie Tickets';
    }

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  cargarPuntosVenta(){
    this.puntosVentaService.cargarPuntosVenta().subscribe(response => {
      this.cboPuntoVentas = response.puntosVenta;
    });
  }

  selectEvent(event: PuntosVenta){
    this.formGroup.get('idPuntoVenta').setValue(event.id);
  }

  crudSeriesTickets(form: FormGroup){

    if (form.invalid) {
      this.funcionesService.swalError('Información incorrecta o incompleta');
    }else{
      if(form.value.idPuntoVenta === ''){
        this.funcionesService.showError('Seleccione el punto de Venta');
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
            this.seriesTickets.id = vFormGroup.id;
            this.seriesTickets.serie = vFormGroup.serie != null ? vFormGroup.serie: '';
            this.seriesTickets.idPuntoVenta = form.value.idPuntoVenta != null ? form.value.idPuntoVenta : '';
            this.seriesTickets.observaciones = vFormGroup.observaciones != null ? vFormGroup.observaciones: '';
            this.seriesTickets.status = vFormGroup.status != null ? vFormGroup.status : '';
            this.seriesTickets.opcion = this.fromParent.opcion;

            const lista: SeriesTickets[] = this.fromParent.lista;
            let count: number = 0;

            if(this.fromParent.opcion === '1' || this.fromParent.opcion === 1){

              lista.forEach(element => {
                if(element.serie === this.seriesTickets.serie){
                  count += 1;
                }
              });

            }else{

              lista.forEach(element => {
                if(element.serie === this.seriesTickets.serie){
                  if(element.id !== this.seriesTickets.id){
                    count += 1;
                  }
                }
              });
            }

            if (count === 0) {
              this.seriesticketsService.crudSeriesTickets(this.seriesTickets).subscribe((response: any) => {

                if (response.status === 200) {
                  this.funcionesService.showSuccess(response.message);

                  const oReturn: any = new Object();

                  oReturn['modal'] = 'seriesTickets';
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
            }else{
              this.funcionesService.showError('Serie ya existe');
              this.funcionesService.hideLoading();
              this.progressBar = false;
            }
          }
        });
      }
    }
  }
}
