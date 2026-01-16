import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { UsuarioService } from '../service/usuario.service';
import { Usuarios } from '../models/Usurarios';
import { FuncionesService, MustMatch } from '../../../shared/services/funciones.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Roles } from '../models/Roles';
import { Ubigeo } from '../../mantenimientos/clientes/Model/ubigeo';
import { SubirArchivoService } from 'src/app/shared/subirArchivo/subir-archivo.service';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';

@Component({
  selector: 'app-modalUsuarios',
  templateUrl: './modalUsuarios.component.html',
  providers: [UsuarioService],
})
export class ModalUsuariosComponent implements OnInit {

  @Input() fromParent: any;

  usuarios: Usuarios = new Usuarios(0, '', '', '', '', '', '', '', '', '', '', true);
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  progressBar: boolean | any;

  // FormGroup
  formGroup: FormGroup | any;
  titulo: string = '';

  //COMBOS
  cboRoles: Roles[] = [];
  cboUbigeo: Ubigeo[] = [];

  type: string = 'password';
  type2: string = 'password';

  textoImagen: string = 'Seleccione una imágen';
  sinFoto:string = 'assets/img/sinFoto.png';
  imagenSubir: File | any = null;
  imagenTemp: any;

  constructor(
    public service: UsuarioService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private subirArchivo: SubirArchivoService
  ) {
    this.new_Modal();
  }

  new_Modal() {
    this.formGroup = this.fb.group({
      id: 0,
      idRol: ['', Validators.required],
      nombre: ['', Validators.required],
      usuario: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirmation: ['', [Validators.required, Validators.minLength(6)]],
      direccion: [''],
      telefono: ['', [Validators.maxLength(10)]],
      celular: ['', [Validators.maxLength(12)]],
      ciudad: [''],
      status: true,
      imagen: '',
      roles: '',
      idPuntoVenta: ['']
    }, {
      validator: MustMatch('password', 'password_confirmation')
    });
  }

  get getModal() { return this.formGroup.controls; }

  ngOnInit() {
    const opc = this.fromParent.opcion;
    const array = this.fromParent.usuarios;
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);

    this.cargarRoles();

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        idRol: array.idRol == null ? '': array.idRol,
        nombre: array.nombre == null ? '': array.nombre,
        usuario: array.usuario == null ? '': array.usuario,
        email: array.email == null ? '': array.email,
        password: array.password == null ? '': array.password,
        password_confirmation: array.password == null ? '': array.password,
        direccion: array.direccion == null ? '': array.direccion,
        telefono: array.telefono == null ? '': array.telefono,
        celular: array.celular == null ? '': array.celular,
        ciudad: array.ciudad == null ? '': array.ciudad,
        status: array.status == null ? 0: parseFloat(array.status),
        imagen: array.imagen == null ? '': array.imagen,
        roles: array.roles
      });
      this.imagenTemp = this.service.urlUpload + array.imagen;
      this.textoImagen = array.imagen;
      this.titulo = 'Modificar Usuario ' + array.nombre;
      this.selectEventRol(array.roles);
    }else{
      this.titulo = 'Agregar Usuario';
    }
  }

  selectEventRol(event: Roles){
    this.formGroup.get('idRol').setValue(event.id);
  }

  eliminarImagen(){
    this.imagenSubir = null;
    this.imagenTemp = null;
    this.textoImagen = 'Seleccione una imágen';
    this.formGroup.get("imagen").setValue('');
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
    this.formGroup.get("imagen").setValue(archivo.name);

    let reader = new FileReader();
    let urlImagenTemp = reader.readAsDataURL(archivo);
    reader.onloadend = ()=> this.imagenTemp = reader.result;
  }

  saveUsuarios(form: FormGroup): any {

    if(form.value.password.length < 6){
      this.funcionesService.showError('La contraseña debe tener mínimo 6 caracteres');
      return false;
    }

    if(form.value.password_confirmation.length < 6){
      this.funcionesService.showError('La contraseña debe tener mínimo 6 caracteres');
      return false;
    }

     if(form.value.password !== form.value.password_confirmation){
      this.funcionesService.showError('Las contraseñas no coinciden');
      return false;
     }

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

          let vformGroup = form.value;
          this.usuarios.id = vformGroup.id;
          this.usuarios.idRol = vformGroup.idRol == null ? '': vformGroup.idRol,
          this.usuarios.nombre = vformGroup.nombre == null ? '': vformGroup.nombre,
          this.usuarios.usuario = vformGroup.usuario == null ? '': vformGroup.usuario,
          this.usuarios.email = vformGroup.email == null ? '': vformGroup.email,
          this.usuarios.password = vformGroup.password == null ? '': vformGroup.password,
          this.usuarios.direccion = vformGroup.direccion == null ? '': vformGroup.direccion,
          this.usuarios.telefono = vformGroup.telefono == null ? '': vformGroup.telefono,
          this.usuarios.celular = vformGroup.celular == null ? '': vformGroup.celular,
          this.usuarios.ciudad = vformGroup.ciudad == null ? '': vformGroup.ciudad,
          this.usuarios.status = vformGroup.status == null ? '': vformGroup.status,
          this.usuarios.imagen = vformGroup.imagen == null ? '': vformGroup.imagen,
          this.usuarios.password_confirmation = vformGroup.password_confirmation == null ? '': vformGroup.password_confirmation,
          this.usuarios.opcion = this.fromParent.opcion;
          this.usuarios.idPuntoVenta = this.puntoVentas.id;

          const lista: Usuarios[] = this.fromParent.lista;
          let count: number = 0;

          if(this.fromParent.opcion === 1){

            lista.forEach(element => {
              if(element.nombre === this.usuarios.nombre && element.idRol === this.usuarios.idRol){
                count += 1;
              }
            });

          }else{

            lista.forEach(element => {
              if(element.nombre === this.usuarios.nombre && element.idRol === this.usuarios.idRol){
                if(element.id !== this.usuarios.id){
                  count += 1;
                }
              }
            });
          }

          if (count === 0) {
            this.funcionesService.showLoading();
            this.progressBar = true;
            this.service.crudUsuarios(this.usuarios).subscribe((response: any) => {

              if (response.status === 200) {

                if(this.imagenSubir !== null){
                  this.subirArchivo.subirArchivo(this.imagenSubir, 'usuario', response.usuarios.id).then(() => {
                    this.funcionesService.showSuccess(response.message);
                    const oReturn: any = new Object();
                    oReturn['modal'] = 'usuarios';
                    oReturn['value'] = 'loadAgain';
                    this.activeModal.close(oReturn);
                    this.funcionesService.hideLoading();
                    this.progressBar = false;
                  });
                }else{
                  this.funcionesService.showSuccess(response.message);
                  const oReturn: any = new Object();
                  oReturn['modal'] = 'usuarios';
                  oReturn['value'] = 'loadAgain';
                  this.activeModal.close(oReturn);
                  this.funcionesService.hideLoading();
                  this.progressBar = false;
                }
              }else {
                this.funcionesService.showError(response.message);
                this.funcionesService.hideLoading();
                this.progressBar = false;
                return;
              }
            }, (err: any) => {
              if(err.error){
                let error: any = JSON.parse(err.error);
                this.funcionesService.showError(error.usuario[0]);
              }
              this.funcionesService.hideLoading();
              this.progressBar = false;
            });
          }else{
            this.funcionesService.showError('Usuario ya existe');
            this.funcionesService.hideLoading();
            this.progressBar = false;
          }
        }
      });
    }

  }

  mostrar(cambio: number){
    if(cambio === 1){
      this.type = 'text';
    }else{
      this.type = 'password';
    }
  }

  mostrar2(cambio: number){
    if(cambio === 1){
      this.type2 = 'text';
    }else{
      this.type2= 'password';
    }
  }

  cargarRoles(){
    this.service.cargarRoles().subscribe(response => {
      this.cboRoles = response.roles;
    });
  }
}
