import { Component, OnInit, Input } from '@angular/core';
import { RecibosService } from '../service/recibos.service';
import { FuncionesService } from '../../../../shared/services/funciones.service';
import { FormBuilder } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Recibos } from '../model/recibos';

@Component({
  selector: 'app-modalRecibosCorreoPerso',
  templateUrl: './modalRecibosCorreoPerso.component.html',
  providers: [RecibosService]
})
export class ModalRecibosCorreoPersoComponent implements OnInit {

  @Input() fromParent: any;

  recibos: Recibos = new Recibos(0, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '');

   // Progress Bar
  progressBar: boolean | any;

  nuevoCorreo: string | any = '';

  constructor(
    public service: RecibosService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal
  ) { }

  ngOnInit() {
    this.funcionesService.showLoading();
    this.progressBar = true;

    this.recibos = this.fromParent.recibos;

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  enviarCorreoPerso(){
    if(this.nuevoCorreo === ''){
      this.funcionesService.showError('Ingrese su correo');
      this.progressBar = false;
      this.funcionesService.hideLoading();
    }else{

      this.funcionesService.mensajeConfirmar('', '¿Desea enviar el correo?', (result: any) => {
        if(result.isConfirmed){
          this.funcionesService.showLoading();
          this.progressBar = true;

          this.recibos.correo = this.nuevoCorreo;
          this.service.enviarCorreo(this.recibos).subscribe((response: any) => {

            if (response.status === 200) {
              this.funcionesService.showSuccess(response.message);

              const oReturn: any = new Object();

              oReturn['modal'] = 'recibos';
              oReturn['value'] = 'loadAgain';

              this.activeModal.close(oReturn);
              this.progressBar = false;
              this.funcionesService.hideLoading();
              return;
            }else {
              this.funcionesService.showError(response.message);
              this.progressBar = false;
              this.funcionesService.hideLoading();
              return;
            }
          }, (err: any) => {
            console.log(err)
          });
        }
      });
    }

  }

}
