import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { saveAs } from 'file-saver';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { PuntosventaService } from '../../mantenimientos/puntosventa/service/puntosventa.service';
import {
  ContabilidadService,
  RvieVentasFila,
  RvieVentasResponse
} from '../contabilidad.service';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import {
  idPuntoVentaDesdeStorage,
  periodoMesActual
} from '../utils/contabilidad-filtros-defaults.util';

/** Fila plana para la tabla dinámica (cabeceras del API RVIE). */
export interface RvieVentasTablaFila {
  recibo_id?: number;
  id_punto_venta?: number;
  [key: string]: string | number | undefined;
}

@Component({
  selector: 'app-rvie-ventas',
  templateUrl: './rvie-ventas.component.html',
  styleUrls: ['./rvie-ventas.component.css'],
  providers: [PuntosventaService]
})
export class RvieVentasComponent implements OnInit {
  fg: FormGroup;
  puntosVenta: PuntosVenta[] = [];
  loading = false;
  descargandoExcel = false;

  resumen: RvieVentasResponse | null = null;

  cabeceras: string[] = [];
  keysColumnas: string[] = [];
  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource<RvieVentasTablaFila>([]);

  constructor(
    private fb: FormBuilder,
    private contabilidad: ContabilidadService,
    private puntosventaService: PuntosventaService,
    public funciones: FuncionesService
  ) {
    const { fechaInicio, fechaFin } = periodoMesActual();
    this.fg = this.fb.group({
      fechaInicio: [fechaInicio, Validators.required],
      fechaFin: [fechaFin, Validators.required],
      idPuntoVenta: [''],
      soloActivas: [true]
    });
  }

  ngOnInit(): void {
    this.fg.patchValue({ idPuntoVenta: idPuntoVentaDesdeStorage() });

    this.puntosventaService.cargarPuntosVenta().subscribe({
      next: (data: any) => {
        this.puntosVenta = data?.puntosVenta || [];
      },
      error: () => {
        this.puntosVenta = [];
      }
    });
  }

  refrescarFiltros(): void {
    const { fechaInicio, fechaFin } = periodoMesActual();
    this.fg.reset({
      fechaInicio,
      fechaFin,
      idPuntoVenta: idPuntoVentaDesdeStorage(),
      soloActivas: true
    });
    this.resumen = null;
    this.dataSource.data = [];
    this.cabeceras = [];
    this.keysColumnas = [];
    this.displayedColumns = [];
  }

  consultar(): void {
    if (this.fg.invalid) {
      this.funciones.showWarning('Indique fecha de inicio y fecha fin.');
      return;
    }
    const v = this.fg.value;
    const idPv = v.idPuntoVenta === '' || v.idPuntoVenta == null ? null : Number(v.idPuntoVenta);
    this.loading = true;
    this.resumen = null;
    this.dataSource.data = [];

    this.contabilidad
      .obtenerRvieVentas({
        fechaInicio: v.fechaInicio,
        fechaFin: v.fechaFin,
        idPuntoVenta: idPv,
        soloActivas: !!v.soloActivas
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.resumen = res;
          this.armarTabla(res);
        },
        error: (err) => {
          this.loading = false;
          this.mostrarErrorHttp(err);
        }
      });
  }

  private armarTabla(res: RvieVentasResponse): void {
    const heads = res.cabeceras && res.cabeceras.length ? res.cabeceras : this.cabecerasPorDefecto(res);
    this.cabeceras = heads;
    this.keysColumnas = heads.map((_, i) => 'k' + i);
    this.displayedColumns = ['recibo_id', 'id_punto_venta', ...this.keysColumnas];

    const filas = res.filas || [];
    const data: RvieVentasTablaFila[] = filas.map((f: RvieVentasFila) => {
      const row: RvieVentasTablaFila = {
        recibo_id: f.recibo_id,
        id_punto_venta: f.id_punto_venta
      };
      const celdas = f.celdas || [];
      heads.forEach((_, i) => {
        const raw = celdas[i];
        row['k' + i] = raw != null && raw !== '' ? String(raw) : '';
      });
      return row;
    });
    this.dataSource.data = data;
  }

  private cabecerasPorDefecto(res: RvieVentasResponse): string[] {
    const n = res.filas?.[0]?.celdas?.length || 40;
    return Array.from({ length: n }, (_, i) => 'C' + String(i + 1).padStart(2, '0'));
  }

  descargarExcel(): void {
    if (this.fg.invalid) {
      this.funciones.showWarning('Indique fecha de inicio y fecha fin.');
      return;
    }
    const v = this.fg.value;
    const idPv = v.idPuntoVenta === '' || v.idPuntoVenta == null ? null : Number(v.idPuntoVenta);
    this.descargandoExcel = true;

    const nombreDefecto = `RVIE_VENTAS_${v.fechaInicio}_${v.fechaFin}.xlsx`;

    this.contabilidad
      .descargarExcelRvieVentas({
        fechaInicio: v.fechaInicio,
        fechaFin: v.fechaFin,
        idPuntoVenta: idPv,
        soloActivas: !!v.soloActivas
      })
      .subscribe({
        next: (resp) => {
          this.descargandoExcel = false;
          const blob = resp.body;
          if (!blob || blob.size === 0) {
            this.funciones.showError('El servidor no devolvió un archivo Excel.');
            return;
          }
          let nombre = nombreDefecto;
          const cd = resp.headers.get('Content-Disposition');
          if (cd) {
            const m = /filename\*=UTF-8''([^;\n]+)|filename="([^"]+)"|filename=([^;\n]+)/i.exec(cd);
            const raw = (m?.[1] || m?.[2] || m?.[3] || '').trim();
            if (raw) {
              try {
                nombre = decodeURIComponent(raw);
              } catch {
                nombre = raw;
              }
            }
          }
          saveAs(blob, nombre);
          this.funciones.showSuccess('Descarga de Excel iniciada.');
        },
        error: (err: HttpErrorResponse) => {
          this.descargandoExcel = false;
          void this.mostrarErrorDescargaExcel(err);
        }
      });
  }

  private async mostrarErrorDescargaExcel(err: HttpErrorResponse): Promise<void> {
    let msg =
      err?.error?.mensaje ||
      err?.error?.message ||
      'Error al generar el Excel con plantilla SUNAT.';
    if (err.error instanceof Blob) {
      try {
        const t = await err.error.text();
        const j = JSON.parse(t) as { message?: string };
        if (j?.message) {
          msg = j.message;
        }
      } catch {
        /* mantener msg */
      }
    }
    this.funciones.showError(String(msg));
  }

  private mostrarErrorHttp(err: any): void {
    const msg =
      err?.error?.mensaje ||
      err?.error?.message ||
      err?.message ||
      'Error al consultar el reporte.';
    this.funciones.showError(String(msg));
  }

  etiquetaColumna(key: string): string {
    const idx = this.keysColumnas.indexOf(key);
    if (idx >= 0 && this.cabeceras[idx]) {
      return this.cabeceras[idx];
    }
    if (key === 'recibo_id') {
      return 'ID recibo';
    }
    if (key === 'id_punto_venta') {
      return 'Punto venta';
    }
    return key;
  }
}
