import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { PedidosWebService } from '../service/pedidos-web.service';
import { PedidoWeb } from '../model/pedido-web';

@Component({
  selector: 'app-modal-detalle-pedido',
  templateUrl: './modal-detalle-pedido.component.html',
  providers: [PedidosWebService]
})
export class ModalDetallePedidoComponent implements OnInit {

  @Input() fromParent: any;
  pedido: PedidoWeb = new PedidoWeb();
  estadoSeleccionado: number = 1;
  
  estados = [
    { codigo: 1, nombre: 'Pendiente' },
    { codigo: 2, nombre: 'Atendido' },
    { codigo: 3, nombre: 'Cancelado' }
  ];

  constructor(
    public activeModal: NgbActiveModal,
    private pedidosWebService: PedidosWebService,
    public funcionesService: FuncionesService
  ) { }

  ngOnInit(): void {
    if (this.fromParent) {
      // Si fromParent es el pedido directamente
      this.pedido = this.fromParent;
      
      // Si no tiene detalles, inicializar como array vacío
      if (!this.pedido.detalles) {
        this.pedido.detalles = [];
      }
      
      // Establecer el estado actual
      switch (this.pedido.estado?.toLowerCase()) {
        case 'pendiente':
          this.estadoSeleccionado = 1;
          break;
        case 'atendido':
          this.estadoSeleccionado = 2;
          break;
        case 'cancelado':
          this.estadoSeleccionado = 3;
          break;
        default:
          this.estadoSeleccionado = 1;
      }
      
      console.log('Pedido cargado:', this.pedido);
    }
  }

  actualizarEstado() {
    this.funcionesService.mensajeConfirmar(
      '¿Está seguro de actualizar el estado del pedido?',
      '',
      (resultado: any) => {
        if (resultado.isConfirmed) {
          this.funcionesService.showLoading();
          
          this.pedidosWebService.actualizarEstadoPedido(this.pedido.id!, this.estadoSeleccionado)
            .subscribe(
              response => {
                this.funcionesService.hideLoading();
                if (response.success) {
                  this.funcionesService.showSuccess(response.message || 'Estado actualizado correctamente');
                  this.activeModal.close('actualizado');
                } else {
                  this.funcionesService.showError(response.message || 'Error al actualizar el estado');
                }
              },
              error => {
                this.funcionesService.hideLoading();
                this.funcionesService.showError('Error al actualizar el estado del pedido');
                console.error(error);
              }
            );
        }
      }
    );
  }

  getEstadoBadgeClass(estado: string): string {
    // `estado` is declared as a non‑nullable string, so the optional
    // chain operator is redundant and triggers NG8107.  convert to
    // a normal property access and guard against empty string if
    // necessary.
    switch (estado.toLowerCase()) {
      case 'atendido':
        return 'badge-success';
      case 'pendiente':
        return 'badge-warning';
      case 'cancelado':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }
}
