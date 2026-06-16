import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { saveAs } from 'file-saver';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { PuntosventaService } from '../../mantenimientos/puntosventa/service/puntosventa.service';
import {
  ContabilidadService,
  RceComprasFila,
  RceComprasResponse
} from '../contabilidad.service';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import {
  idPuntoVentaDesdeStorage,
  periodoMesActual
} from '../utils/contabilidad-filtros-defaults.util';

/** Fila plana para la tabla dinámica (cabeceras del API). */
export interface RceComprasTablaFila {
  compra_id?: number;
  id_punto_venta?: number;
  [key: string]: string | number | undefined;
}

@Component({
  selector: 'app-rce-compras',
  templateUrl: './rce-compras.component.html',
  styleUrls: ['./rce-compras.component.css'],
  providers: [PuntosventaService]
})
export class RceComprasComponent implements OnInit {
  fg: FormGroup;
  puntosVenta: PuntosVenta[] = [];
  loading = false;
  descargandoExcel = false;

  resumen: RceComprasResponse | null = null;

  cabeceras: string[] = [];
  /** Claves internas k0, k1, … alineadas con cabeceras. */
  keysColumnas: string[] = [];
  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource<RceComprasTablaFila>([]);

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
      .obtenerRceCompras({
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

  private armarTabla(res: RceComprasResponse): void {
    const heads = res.cabeceras && res.cabeceras.length ? res.cabeceras : this.cabecerasPorDefecto(res);
    this.cabeceras = heads;
    this.keysColumnas = heads.map((_, i) => 'k' + i);
    this.displayedColumns = ['compra_id', 'id_punto_venta', ...this.keysColumnas];

    const filas = res.filas || [];
    const data: RceComprasTablaFila[] = filas.map((f: RceComprasFila) => {
      const row: RceComprasTablaFila = {
        compra_id: f.compra_id,
        id_punto_venta: f.id_punto_venta
      };
      const celdas = f.celdas || [];
      heads.forEach((_, i) => {
        row['k' + i] = celdas[i] != null ? String(celdas[i]) : '';
      });
      return row;
    });
    this.dataSource.data = data;
  }

  /** Si el API no envía cabeceras, genera etiquetas C01… según la primera fila o 40 columnas (plantilla RCE SUNAT). */
  private cabecerasPorDefecto(res: RceComprasResponse): string[] {
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

    const nombreDefecto = `RCE_COMPRAS_${v.fechaInicio}_${v.fechaFin}.xlsx`;

    this.contabilidad
      .descargarExcelRceCompras({
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
    if (key === 'compra_id') {
      return 'ID compra';
    }
    if (key === 'id_punto_venta') {
      return 'Punto venta';
    }
    return key;
  }
}
