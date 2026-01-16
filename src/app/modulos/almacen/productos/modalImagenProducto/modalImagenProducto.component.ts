import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductosService } from '../service/Productos.service';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

@Component({
  selector: 'app-modalImagenProducto',
  templateUrl: './modalImagenProducto.component.html'
})
export class ModalImagenProductoComponent {

  @Input() productoId!: number;
  @Input() imagenUrl?: string;
  imagenFile: File | null = null;
  progressBar: boolean = false;

  constructor(
    public activeModal: NgbActiveModal,
    private productosService: ProductosService,
    private funcionesService: FuncionesService
  ) {}

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file && file.type.match('image.*') && file.size <= 4096 * 1024) {
      this.imagenFile = file;
    } else {
      alert('Solo se permiten imágenes (jpeg, png, jpg, gif) menores a 4MB');
      this.imagenFile = null;
    }
  }

  subirImagen() {
    if (!this.imagenFile) return;
    this.progressBar = true;
    this.productosService.subirImagenProducto(this.productoId, this.imagenFile).subscribe(
      (response: any) => {
        this.progressBar = false;
        if (response && response.message) {
          this.funcionesService.showSuccess(response.message);
        }
        this.activeModal.close({ modal: 'imagen', value: 'uploaded' });
      },
      (error: any) => {
        this.progressBar = false;
        this.funcionesService.showError('Error al subir la imagen');
      }
    );
  }

  eliminarImagen() {
    if (!this.productoId) return;
    this.progressBar = true;
    this.productosService.deleteImagenProducto(this.productoId).subscribe(
      (response: any) => {
        this.progressBar = false;
        if (response && response.message) {
          this.funcionesService.showSuccess(response.message);
        }
        this.activeModal.close({ modal: 'imagen', value: 'deleted' });
      },
      (error: any) => {
        this.progressBar = false;
        this.funcionesService.showError('Error al eliminar la imagen');
      }
    );
  }
}
