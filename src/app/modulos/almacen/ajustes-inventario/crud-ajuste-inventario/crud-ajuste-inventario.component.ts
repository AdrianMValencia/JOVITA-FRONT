import { Component, Input, OnInit } from '@angular/core';
import { AjusteInventario } from '../models/ajuste-inventario';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Productos } from '../../productos/model/productos';
import { AjustesInventarioService } from '../service/ajustes-inventario.service';
import { ProductosService } from '../../productos/service/Productos.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

@Component({
  selector: 'app-crud-ajuste-inventario',
  templateUrl: './crud-ajuste-inventario.component.html',
  styleUrls: ['./crud-ajuste-inventario.component.css']
})
export class CrudAjusteInventarioComponent implements OnInit {
  @Input() fromParent: any;

  ajustesInventario: AjusteInventario = new AjusteInventario(0, '', '', '', '', '', '', '', '');
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  progressBar: boolean | any;

  // FormGroup
  formGroup: FormGroup | any;

  //Combos
  cboProductos: Productos[] = [];
  titulo: string = '';

  constructor(
    public ajustesInventarioService: AjustesInventarioService,
    private productosService: ProductosService,
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
      puntoVenta: ['', [Validators.required]],
      codigo_barras: ['', [Validators.required]],
      idProducto: ['', [Validators.required]],
      nombreProducto: ['', [Validators.required]],
      motivo: [''],
      cantidad: [''],
      idCategoria: [''],
      categoria: [''],
      productos: ''
    });
  }

  get getModal() { return this.formGroup.controls; }

  ngOnInit() {
    this.funcionesService.showLoading();
    this.progressBar = true;

    const opc = this.fromParent.opcion;
    const array = this.fromParent.ajustesInventario;
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.formGroup.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.formGroup.get('puntoVenta').setValue(this.puntoVentas.nombre);

    this.cargarProductos();

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        codigo_barras: array.codigo_barras,
        idProducto: array.idProducto,
        nombreProducto: array.nombreProducto,
        motivo: array.motivo,
        cantidad: array.cantidad,
        idCategoria: array.idCategoria,
        categoria: array.categoria,
        productos: array.productos,
      });

      let productosLista: Productos[] = this.fromParent.productos;
      productosLista = productosLista.filter(x => x.codigoBarra === array.codigo_barras && parseInt(x.idPuntoVenta) === this.puntoVentas.id);
      this.selectEventProductos(productosLista[0]);
      this.titulo = 'Modificar Ajuste';
    }else{
      this.titulo = 'Agregar Ajuste';
    }

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  selectEventProductos(event: Productos){
    this.formGroup.get('productos').setValue(event);
    this.formGroup.get('idProducto').setValue(event.id);
    this.formGroup.get('codigo_barras').setValue(event.codigoBarra);
    this.formGroup.get('nombreProducto').setValue(event.nombre);
    this.formGroup.get('idCategoria').setValue(event.idCategoria);
    this.formGroup.get('categoria').setValue(event.nombreCategoria);
  }

  onEnter(event: any){
    if(event.value !== ''){
      let productosLista: Productos[] = this.fromParent.productos;
      productosLista = productosLista.filter(x => x.codigoBarra === event.value && parseInt(x.idPuntoVenta) === this.puntoVentas.id);
      if(productosLista.length > 0){
        this.selectEventProductos(productosLista[0]);
      }
    }
  }

  cargarProductos(){
    this.productosService.cargarProductosVentas(this.puntoVentas.id).subscribe(response => {
      this.cboProductos = response.productos;
    });
  }

  saveRegistro(form: FormGroup): any {

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

          let vfbModal = form.value;
          this.ajustesInventario.id = vfbModal.id;
          this.ajustesInventario.idPuntoVenta = vfbModal.idPuntoVenta !== null ? vfbModal.idPuntoVenta : null,
          this.ajustesInventario.puntoVenta = vfbModal.puntoVenta !== null ? vfbModal.puntoVenta : null,
          this.ajustesInventario.codigo_barras = vfbModal.codigo_barras !== null ? vfbModal.codigo_barras : null,
          this.ajustesInventario.idProducto = vfbModal.idProducto !== null ? vfbModal.idProducto : null,
          this.ajustesInventario.nombreProducto = vfbModal.nombreProducto !== null ? vfbModal.nombreProducto : null,
          this.ajustesInventario.motivo = vfbModal.motivo !== null ? vfbModal.motivo : '',
          this.ajustesInventario.cantidad = vfbModal.cantidad !== null ? vfbModal.cantidad : '',
          this.ajustesInventario.idCategoria = vfbModal.idCategoria !== null ? vfbModal.idCategoria : '',
          this.ajustesInventario.categoria = vfbModal.categoria !== null ? vfbModal.categoria : '',
          this.funcionesService.showLoading()
          this.progressBar = false;
          this.ajustesInventarioService.crudAjusteInventario(this.ajustesInventario).subscribe((response: any) => {

            if (response.status === 200) {
              this.funcionesService.showSuccess(response.message);

              const oReturn: any = new Object();

              oReturn['modal'] = 'ajustesInventario';
              oReturn['value'] = 'loadAgain';

              this.activeModal.close(oReturn);
              this.funcionesService.hideLoading();
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
        }
      });
    }
  }
}
