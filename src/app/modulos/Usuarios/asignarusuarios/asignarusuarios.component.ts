import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { PuntoventauserService } from '../service/puntoventauser.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PuntoVentasUser } from '../models/puntoVentasUser';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Usuarios } from '../models/Usurarios';
import { PuntosventaService } from '../../mantenimientos/puntosventa/service/puntosventa.service';

@Component({
  selector: 'app-asignarusuarios',
  templateUrl: './asignarusuarios.component.html',
  providers: [PuntoventauserService, PuntosventaService]
})
export class AsignarusuariosComponent implements OnInit {
  @Input() fromParent: any;

  // FormGroup
  formGroup: FormGroup | any;
  puntoVentaUser: PuntoVentasUser = new PuntoVentasUser(0, '0', '0');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();
  usuarios: Usuarios = new Usuarios();

  // Progress Bar
  progressBar: boolean = false;

  //COMBOS
  cboPuntoVenta: PuntosVenta[] = [];

  // PRINCIPAL
  MainDC: string[] = ['idPuntoVenta', 'idUser', 'acciones'];
  MainDS: MatTableDataSource<PuntoVentasUser> = new MatTableDataSource<PuntoVentasUser>();
  @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

  constructor(
    public puntoventauserService: PuntoventauserService,
    private puntosventaService: PuntosventaService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal
  ){
    this.new_fgMain();
  }

  new_fgMain(){
    this.formGroup = this.fb.group({
      id: 0,
      idPuntoVenta: ['', Validators.required],
      idUser: ['', Validators.required],
      puntoventa: ['']
    });
  }

  get getMain() { return this.formGroup.controls; }


  ngOnInit(): void {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.usuarios = this.fromParent.usuarios;
    // this.formGroup.get('puntoventa').setValue(this.puntoVentas.nombre);
    this.cargarPuntoVenta();
    this.loadMain();

    this.formGroup.patchValue({
      idUser: this.usuarios.id == null ? '': this.usuarios.id
    });
  }

  selectEventPuntoVenta(event: PuntosVenta){
    this.formGroup.get('idPuntoVenta').setValue(event.id);
  }

  cargarPuntoVenta(){
    this.puntosventaService.cargarPuntosVenta().subscribe(response => {
      this.cboPuntoVenta = response.puntosVenta;
    });
  }

  loadMain() {
    this.funcionesService.showLoading();
    this.progressBar = true;
    this.puntoventauserService.obtenerPuntoVentaUser(this.usuarios.id).subscribe(response => {

      this.MainDS = new MatTableDataSource<Usuarios>(response.puntoventauser);
      this.MainDS.paginator = this.pagMain;
      this.funcionesService.hideLoading();
      this.progressBar = false;

    }, error => {
      console.log(error);
      this.funcionesService.hideLoading();
      this.progressBar = false;
    });
  }

  viewDetail(element: any) {
    this.formGroup.patchValue({
      id: element.id,
      idPuntoVenta: element.idPuntoVenta == null ? '': element.idPuntoVenta,
      idUser: element.idUser == null ? '': element.idUser,
      puntoventa: element.puntoventa == null ? '': element.puntoventa
    });
    this.selectEventPuntoVenta(element.puntoventa);
  }

  crudRegistros(){
    if (this.formGroup.invalid) {
      this.funcionesService.swalError('Información incorrecta o incompleta');
    }else{
      let titulo: string = '';
      if (parseInt(this.formGroup.get('id').value) === 0) {
        titulo = '¿Estas seguro de guardar el registro?';
      }else{
        titulo = '¿Estas seguro de modificar el registro?';
      }

      this.funcionesService.mensajeConfirmar(titulo, '', (resultado: any) => {
        if (resultado.isConfirmed) {
          let vformGroup = this.formGroup.value;
          this.puntoVentaUser.id = vformGroup.id;
          this.puntoVentaUser.idPuntoVenta = vformGroup.idPuntoVenta == null ? '': vformGroup.idPuntoVenta,
          this.puntoVentaUser.idUser = vformGroup.idUser == null ? '': vformGroup.idUser

          this.funcionesService.showLoading();
          this.progressBar = true;
          this.puntoventauserService.crudPuntoVentaUser(this.puntoVentaUser).subscribe((response: any) => {
            if (response.status === 200) {
              this.funcionesService.showSuccess(response.message);
              this.loadMain();
              this.funcionesService.hideLoading();
              this.progressBar = false;
            }else{
              this.funcionesService.showError(response.message);
              this.funcionesService.hideLoading();
              this.progressBar = false;
            }
          });
        }
      });
    }
  }

  eliminarRegistro(element: Usuarios){
    this.funcionesService.mensajeConfirmar('¿Desea eliminar este registro?', '', (result: any) => {
      if (result.isConfirmed) {
        this.puntoventauserService.deletePuntoVentaUser(element).subscribe(response => {
          this.funcionesService.showLoading();
          if (response.status === 200) {
            this.pagMain = true;
            this.funcionesService.showSuccess(response.message);
            this.loadMain();
            this.funcionesService.hideLoading();
            this.pagMain = false;
          }
          else {
            this.funcionesService.showError(response.message);
            this.funcionesService.hideLoading();
            this.pagMain = false;
            return;
          }
        }, (err: any) => {
          console.log(err);
          this.funcionesService.hideLoading();
            this.pagMain = false;
        });
      }
    });
  }

}
