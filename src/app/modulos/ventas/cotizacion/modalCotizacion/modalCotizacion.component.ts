import { MatTableDataSource } from '@angular/material/table';
import { NgbActiveModal, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { FuncionesService } from './../../../../shared/services/funciones.service';
import { Clientes } from './../../../mantenimientos/clientes/Model/clientes';
import { Cotizacion } from './../model/cotizacion';
import { CotizacionService } from './../service/cotizacion.service';
import { ErrorStateMatcher } from '@angular/material/core';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Component, OnInit, Input, Type } from '@angular/core';
import { DetallesCotizacion } from '../model/detallesCotizacion';
import { ModalItemsComponent } from '../modal-items/modal-items.component';
import { ClientesService } from 'src/app/modulos/mantenimientos/clientes/Service/clientes.service';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';

// Modals
const MODALS: { [name: string]: Type<any> } = {
  items: ModalItemsComponent,
};


@Component({
  selector: 'app-modalCotizacion',
  templateUrl: './modalCotizacion.component.html',
  providers: [CotizacionService, ClientesService]
})
export class ModalCotizacionComponent implements OnInit {

  @Input() fromParent: any;

  pedidos: Cotizacion = new Cotizacion(0, '', '', '', '', '', '', '', '', '', '', '', '', '', '');
  clientes: Clientes = new Clientes();
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  pbModal: boolean | any;

  // FormGroup
  formGroup: FormGroup | any;
  titulo: string = '';

  //Combos
  cboClientes: Clientes[] = [];

  precioUnit_Rep: any;

  displayedColumns: string[] = ['descripcion', 'cantidad',  'precio', 'subtotal', 'descuento', 'igv', 'total', 'descuentoTotal',  'acciones'];
  dataSource: MatTableDataSource<DetallesCotizacion> = new MatTableDataSource<DetallesCotizacion>();
  items: DetallesCotizacion = new DetallesCotizacion(0, 0, '', '', '', '', '', '', '', '', '', '', '');
  opcion: number = 1;
  detalles: DetallesCotizacion[] = [];
  indexEliminar: number = 0;
  descuento: any = '';

  NgbModalOptions: NgbModalOptions = {
    size: 'xl',
    centered: true,
    scrollable: true,
    keyboard: false,
    backdrop: 'static',
    windowClass: 'modal-holder'
  };

  constructor(
    public cotizacionService: CotizacionService,
    private clientesService: ClientesService, 
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private _modalService: NgbModal
  ) {
    this.new_Modal();
  }

  new_Modal() {
    this.formGroup = this.fb.group({
      id: 0,
      idPuntoVenta: ['', [Validators.required]],
      puntoventa: ['', [Validators.required]],
      idCliente: ['', [Validators.required]],
      documento: ['', [Validators.required]],
      razonSocial: ['', [Validators.required]],
      fechaCotizacion: [this.funcionesService.generarFechaLocal(new Date()), [Validators.required]],
      numero: ['', [Validators.required]],
      subtotal: ['', [Validators.required, Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      total: ['', [Validators.required, Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      impuesto: ['', [Validators.required, Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      clientes: ''
    });
  }

  get getModal() { return this.formGroup.controls; }

  ngOnInit() {
    this.funcionesService.showLoading();
    this.pbModal = true;
    
    const opc = this.fromParent.opcion;
    const array = this.fromParent.cotizacion;
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.formGroup.get('idPuntoVenta').setValue(this.puntoVentas.id);
    this.formGroup.get('puntoventa').setValue(this.puntoVentas.nombre);
    
    this.cargarClientes();
    this.cargarCotizacion();

    // MODIFICAR
    if (opc === 2) {

      this.formGroup.patchValue({
        id: array.id,
        idPuntoVenta: parseInt(array.idPuntoVenta),
        puntoventa: array.puntoventa,
        idCliente: array.idCliente,
        documento: array.documento,
        razonSocial: array.razonSocial,
        fechaCotizacion: array.fechaCotizacion,
        numero: array.numero,
        subtotal: array.subtotal,
        impuesto : array.impuesto,
        total: array.total,
        status: array.status,
        clientes: array.clientes
      });

      this.selectEventClientes(array);

      if(array.detalles !== null){
        this.detalles = array.detalles;
        this.dataSource = new MatTableDataSource<DetallesCotizacion>(this.detalles);
      }

      this.titulo = 'Modificar Pedido ' + array.numero;

    }else{
      this.titulo = 'Generar Pedido';
    }

    this.funcionesService.hideLoading();
    this.pbModal = false;
  }

  saveCotizaicon(form: FormGroup) {

    if (form.invalid) {
      this.funcionesService.showError('Información incorrecta o incompleta');
    }else{

      this.funcionesService.mensajeConfirmar('', '¿Desea registrar este pedido?', (result: any) => {
        if(result.isConfirmed){

          let vfbModal = this.formGroup.value;
          this.pedidos.id = vfbModal.id;
          this.pedidos.idPuntoVenta = vfbModal.idPuntoVenta !== null ? vfbModal.idPuntoVenta: '',
          this.pedidos.puntoventa = vfbModal.puntoventa !== null ? vfbModal.puntoventa: '',
          this.pedidos.idCliente = vfbModal.idCliente !== null ? vfbModal.idCliente: '',
          this.pedidos.documento = this.formGroup.get("documento").value,
          this.pedidos.razonSocial = this.formGroup.get("razonSocial").value,
          this.pedidos.fechaCotizacion = vfbModal.fechaCotizacion !== null ? vfbModal.fechaCotizacion: '',
          this.pedidos.numero =  this.formGroup.get("numero").value,
          this.pedidos.subtotal = parseFloat(this.formGroup.get("subtotal").value),
          this.pedidos.impuesto = parseFloat(this.formGroup.get("impuesto").value),
          this.pedidos.total = parseFloat(this.formGroup.get("total").value),
          this.pedidos.status = 1,
          this.pedidos.opcion = this.fromParent.opcion,
      
          this.detalles.forEach(element => {
            element.idCotizacion = parseInt(this.fromParent.cotizacion.id);
            element.cantidad = parseInt(element.cantidad);
            element.subtotal = parseFloat(element.subtotal);
            element.precio = parseFloat(element.precio);
            element.igv = parseFloat(element.igv);
            element.total = parseFloat(element.total);
            element.porcentajeDesc = parseFloat(element.porcentajeDesc);
            element.montoDesc = parseFloat(element.montoDesc);
            element.status = 1;
          });
      
          this.pedidos.detalles = this.detalles;
      
          this.funcionesService.showLoading();
          this.pbModal = false;
          this.cotizacionService.crudCotizacion(this.pedidos).subscribe((response: any) => {
            if (response.status ==200) {
              this.funcionesService.showSuccess(response.message);
      
              const oReturn: any = new Object();
      
              oReturn['modal'] = 'cotizacion';
              oReturn['value'] = 'loadAgain';
      
              this.activeModal.close(oReturn);
              this.funcionesService.hideLoading();
              this.pbModal = false;
      
            }else {
              this.funcionesService.showError(response.message);
              this.funcionesService.hideLoading();
              this.pbModal = false;
            }
          }, (err: any) => {
            console.log(err);
            this.funcionesService.hideLoading();
            this.pbModal = false;
          });
        }
      });
    }
  }

  cargarClientes(){
    this.clientesService.cargarClientes().subscribe(response => {
      this.cboClientes = response.clientes;
      this.cboClientes = this.cboClientes.filter(x => parseInt(x.status) === 1).sort(this.funcionesService.orderBy('id'));

      this.cboClientes.forEach((element, index) => {
        if(index === 0){
          this.formGroup.get("clientes").setValue(element);
          this.selectEventClientes(element);
        }
      });
    });
  }

  cargarCotizacion(){
    let cotizacion: Cotizacion[] = [];
    this.cotizacionService.obtenerrCotizacion(this.puntoVentas.id).subscribe(response => {
      cotizacion = response.cotizacion;

      if(cotizacion.length === 0){
        this.formGroup.get("numero").setValue((1).toString().padStart(4, '0'));
      }else{
        this.formGroup.get("numero").setValue((cotizacion.length + 1).toString().padStart(4, '0'));
      }
    });
  }

  selectEventClientes(clientes: Clientes){
    this.formGroup.get("idCliente").setValue(clientes.id);
    this.formGroup.get("documento").setValue(clientes.numeroDoi);
    this.formGroup.get("razonSocial").setValue(clientes.nombre);
  }

  eliminarItem(index: number){

    this.funcionesService.showLoading();
    this.pbModal = true;

    this.funcionesService.mensajeConfirmar('', '¿Confirmar?', (result: any) => {
      if (result.isConfirmed) {
        this.detalles.splice(index, 1);

       this.dataSource = new MatTableDataSource<DetallesCotizacion>(this.detalles);

        let subtotalDet_Ven: any = 0;
        let total: any = 0;
        this.detalles.forEach(element => {
          subtotalDet_Ven += (parseFloat(element.cantidad) * (parseFloat(element.precio) / 1.18));
          total += parseFloat(element.precio) * parseFloat(element.cantidad);
        });

        this.formGroup.get("subtotal").setValue(parseFloat((subtotalDet_Ven).toFixed(2)));
        this.formGroup.get("impuesto").setValue(((parseFloat(total)) - (parseFloat(subtotalDet_Ven))).toFixed(2));
        this.formGroup.get("total").setValue(parseFloat(total).toFixed(2));

        this.funcionesService.hideLoading();
        this.pbModal = false;
      }
    });
  }

  agregarItem(){
    this.opcion = 1;
    this.openModal('items');
  }

  viewDetail(element: any, index: number) {
    this.opcion = 2;
    this.items = element;
    this.indexEliminar = index;
    this.openModal('items');
  }

  openModal(name: string) {

    const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
    const obj: any = new Object();

    switch (name) {
      case 'items':
        obj['opcion'] = this.opcion;
        obj['items'] = this.items;
        modalRef.componentInstance.fromParent = obj;
      break;
    }

    modalRef.result.then(async (result) => {

      switch (result.modal) {
        case 'items':
          this.funcionesService.showLoading();
          this.pbModal = true;
          if (result.value === 'loadAgain') {

            if(parseInt(result.opcion) === 1){
              this.detalles.push(result.items);
            }

            if(parseInt(result.opcion) === 2){
              this.detalles.forEach((element, index) => {
                if(index === this.indexEliminar){
                  element.id = result.items.id,
                  element.idCotizacion = this.fromParent.cotizacion.id;
                  element.idProducto = result.items.idProducto,
                  element.nombre = result.items.nombre,
                  element.precio = result.items.precio,
                  element.cantidad = result.items.cantidad,
                  element.subtotal = result.items.subtotal,
                  element.igv = result.items.igv,
                  element.total = result.items.total,
                  element.porcentajeDesc = result.items.porcentajeDesc,
                  element.montoDesc = result.items.montoDesc,
                  element.descripcion = result.items.descripcion,
                  element.porcentajeDesc = result.items.porcentajeDesc,
                  element.status = result.items.status
                }
              });
            }

            if(parseInt(result.opcion) === 3){
              this.detalles.splice(this.indexEliminar, 1);
            }

            this.dataSource = new MatTableDataSource<DetallesCotizacion>(this.detalles);         

            let subtotalDet_Ven: any = 0;
            let total: any = 0;
            this.detalles.forEach(element => {
              subtotalDet_Ven += parseFloat(element.subtotal);
              total += parseFloat(element.total);
            });

            this.formGroup.get("subtotal").setValue(parseFloat((subtotalDet_Ven).toFixed(2)));
            this.formGroup.get("impuesto").setValue(((parseFloat(total)) - (parseFloat(subtotalDet_Ven))).toFixed(2));
            this.formGroup.get("total").setValue(parseFloat(total).toFixed(2));
          }

          this.funcionesService.hideLoading();
          this.pbModal = false;
          break;
      }

    }, (reason) => { });
  }

  calcularTotalXProducto(target: any, detalle: DetallesCotizacion, i: number){
    this.descuento = target.value;
    let totalGravada_Ven: any = 0;
    let total_Ven: any = 0;

    let total: any = parseFloat(detalle.precio) * parseFloat(detalle.cantidad);
    if(this.descuento !== '' && this.descuento !== '0'){
      detalle.porcentajeDesc = ((parseFloat(total) * parseFloat(this.descuento))/100).toFixed(2);
    }else{
      detalle.porcentajeDesc = 0;
    }
    detalle.montoDesc = this.descuento;

    detalle.total = parseFloat(((parseFloat(detalle.cantidad) * (parseFloat(detalle.precio))) - parseFloat(detalle.porcentajeDesc)).toFixed(2));
    detalle.subtotal = parseFloat((detalle.total / 1.18).toFixed(2));
    detalle.igv = parseFloat(((detalle.total - detalle.subtotal)).toFixed(2));

    this.detalles.forEach((element, index) => {
      totalGravada_Ven += parseFloat(element.subtotal);
      total_Ven += parseFloat(element.total);
    });

    this.formGroup.get("subtotal").setValue(parseFloat(totalGravada_Ven).toFixed(2));
    this.formGroup.get("total").setValue(parseFloat(total_Ven).toFixed(2));
    this.formGroup.get("impuesto").setValue((parseFloat(total_Ven) - parseFloat(totalGravada_Ven)).toFixed(2));
  }

}
