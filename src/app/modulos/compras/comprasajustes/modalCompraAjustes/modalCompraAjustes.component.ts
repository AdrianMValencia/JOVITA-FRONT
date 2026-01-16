import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { FuncionesService } from '../../../../shared/services/funciones.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CompraAjustes } from '../model/compraAjustes';
import { CompraAjustesService } from '../service/compraAjustes.service';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { ProductosService } from 'src/app/modulos/almacen/productos/service/Productos.service';
import { Productos } from 'src/app/modulos/almacen/productos/model/productos';
import { ComprasService } from '../../Ingresos/service/compras.service';
import { Compras } from '../../Ingresos/model/compras';

@Component({
  selector: 'app-modalCompraAjustes',
  templateUrl: './modalCompraAjustes.component.html',
  providers: [CompraAjustesService, ProductosService, ComprasService]
})
export class ModalCompraAjustesComponent implements OnInit {

  @Input() fromParent: any;

  productoAjustes: CompraAjustes = new CompraAjustes(0, '', '', '0', '', '', '', '', '', '', true, 1);
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  progressBar: boolean | any;

  // FormGroup
  formGroup: FormGroup | any;

  //Combos
  cboProducto: Productos[] = [];
  cboCompras: Compras[] = [];
  titulo: string = '';

  precioUnit_Rep: any;

  stockActual_RepAjus: number | any = 0;

  tipos: any[] = [
    {id: 1, name: 'INGRESO'},
    {id: 2, name: 'SALIDAS'},
  ];

  constructor(
    public productoAjustesService: CompraAjustesService,
    private productosService: ProductosService,
    private comprasService: ComprasService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal
  ) {
    this.new_Modal();
  }

  new_Modal() {
    this.formGroup = this.fb.group({
      id: 0,
      idCompra: ['', [Validators.required]],
      idPuntoVenta: ['', [Validators.required]],
      idProducto: ['', [Validators.required]],
      nombre: ['', [Validators.required]],
      stock: ['', [Validators.required]],
      stockAjuste: ['', [Validators.required]],
      cantidadAjuste: ['', [Validators.required, Validators.pattern(/^-?(0|[1-9]\d*)?$/)]],
      observaciones: [''],
      tipoAjuste: ['', [Validators.required]],
      status: [true],
      puntoventa: [''],
      productos: [''],
      compras: ['']
    });
  }

  get getModal() { return this.formGroup.controls; }

  ngOnInit() {
    const opc = this.fromParent.opcion;
    const array = this.fromParent.productoAjustes;
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.formGroup.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.formGroup.get('puntoventa').setValue(this.puntoVentas.nombre);

    this.cargarProducto();
    this.cargarCompras();

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        idCompra: array.idCompra,
        idProducto: array.idProducto,
        nombre: array.nombre,
        parte_Rep: array.parte_Rep,
        stock: array.stock,
        stockAjuste: array.stockAjuste,
        cantidadAjuste: array.cantidadAjuste,
        tipoAjuste: array.tipoAjuste,
        observaciones: array.observaciones,
        status: array.status,
        productos: array.productos,
        compras: array.compras
      });

      this.selectEvent(array.productos);
      this.titulo = 'Modificar Producto Ajuste ' + array.nombre;
    }else{
      this.titulo = 'Agregar Producto Ajuste';
    }
  }

  selectEvent(event: Productos){
    this.formGroup.get('idProducto').setValue(event.id);
    this.formGroup.get('nombre').setValue(event.nombre);
    this.formGroup.get('stock').setValue(parseFloat(event.stockActual).toFixed(2));
    this.formGroup.controls.cantidadAjuste.enable();
  }

  selectEventCompras(event: Compras){
    this.formGroup.get('idCompra').setValue(event.id);
    this.formGroup.controls.cantidadAjuste.enable();
  }

  saveRegistro(form: FormGroup): any {

    if (form.invalid) {
      this.funcionesService.swalError('Información incorrecta o incompleta');
    }else{

      if(parseFloat(this.formGroup.get('stockAjuste').value) < 0){
        this.funcionesService.showError('monto del nuevo stock inválido');
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
            this.productoAjustes.id = vfbModal.id;
            this.productoAjustes.idCompra = vfbModal.idCompra !== null ? vfbModal.idCompra : null,
            this.productoAjustes.idPuntoVenta = vfbModal.idPuntoVenta !== null ? vfbModal.idPuntoVenta : null,
            this.productoAjustes.idProducto = vfbModal.idProducto !== null ? vfbModal.idProducto : null,
            this.productoAjustes.nombre = vfbModal.nombre !== null ? vfbModal.nombre : null,
            this.productoAjustes.stock = vfbModal.stock !== null ? vfbModal.stock : null,
            this.productoAjustes.stockAjuste = vfbModal.stockAjuste !== null ? vfbModal.stockAjuste : null,
            this.productoAjustes.cantidadAjuste = vfbModal.cantidadAjuste !== null ? vfbModal.cantidadAjuste : null,
            this.productoAjustes.tipoAjuste = vfbModal.tipoAjuste !== null ? vfbModal.tipoAjuste : '',
            this.productoAjustes.observaciones = vfbModal.observaciones !== null ? vfbModal.observaciones : '',
            this.productoAjustes.status = vfbModal.status,
            this.productoAjustes.opcion = this.fromParent.opcion;

            const lista: Productos[] = this.fromParent.lista;
            let count: number = 0;

            if(this.productoAjustes.cantidadAjuste === '0'){
              this.funcionesService.showError('El Stock no puede ser 0');
            }else{

              this.funcionesService.showLoading()
              this.progressBar = false;
              this.productoAjustesService.crudProductoAjustes(this.productoAjustes).subscribe((response: any) => {

                if (response.status === 200) {
                  this.funcionesService.showSuccess(response.message);

                  const oReturn: any = new Object();

                  oReturn['modal'] = 'compraAjustes';
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
          }
        });
      }
    }
  }

  cargarProducto(){
    this.funcionesService.showLoading();
    this.productosService.cargarProductosVentas(this.puntoVentas.id).subscribe(response => {
      this.funcionesService.hideLoading();
      this.cboProducto = response.productos;
    });
  }

  cargarCompras(){
    this.comprasService.obtenerCompras(this.puntoVentas.id).subscribe(response => {
      this.cboCompras = response.compras;
    });
  }

  calcularTotales(event: any){
    if(event.target.value === ''){
      this.formGroup.get("stockAjuste").setValue(0);
    }else{
      if(parseInt(this.formGroup.get("tipoAjuste").value) === 1){
        this.formGroup.get("stockAjuste").setValue(parseInt(this.formGroup.get("stock").value) + (parseInt(event.target.value)));
      }else{
        this.formGroup.get("stockAjuste").setValue(parseInt(this.formGroup.get("stock").value) - (parseInt(event.target.value)));
      }

      if(parseInt(this.formGroup.get("stockAjuste").value) < 1){
        this.funcionesService.showError('El nuevo stock no puede ser 0 o menor al Stock del producto');
        this.formGroup.get("stockAjuste").setValue('');
        this.formGroup.get("cantidadAjuste").setValue('');
      }

      if(parseInt(this.formGroup.get("stockAjuste").value) > 1 && parseInt(this.formGroup.get("stockAjuste").value) <= 10){
        this.funcionesService.showError('Aumente el Stock del repuesto');
      }
    }
  }

  calcularTotalesSelect(event: any){
    if(this.formGroup.get("cantidadAjuste").value !== ''){
      if(parseInt(this.formGroup.get("tipoAjuste").value) === 1){
        this.formGroup.get("stockAjuste").setValue(parseInt(this.formGroup.get("stock").value) + (parseInt(this.formGroup.get("cantidadAjuste").value)));
      }else{
        this.formGroup.get("stockAjuste").setValue(parseInt(this.formGroup.get("stock").value) - (parseInt(this.formGroup.get("cantidadAjuste").value)));
      }

      this.formGroup.controls.cantidadAjuste.enable();
      if(parseInt(this.formGroup.get("stockAjuste").value) < 1){
        this.funcionesService.showError('El nuevo stock no puede ser 0 o menor al Stock del producto');
      }

      if(parseInt(this.formGroup.get("stockAjuste").value) > 1 && parseInt(this.formGroup.get("stockAjuste").value) <= 10){
        this.funcionesService.showError('Aumente el Stock del repuesto');
      }
    }
  }

}
