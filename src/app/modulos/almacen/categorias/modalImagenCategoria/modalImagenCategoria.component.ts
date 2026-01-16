import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CategoriasService } from '../service/categorias.service';
import { FuncionesService } from 'src/app/shared/services/funciones.service';

@Component({
  selector: 'app-modalImagenCategoria',
  templateUrl: './modalImagenCategoria.component.html',
  styleUrls: ['./modalImagenCategoria.component.css']
})
export class ModalImagenCategoriaComponent implements OnInit {

  @Input() categoriaId!: number;
  @Input() imagenUrl?: string;
  imagenFile: File | null = null;
  progressBar: boolean = false;

  constructor(
    public activeModal: NgbActiveModal,
    private categoriasService: CategoriasService,
    private funcionesService: FuncionesService
  ) {}

  ngOnInit(): void {

  }

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
    this.categoriasService.subirImagenCategoria(this.categoriaId, this.imagenFile).subscribe(
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
    if (!this.categoriaId) return;
    this.progressBar = true;
    this.categoriasService.deleteImagenCategoria(this.categoriaId).subscribe(
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
