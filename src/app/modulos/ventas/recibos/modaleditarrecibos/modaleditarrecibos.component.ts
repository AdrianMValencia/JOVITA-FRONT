import { Component, Input, OnInit, Type } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';

import { NgbModalOptions, NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { User } from 'src/app/modulos/Seguridad/models/User';
import { Productos } from 'src/app/modulos/almacen/productos/model/productos';
import { ProductosService } from 'src/app/modulos/almacen/productos/service/Productos.service';
import { ModalClientesComponent } from 'src/app/modulos/mantenimientos/clientes/ModalClientes/ModalClientes.component';
import { Clientes } from 'src/app/modulos/mantenimientos/clientes/Model/clientes';
import { Monedas } from 'src/app/modulos/mantenimientos/monedas/model/monedas';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { SeriesTickets } from 'src/app/modulos/mantenimientos/seriestickets/models/seriesTickets';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

import { ModalRecibosItemsComponent } from '../modalRecibosItems/modalRecibosItems.component';
import { ModalRecibosMedioPagosComponent } from '../modalRecibosMedioPagos/modalRecibosMedioPagos.component';
import { ModalconvertirkilosComponent } from '../modalconvertirkilos/modalconvertirkilos.component';
import { Recibos } from '../model/recibos';
import { RecibosDetalles } from '../model/recibosDetalles';
import { RecibosService } from '../service/recibos.service';
import {
  asignarMontosDetalle,
  distribuirTotalLineaEnSubtotalIgv,
  recalcularTotalesCabeceraDesdeDetalles
} from '../utils/recibos-afectacion-igv.util';
declare var $: any;
declare var document: any;

// Modals
const MODALS: { [name: string]: Type<any> } = {
  clientes: ModalClientesComponent,
  items: ModalRecibosItemsComponent,
  medioPago: ModalRecibosMedioPagosComponent,
  kilos: ModalconvertirkilosComponent
};

@Component({
  selector: 'app-modaleditarrecibos',
  templateUrl: './modaleditarrecibos.component.html',
  providers: [ RecibosService, ProductosService] ,
})
export class ModaleditarrecibosComponent implements OnInit {

  @Input() fromParent: any;
  displayedColumns: string[] = ['codigo', 'descripcion', 'afectacion', 'subtotal', 'cantidad', 'total', 'existencia', 'acciones'];
  dataSource: MatTableDataSource<RecibosDetalles> = new MatTableDataSource<RecibosDetalles>();
  items: RecibosDetalles = new RecibosDetalles(0, '', '', '', 1, '', 0.18, '', 1);
  opcion: number = 1;
  detalles: RecibosDetalles[] = [];
  indexEliminar: number = 0;

  usuarioStorage: string | any = localStorage.getItem('usuario');
  usuario: User = JSON.parse(this.usuarioStorage);

  recibos: Recibos = new Recibos(0, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', true, '', '');
  productos: Productos = new Productos(0, '', '0', '', '0', '', '', '', '', '', '', true, 1, '', '', false);
  productosLista: Productos[] = [];
  clientes: Clientes = new Clientes();
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = JSON.parse(this.puntoVentaStorage);

  // Progress Bar
  progressBar: boolean | any;

  // FormGroup
  formGroup: FormGroup | any;
  selectedRowIndex: any;
  cantidad: any = 0.000;

  //Combos
  cboMonedas: Monedas[] = [];
  cboClientes: Clientes[] = [];
  cboSeries: SeriesTickets[] = [];
  cboVendedores: User[] = [];

  NgbModalOptions: NgbModalOptions = {
    size: 'lg',
    centered: true,
    scrollable: true,
    keyboard: false,
    backdrop: 'static',
    windowClass: 'modal-holder'
  };

  constructor(
    public recibosService: RecibosService,
    private productosService: ProductosService,
    public funcionesService: FuncionesService,
    private fb: FormBuilder,
    private _modalService: NgbModal,
    public activeModal: NgbActiveModal
  ) {
    this.new_Modal();
  }

  new_Modal() {
    this.formGroup = this.fb.group({
      id: 0,
      idPuntoVenta: [this.puntoVentas.id, [Validators.required]],
      puntoventa: [this.puntoVentas.nombre, [Validators.required]],
      fechaEmision: [ this.funcionesService.generarFechaLocal3(new Date()), [Validators.required]],
      porcentajeDesc: ['', [Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      montoDesc: ['', [Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      totalGravada: ['', [Validators.required, Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      totalIgv: ['', [Validators.required, Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      otrosCargo: ['', [Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      total: ['', [Validators.required, Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)]],
      pagado: '',
      vuelto: '',
      status: [true]
    });
  }

  get getModal() { return this.formGroup.controls; }

  ngOnInit() {
    $("#codigoBarra").focus();
    this.cargarProductos();

    document.addEventListener("keydown", (event: any) =>{
      if (event.code === "F4")
      {
          event.preventDefault();
          this.emitirRecibos();
      }
      if (event.code === "F7")
      {
          event.preventDefault();
          this.agregarItem();
      }
      if (event.code === "F6")
      {
          event.preventDefault();
          this.calcularMayoreo();
      }
    });
  }

  cargarProductos(){
    this.funcionesService.showLoading();
    let total: any = '0';
    this.productosService.cargarProductosVentas(this.puntoVentas.id).subscribe(response => {
      this.productosLista = response.productos;
      if(this.productosLista.length > 0){

        this.recibos = this.fromParent.recibos;
        this.detalles = this.recibos.detalles;

        if(this.detalles.length > 0){
          this.detalles.forEach(element => {
            let productos: Productos = this.productosLista.filter(x => parseInt(x.id) === parseInt(element.idProducto))[0];

            element.cantidad = parseFloat(String(element.cantidad)).toFixed(2);
            element.existencia = (parseFloat(String(productos.stockActual)) - parseFloat(String(element.cantidad))).toFixed(2);
            const sn = (element as any).codigo_afectacion_igv;
            if (sn && !element.codigoAfectacionIgv) {
              element.codigoAfectacionIgv = String(sn);
            }
            total = parseFloat(String(total)) + parseFloat(String(element.total));
          });
          this.formGroup.get('total').setValue((total).toFixed(2));
          this.dataSource = new MatTableDataSource<RecibosDetalles>(this.detalles);
          this.refrescarTotalesCabecera();
        }
      }

      this.funcionesService.hideLoading();
    });
  }

  highlight(row: any, event?: MouseEvent) {
    const target = event?.target as HTMLElement | undefined;
    if (target?.closest('select, input, button, textarea, a, label')) {
      return;
    }
    const codigoBarra = typeof row === 'string' ? row : row?.codigoBarra;
    if (!codigoBarra) {
      return;
    }
    this.selectedRowIndex = codigoBarra;
    $("#cantidad-" + codigoBarra).focus();
  }

  private productoPorDetalle(detalle: RecibosDetalles): Productos | undefined {
    return this.productosLista.find(
      (p) =>
        parseInt(String(p.id), 10) === parseInt(String(detalle.idProducto), 10) &&
        parseInt(String(p.idPuntoVenta), 10) === this.puntoVentas.id
    );
  }

  private refrescarTotalesCabecera(): void {
    const pctRaw = this.formGroup.get('porcentajeDesc')?.value;
    const pct =
      pctRaw !== '' && pctRaw != null && String(pctRaw) !== '0'
        ? parseFloat(String(pctRaw))
        : NaN;
    const opciones = !isNaN(pct) && pct ? { porcentajeDescGlobal: pct } : undefined;
    const t = recalcularTotalesCabeceraDesdeDetalles(
      this.detalles,
      (d) => this.productoPorDetalle(d),
      opciones
    );
    this.formGroup.get('totalGravada').setValue(t.totalGravada);
    this.formGroup.get('totalIgv').setValue(t.totalIgv);
    this.formGroup.get('total').setValue(t.total);
    if (t.montoDesc !== undefined) {
      this.formGroup.get('montoDesc').setValue(t.montoDesc);
    } else if (!opciones) {
      this.formGroup.get('montoDesc').setValue('0.00');
    }
  }

  onCodigoAfectacionLineaChange(detalle: RecibosDetalles, codigo: string): void {
    detalle.codigoAfectacionIgv = codigo;
    const qty =
      parseFloat(String($('#cantidad-' + detalle.codigoBarra).val() ?? detalle.cantidad)) || 0;
    const precio = parseFloat(String(detalle.precio ?? 0)) || 0;
    asignarMontosDetalle(detalle, qty, precio, this.productoPorDetalle(detalle));
    this.refrescarTotalesCabecera();
  }

  calcular(detalle:RecibosDetalles){
    let productosLista: Productos[] = this.productosLista;
    productosLista = productosLista.filter(x => x.codigoBarra === detalle.codigoBarra && parseInt(x.idPuntoVenta) === this.puntoVentas.id);
    let productos: Productos = productosLista[0];

    if(parseFloat(String(productos.stockActual)) <= parseFloat(String(productos.stockAlerta))){
      this.funcionesService.showError('El producto ' + productos.nombre + ' se esta quedando sin stock. Stock Actual: ' + productos.stockActual);
    }

    const qty = parseFloat($("#cantidad-" + detalle.codigoBarra).val()) || 0;
    const precioUnit = parseFloat(String(productos.precio)) || 0;
    this.detalles.forEach(element => {
      if(element.idProducto === productos.id){
        asignarMontosDetalle(element, qty, precioUnit, productos);
        element.existencia = parseFloat(String(productos.stockActual)) - qty;
      }
    });

    this.refrescarTotalesCabecera();
  }

  onKeydown(event: any, indice: number) {
    if (event.key === 'ArrowDown') {
      this.dataSource.filteredData.forEach((element, index) => {
        if (indice === index) {
          this.reducir(element);
        }
      });
    }
    if (event.key === 'ArrowUp') {
      this.dataSource.filteredData.forEach((element, index) => {
        if (indice === index) {
          this.aumentar(element);
        }
      });
    }
    if (event.key === 'Delete') {
      this.dataSource.filteredData.forEach((element, index) => {
        if (indice === index) {
          this.eliminarItem(element, indice);
        }
      });
    }
  }

  openModal(name: string) {

    const modalRef = this._modalService.open(MODALS[name], this.NgbModalOptions);
    const obj: any = new Object();

    switch (name) {
      case 'clientes':
        obj['opcion'] = 1;
        obj['clientes'] = this.clientes;
        modalRef.componentInstance.fromParent = obj;
      break;
      case 'items':
        obj['opcion'] = this.opcion;
        obj['items'] = this.items;
        modalRef.componentInstance.fromParent = obj;
      break;
      case 'medioPago':
        obj['recibos'] = this.recibos;
        obj['opcion'] = 1;
        modalRef.componentInstance.fromParent = obj;
      break;
      case 'kilos':
        obj['productos'] = this.productos;
        modalRef.componentInstance.fromParent = obj;
      break;
    }

    modalRef.result.then(async (result) => {

      switch (result.modal) {
        case 'items':

          if (result.value === 'loadAgain') {

            this.productos = result.productos;
            if(result.productos.nombreUm.toUpperCase().includes('KILOGRAMO')){
              this.openModal('kilos');
            }else{

              setTimeout(() => {
                this.highlight(result.items.codigoBarra);
              }, 1000);

              if(parseInt(result.opcion) === 1){
                let contador: number = 0;
                if(this.detalles.length > 0){
                  this.detalles.forEach(element => {
                    if(element.idProducto === result.items.idProducto){
                      contador += 1;
                      const cant = parseFloat(String(element.cantidad)) + parseFloat(String(result.items.cantidad));
                      element.cantidad = cant.toFixed(2);
                      const prod =
                        this.productoPorDetalle(element) || (result.productos as Productos);
                      asignarMontosDetalle(element, cant, parseFloat(String(element.precio)), prod);
                    }
                  });

                  if (contador === 0) {
                    this.detalles.push(result.items);
                  }
                }else{
                  this.detalles.push(result.items);
                }
              }

              if(parseInt(result.opcion) === 3){
                this.detalles.splice(this.indexEliminar, 1);
              }

              this.dataSource = new MatTableDataSource<RecibosDetalles>(this.detalles);

              this.refrescarTotalesCabecera();
            }
          }
          break;
        case 'medioPago':
          if (result.value === 'loadAgain') {
            this.detalles = [];
            this.dataSource = new MatTableDataSource<RecibosDetalles>(this.detalles);
            this.new_Modal();
            $("#codigoBarra").focus();
          }
          break;
        case 'kilos':
        this.funcionesService.showLoading();
        this.progressBar = true;
        if (result.value === 'loadAgain') {
          let productos = result.productos;
          let cantidad = result.cantidad;

          if(parseFloat(productos.stockActual) <= parseFloat(productos.stockAlerta)){
            this.funcionesService.showError('El producto ' + productos.nombre + ' se esta quedando sin stock. Stock Actual: ' + productos.stockActual);
          }

          let detalles: RecibosDetalles[] = [];
          detalles = this.detalles.filter(x => parseInt(x.idProducto) === parseInt(productos.id));

          if(detalles.length === 0){
            const row: RecibosDetalles = {
              idRecibo: 0,
              idProducto: productos.id,
              codigoBarra: productos.codigoBarra,
              nombre: productos.nombre,
              detalle: '',
              precio: productos.precio,
              cantidad: parseFloat(cantidad).toFixed(2),
              porcentajeDesc: 0.00,
              totalDesc: 0.00,
              existencia: parseFloat(String(productos.stockActual)) - parseFloat(cantidad)
            } as RecibosDetalles;
            asignarMontosDetalle(
              row,
              parseFloat(cantidad),
              parseFloat(String(productos.precio)),
              productos
            );
            this.detalles.push(row);
          }else{

            this.detalles.forEach(element => {
              if(element.idProducto === productos.id){
                element.cantidad =( parseFloat(cantidad) + parseFloat(String(element.cantidad))).toFixed(2);
                const cant = parseFloat(String(element.cantidad));
                asignarMontosDetalle(element, cant, parseFloat(String(productos.precio)), productos);
                element.existencia = element.existencia - parseFloat(cantidad)
              }
            });
          }

          $("#codigoBarra").val('');
          this.selectedRowIndex = productos.codigoBarra;
          this.dataSource = new MatTableDataSource<RecibosDetalles>(this.detalles);

          this.refrescarTotalesCabecera();
        }
        this.funcionesService.hideLoading();
        this.progressBar = false;
        break;
      }
    }, (reason) => { });
  }

  agregarItem(){
    this.opcion = 1;
    this.openModal('items');
  }

  eliminarItem(detalles: RecibosDetalles, index: number){

    this.funcionesService.mensajeConfirmar('', '¿Desea eliminar este registro?', (result: any) => {
      if (result.isConfirmed) {
        this.detalles.splice(index, 1);

        this.funcionesService.showLoading();
        this.progressBar = true;
        this.recibosService.deleteRecibosDetalles(detalles).subscribe(response => {

          if(response.status === 200){
            this.funcionesService.showSuccess(response.message);
            this.dataSource = new MatTableDataSource<RecibosDetalles>(this.detalles);

            this.refrescarTotalesCabecera();

            const oReturn: any = new Object();
            oReturn['value'] = 'loadAgain';
            oReturn['modal'] = 'recibos';
            this.activeModal.close(oReturn);

            this.funcionesService.hideLoading();
            this.progressBar = false;
          }
        });
      }
    });

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  viewDetail(element: any, index: number) {
    this.opcion = 2;
    this.items = element;
    this.indexEliminar = index;
    this.openModal('items');
  }

  calcularTotales(target: any){
    let value = target.value;
    this.funcionesService.showLoading();
    this.progressBar = true;

    if(value !== '' && value !== '0'){
      this.formGroup.patchValue({ porcentajeDesc: value });
    }else{
      this.formGroup.patchValue({ porcentajeDesc: '', montoDesc: '0.00' });
    }

    this.refrescarTotalesCabecera();

    this.funcionesService.hideLoading();
    this.progressBar = false;
  }

  onEnter(event: any){
    if (event.value !== '') {
      // let productosStorage: string | any = localStorage.getItem('productos');
      // let productosLista: Productos[] = JSON.parse(productosStorage);
      let productosLista: Productos[] = this.productosLista;
      productosLista = productosLista.filter(x => x.codigoBarra === event.value);

      if(productosLista.length > 0){
        // this.productosService.obtenerProductosCodigoBarra(event.value, this.puntoVentas.id).subscribe(response => {
          let productos: Productos = productosLista[0];
          this.productos = productos;
          // let productos: Productos = response.productos;
          if(productos.nombreUm.toUpperCase().includes('KILOGRAMO')){
            this.productos = productos;
            this.openModal('kilos');
          }else{

            if(parseFloat(productos.stockActual) <= parseFloat(productos.stockAlerta)){
              this.funcionesService.showError('El producto ' + productos.nombre + ' se esta quedando sin stock. Stock Actual: ' + productos.stockActual);
              $("#codigoBarra").val('');
              $("#codigoBarra").focus();
            }

            let detalles: RecibosDetalles[] = [];
            detalles = this.detalles.filter(x => parseInt(x.idProducto) === parseInt(productos.id));
            this.selectedRowIndex = productos.codigoBarra;

            if(detalles.length === 0){
              const row: RecibosDetalles = {
                idRecibo: 0,
                idProducto: productos.id,
                codigoBarra: productos.codigoBarra,
                nombre: productos.nombre,
                detalle: '',
                precio: productos.precio,
                cantidad: '1.00',
                porcentajeDesc: 0.00,
                totalDesc: 0.00,
                existencia: parseFloat(String(productos.stockActual))
              } as RecibosDetalles;
              asignarMontosDetalle(row, 1, parseFloat(String(productos.precio)), productos);
              this.detalles.push(row);
            }else{

              this.detalles.forEach(element => {
                if(element.idProducto === productos.id){
                  const cant = 1 + parseFloat(String(element.cantidad));
                  element.cantidad = cant.toFixed(2);
                  asignarMontosDetalle(element, cant, parseFloat(String(productos.precio)), productos);
                  element.existencia = parseFloat(String(element.existencia)) - 1
                }
              });
            }

            this.dataSource = new MatTableDataSource<RecibosDetalles>(this.detalles);
            $("#codigoBarra").focus();
            $("#codigoBarra").val('');

            this.refrescarTotalesCabecera();
          }
        // });
      }
    }
  }

  emitirRecibos(){
    if(this.formGroup.invalid){
      this.funcionesService.swalError('Información incorrecta o incompleta');
    }else{


      if(this.detalles.length === 0){
        this.funcionesService.showError('Ingrese un item como minimo');
        this.funcionesService.hideLoading();
        this.progressBar = false;

      }else{

        this.detalles.forEach(element => {
          element.precio = parseFloat(String(element.precio)).toFixed(2);
          const q = parseFloat(String($("#cantidad-" + element.codigoBarra).val())).toFixed(2);
          element.cantidad = q;
          asignarMontosDetalle(
            element,
            parseFloat(q),
            parseFloat(String(element.precio)),
            this.productoPorDetalle(element)
          );
        });

        this.recibos.total = this.formGroup.get("total").value;
        this.recibos.detalles = this.detalles;

        this.funcionesService.mensajeConfirmar('', '¿Desea guardar cambios?', (result: any) => {
          if(result.isConfirmed){
            this.funcionesService.showLoading();
            this.progressBar = true;
            this.recibosService.emitirRecibo(this.recibos).subscribe(response => {
              if(response.status === 200){

                this.funcionesService.hideLoading();
                this.progressBar = false;
                this.funcionesService.showSuccess(response.message);
                const oReturn: any = new Object();
                oReturn['value'] = 'loadAgain';
                oReturn['modal'] = 'recibos';
                this.activeModal.close(oReturn);
              }
            });
          }
        });
      }
    }
  }

  aumentar(detalle: RecibosDetalles){

    if((detalle.existencia - 1) < 0){
      this.funcionesService.showError('El producto se quedaria sin Stock.');
    }else{

      $("#cantidad-" + detalle.codigoBarra).val((parseFloat($("#cantidad-" + detalle.codigoBarra).val()) + 1).toFixed(2));
      const qty = parseFloat($("#cantidad-" + detalle.codigoBarra).val()) || 0;
      const prod = this.productoPorDetalle(detalle);
      asignarMontosDetalle(detalle, qty, parseFloat(String(detalle.precio)), prod);
      detalle.existencia = detalle.existencia  - 1;

      this.refrescarTotalesCabecera();
    }
  }

  reducir(detalle: RecibosDetalles){
    if($("#cantidad-" + detalle.codigoBarra).val() > 1){
      $("#cantidad-" + detalle.codigoBarra).val((parseFloat($("#cantidad-" + detalle.codigoBarra).val()) - 1).toFixed(2));

      const qty = parseFloat($("#cantidad-" + detalle.codigoBarra).val()) || 0;
      const prod = this.productoPorDetalle(detalle);
      asignarMontosDetalle(detalle, qty, parseFloat(String(detalle.precio)), prod);
      detalle.existencia = detalle.existencia  + 1;

      this.refrescarTotalesCabecera();
    }
  }

  calcularMayoreo(){
    if(parseFloat(this.productos.precioMayor) === 0){
      this.funcionesService.showInfo('Este producto no tiene precio mayoreo');
    }else{

      const qty = parseFloat($("#cantidad-" + this.productos.codigoBarra).val() || '0');

      this.detalles.forEach(element => {
        if(parseInt(String(element.idProducto), 10) === parseInt(String(this.productos.id), 10)){
          element.precio = this.productos.precioMayor;
          const prod = this.productoPorDetalle(element);
          asignarMontosDetalle(element, qty, parseFloat(String(element.precio)), prod || this.productos);
        }
      });

      $("#codigoBarra").val('');
      this.dataSource = new MatTableDataSource<RecibosDetalles>(this.detalles);

      this.refrescarTotalesCabecera();
    }
  }

  carlcularMinimo(){
    if(parseFloat(this.productos.precioMinimo) === 0){
      this.funcionesService.showInfo('Este producto no tiene precio mínimo');
    }else{

      const qty = parseFloat($("#cantidad-" + this.productos.codigoBarra).val() || '0');

      this.detalles.forEach(element => {
        if(parseInt(String(element.idProducto), 10) === parseInt(String(this.productos.id), 10)){
          element.precio = this.productos.precioMinimo;
          const prod = this.productoPorDetalle(element);
          asignarMontosDetalle(element, qty, parseFloat(String(element.precio)), prod || this.productos);
        }
      });

      $("#codigoBarra").val('');
      this.dataSource = new MatTableDataSource<RecibosDetalles>(this.detalles);

      this.refrescarTotalesCabecera();
    }
  }

  calcularMaximo(){
    if(parseFloat(this.productos.precioMaximo) === 0){
      this.funcionesService.showInfo('Este producto no tiene precio máximo');
    }else{

      const qty = parseFloat($("#cantidad-" + this.productos.codigoBarra).val() || '0');

      this.detalles.forEach(element => {
        if(parseInt(String(element.idProducto), 10) === parseInt(String(this.productos.id), 10)){
          element.precio = this.productos.precioMaximo;
          const prod = this.productoPorDetalle(element);
          asignarMontosDetalle(element, qty, parseFloat(String(element.precio)), prod || this.productos);
        }
      });

      $("#codigoBarra").val('');
      this.dataSource = new MatTableDataSource<RecibosDetalles>(this.detalles);

      this.refrescarTotalesCabecera();
    }
  }

  isAdministrador(): boolean{
    if (parseInt(this.usuario.idRol) === 1) {
      return true;
    }
    return false;
  }
}
