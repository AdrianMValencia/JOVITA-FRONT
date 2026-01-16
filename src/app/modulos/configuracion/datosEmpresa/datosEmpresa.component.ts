import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { DatosEmpresaService } from './service/datosEmpresa.service';
import { DatosEmpresa } from './model/datosEmpresa';
import { FuncionesService } from '../../../shared/services/funciones.service';
import { SubirArchivoService } from '../../../shared/subirArchivo/subir-archivo.service';
declare var jQuery: any;
export class MyErrorStateMatcher implements ErrorStateMatcher  {
  isErrorState(control: FormControl | null): boolean {
    return !!(control && control.invalid);
  }
}

@Component({
  selector: 'app-datosEmpresa',
  templateUrl: './datosEmpresa.component.html',
  providers: [DatosEmpresaService]
})
export class DatosEmpresaComponent implements OnInit {

  datosEmpresa: DatosEmpresa = new DatosEmpresa(0, '', '', '', '', '', '', '', '', '', '', '', '');

  // FormGroup
  fgDatosEmpresa: FormGroup | any;
  textoImagen: string = 'Seleccione una imágen';
  sinFoto:string = 'assets/img/sinFoto.png';
  imagenSubir: File | any = null;
  imagenTemp: any;

  constructor(
    public datosEmpresaService: DatosEmpresaService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    private subirArchivo: SubirArchivoService
  ) {
    this.new_DatosEmpresa();
  }

  new_DatosEmpresa() {
    this.fgDatosEmpresa = this.fb.group({
      id: 0,
      ruc: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11), Validators.pattern(/^-?(0|[1-9]\d*)?$/)]],
      nombreLegal: ['', [Validators.required]],
      nombreComercial: ['', [Validators.required]],
      logo: [''],
      telefonos: [''],
      correoEmpresa: ['', [Validators.required, Validators.email]],
      direccion: [''],
      pagina: [''],
      cuentasBancarias: [''],
      nombreBanco: [''],
      codigoInterbancario: ['']
    });
  }

  get getModal() { return this.fgDatosEmpresa.controls; }

  ngOnInit() {
    this.obtenerDatosEmpresa();
  }

  subirFoto(){
    this.funcionesService.mensajeConfirmar('¿ Estas seguro de subir su foto?', '', () => {
      (function ($) {
        $("#uploadFile").click();
      })(jQuery);
    });
  }

  saveDatosEmpresa(form: FormGroup) {
    if (form.invalid) {
      this.funcionesService.swalError('No se puede guardar, información incorrecta o incompleta');
    }else{

      let titulo: string = '';

      if(this.datosEmpresa.id === 0){
        titulo = '¿Estas seguro de guardar los datos de la empresa?'
      }else{
        titulo = '¿Estas seguro de editar los datos de la empresa?';
      }

      this.funcionesService.mensajeConfirmar(titulo, '', () => {

        this.funcionesService.showLoading();
        let vfbModal = form.value;
        this.datosEmpresa.id = vfbModal.id == null ? 0: vfbModal.id;
        this.datosEmpresa.ruc = vfbModal.ruc == null ? '': vfbModal.ruc;
        this.datosEmpresa.nombreLegal = this.fgDatosEmpresa.get('nombreLegal').value == null ? '': this.fgDatosEmpresa.get('nombreLegal').value;
        this.datosEmpresa.nombreComercial = this.fgDatosEmpresa.get('nombreComercial').value == null ? '': this.fgDatosEmpresa.get('nombreComercial').value;
        this.datosEmpresa.logo = vfbModal.logo == null ? '': vfbModal.logo;
        this.datosEmpresa.telefonos = vfbModal.telefonos == null ? '': vfbModal.telefonos;
        this.datosEmpresa.correoEmpresa = vfbModal.correoEmpresa == null ? '' : vfbModal.correoEmpresa;
        this.datosEmpresa.direccion = vfbModal.direccion == null ? '' : vfbModal.direccion;
        this.datosEmpresa.pagina = vfbModal.pagina == null ? '' : vfbModal.pagina;
        this.datosEmpresa.cuentasBancarias = vfbModal.cuentasBancarias == null ? '' : vfbModal.cuentasBancarias;
        this.datosEmpresa.nombreBanco = vfbModal.nombreBanco == null ? '' : vfbModal.nombreBanco;
        this.datosEmpresa.codigoInterbancario = vfbModal.codigoInterbancario == null ? '' : vfbModal.codigoInterbancario;

        this.datosEmpresaService.crudDatosEmpresa(this.datosEmpresa).subscribe((response: any) => {

          if (response.status === 200) {

            if(this.imagenSubir !== null){
              this.subirArchivo.subirArchivo(this.imagenSubir, 'clientes', response.clientes.id).then(() => {
                this.funcionesService.hideLoading();
              });
            }

            this.funcionesService.showSuccess(response.message);
            this.funcionesService.hideLoading();

            this.datosEmpresa = response.datosEmpresa;
            this.fgDatosEmpresa.patchValue({
              id: response.datosEmpresa.id,
              ruc: response.datosEmpresa.ruc,
              nombreLegal: response.datosEmpresa.nombreLegal,
              nombreComercial: response.datosEmpresa.nombreComercial,
              logo: response.datosEmpresa.logo,
              telefonos: response.datosEmpresa.telefonos,
              correoEmpresa: response.datosEmpresa.correoEmpresa,
              direccion: response.datosEmpresa.direccion,
              pagina: response.datosEmpresa.pagina,
              cuentasBancarias: response.datosEmpresa.cuentasBancarias,
              nombreBanco: response.datosEmpresa.nombreBanco,
              codigoInterbancario: response.datosEmpresa.codigoInterbancario
            });
          }
          else {
            this.funcionesService.showError(response.message);
            this.funcionesService.hideLoading();
          }
        }, (err: any) => {
          console.log(err)
        });
      });
    }
  }

  obtenerDatosEmpresa(){
    this.datosEmpresaService.obtenerDatosEmpresa(1).subscribe(response => {
      if(response.status === 200){
        this.datosEmpresa = response.datosEmpresa;

        this.fgDatosEmpresa.patchValue({
          id: this.datosEmpresa.id,
          ruc: this.datosEmpresa.ruc,
          nombreLegal: this.datosEmpresa.nombreLegal,
          nombreComercial: this.datosEmpresa.nombreComercial,
          logo: this.datosEmpresa.logo,
          telefonos: this.datosEmpresa.telefonos,
          correoEmpresa: this.datosEmpresa.correoEmpresa,
          direccion: this.datosEmpresa.direccion,
          pagina: this.datosEmpresa.pagina,
          cuentasBancarias: this.datosEmpresa.cuentasBancarias,
          nombreBanco: this.datosEmpresa.nombreBanco,
          codigoInterbancario: this.datosEmpresa.codigoInterbancario
        });
      }
    }, error => {
      if(error.error.status === 400){
        this.datosEmpresa = new DatosEmpresa(0, '', '', '', '', '', '', '', '', '', '', '', '');
        this.fgDatosEmpresa.reset();
      }
    });
  }

  eliminarImagen(){
    this.imagenSubir = null;
    this.imagenTemp = null;
    this.textoImagen = 'Seleccione una imágen';
    this.fgDatosEmpresa.get("logo").setValue('');
  }

  public seleccionImagen(event: any){
    let archivo = event.target.files[0];

    if (!archivo) {
      this.imagenSubir = null;
      return;
    }

    if (archivo.type.indexOf('image')) {
      this.funcionesService.showError('El archivo seleccionado no es una imágen.');
      this.imagenSubir = null;
      return;
    }

    this.imagenSubir = archivo;
    this.textoImagen = archivo.name;
    this.fgDatosEmpresa.get("logo").setValue(archivo.name);

    let reader = new FileReader();
    let urlImagenTemp = reader.readAsDataURL(archivo);
    reader.onloadend = ()=> this.imagenTemp = reader.result;
  }
}
