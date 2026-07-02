import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { forkJoin } from 'rxjs';
import { saveAs } from 'file-saver';
import { PuntosVenta } from '../../mantenimientos/puntosventa/model/puntosVenta';
import { PuntosventaService } from '../../mantenimientos/puntosventa/service/puntosventa.service';
import {
  ContabilidadService,
  RceComprasResponse,
  RvieVentasResponse
} from '../contabilidad.service';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { periodoMesActual } from '../utils/contabilidad-filtros-defaults.util';
import {
  esJovitaGeneral,
  etiquetaConsolidacionSire,
  NOMBRES_TIENDAS_CONSOLIDACION_SIRE,
  puntoVentaDesdeStorage,
  resolverIdsConsultaSire
} from '../utils/contabilidad-punto-venta.util';
import {
  armarTablaRce,
  armarTablaRvie,
  etiquetaColumnaSire,
  TablaSireEstado
} from '../utils/contabilidad-reporte-sire.util';

@Component({
  selector: 'app-ventas-compras-unificado',
  templateUrl: './ventas-compras-unificado.component.html',
  styleUrls: ['./ventas-compras-unificado.component.css'],
  providers: [PuntosventaService]
})
export class VentasComprasUnificadoComponent implements OnInit {
  fg: FormGroup;
  puntoVentaSesion: PuntosVenta = puntoVentaDesdeStorage();
  puntosVenta: PuntosVenta[] = [];
  tiendasConsolidacion: PuntosVenta[] = [];

  esModoGeneral = false;
  etiquetaAlcance = '';

  loading = false;
  descargandoExcelCompras = false;
  descargandoExcelVentas = false;

  resumenCompras: RceComprasResponse | null = null;
  resumenVentas: RvieVentasResponse | null = null;

  tablaCompras: TablaSireEstado = {
    cabeceras: [],
    keysColumnas: [],
    displayedColumns: [],
    data: []
  };
  tablaVentas: TablaSireEstado = {
    cabeceras: [],
    keysColumnas: [],
    displayedColumns: [],
    data: []
  };

  dataSourceCompras = new MatTableDataSource(this.tablaCompras.data);
  dataSourceVentas = new MatTableDataSource(this.tablaVentas.data);

  tabActiva = 0;

  readonly etiquetaConsolidacionSire = etiquetaConsolidacionSire;

  constructor(
    private fb: FormBuilder,
    private contabilidad: ContabilidadService,
    private puntosventaService: PuntosventaService,
    public funciones: FuncionesService
  ) {
    const { fechaInicio, fechaFin } = periodoMesActual();
    this.esModoGeneral = esJovitaGeneral(this.puntoVentaSesion);
    this.fg = this.fb.group({
      fechaInicio: [fechaInicio, Validators.required],
      fechaFin: [fechaFin, Validators.required],
      idPuntoVenta: [''],
      soloActivas: [true]
    });
  }

  ngOnInit(): void {
    this.actualizarEtiquetaAlcance();

    if (!this.esModoGeneral && this.puntoVentaSesion.id != null) {
      this.fg.patchValue({ idPuntoVenta: String(this.puntoVentaSesion.id) });
    }

    this.puntosventaService.cargarPuntosVenta().subscribe({
      next: (data: any) => {
        this.puntosVenta = data?.puntosVenta || [];
        this.tiendasConsolidacion = this.puntosVenta.filter((pv) => {
          const nombre = (pv.nombre || '').trim().toUpperCase();
          return (NOMBRES_TIENDAS_CONSOLIDACION_SIRE as readonly string[]).includes(nombre);
        });
        this.actualizarEtiquetaAlcance();
      },
      error: () => {
        this.puntosVenta = [];
        this.tiendasConsolidacion = [];
      }
    });
  }

  actualizarEtiquetaAlcance(): void {
    if (this.esModoGeneral) {
      const filtro = this.fg?.get('idPuntoVenta')?.value;
      if (filtro === '' || filtro == null) {
        this.etiquetaAlcance = etiquetaConsolidacionSire();
        return;
      }
      const pv = this.puntosVenta.find((p) => String(p.id) === String(filtro));
      this.etiquetaAlcance = pv?.nombre ? String(pv.nombre) : `Tienda ${filtro}`;
      return;
    }
    this.etiquetaAlcance = this.puntoVentaSesion?.nombre || 'Tienda actual';
  }

  refrescarFiltros(): void {
    const { fechaInicio, fechaFin } = periodoMesActual();
    this.fg.reset({
      fechaInicio,
      fechaFin,
      idPuntoVenta: this.esModoGeneral ? '' : String(this.puntoVentaSesion.id ?? ''),
      soloActivas: true
    });
    this.limpiarResultados();
    this.actualizarEtiquetaAlcance();
  }

  private limpiarResultados(): void {
    this.resumenCompras = null;
    this.resumenVentas = null;
    this.tablaCompras = { cabeceras: [], keysColumnas: [], displayedColumns: [], data: [] };
    this.tablaVentas = { cabeceras: [], keysColumnas: [], displayedColumns: [], data: [] };
    this.dataSourceCompras.data = [];
    this.dataSourceVentas.data = [];
  }

  private paramsConsulta() {
    const v = this.fg.value;
    return {
      fechaInicio: v.fechaInicio,
      fechaFin: v.fechaFin,
      soloActivas: !!v.soloActivas
    };
  }

  private idsConsulta(): number[] {
    return resolverIdsConsultaSire(this.puntoVentaSesion, this.puntosVenta, this.fg.value.idPuntoVenta);
  }

  private esConsultaConsolidada(): boolean {
    return this.esModoGeneral && (this.fg.value.idPuntoVenta === '' || this.fg.value.idPuntoVenta == null);
  }

  consultar(): void {
    if (this.fg.invalid) {
      this.funciones.showWarning('Indique fecha de inicio y fecha fin.');
      return;
    }

    this.actualizarEtiquetaAlcance();
    const p = this.paramsConsulta();
    const ids = this.idsConsulta();
    const etiquetaCompras = this.esConsultaConsolidada()
      ? 'RCE — Compras consolidadas (Tiendas 1, 2 y 3)'
      : undefined;
    const etiquetaVentas = this.esConsultaConsolidada()
      ? 'RVIE — Ventas consolidadas (Tiendas 1, 2 y 3)'
      : undefined;

    this.loading = true;
    this.limpiarResultados();

    forkJoin({
      compras: this.contabilidad.obtenerRceComprasPorTiendas(p, ids, etiquetaCompras),
      ventas: this.contabilidad.obtenerRvieVentasPorTiendas(p, ids, etiquetaVentas)
    }).subscribe({
      next: ({ compras, ventas }) => {
        this.loading = false;
        this.resumenCompras = compras;
        this.resumenVentas = ventas;
        this.tablaCompras = armarTablaRce(compras);
        this.tablaVentas = armarTablaRvie(ventas);
        this.dataSourceCompras.data = this.tablaCompras.data;
        this.dataSourceVentas.data = this.tablaVentas.data;
      },
      error: (err) => {
        this.loading = false;
        this.mostrarErrorHttp(err);
      }
    });
  }

  descargarExcelCompras(): void {
    this.descargarExcelPorTipo('compras');
  }

  descargarExcelVentas(): void {
    this.descargarExcelPorTipo('ventas');
  }

  private descargarExcelPorTipo(tipo: 'compras' | 'ventas'): void {
    if (this.fg.invalid) {
      this.funciones.showWarning('Indique fecha de inicio y fecha fin.');
      return;
    }

    const p = this.paramsConsulta();
    const ids = this.idsConsulta();
    const v = this.fg.value;
    const flagSetter = tipo === 'compras' ? 'descargandoExcelCompras' : 'descargandoExcelVentas';
    (this as any)[flagSetter] = true;

    const descargas = (ids.length ? ids : [null]).map((idPv) => {
      const params = { ...p, idPuntoVenta: idPv };
      const obs =
        tipo === 'compras'
          ? this.contabilidad.descargarExcelRceCompras(params)
          : this.contabilidad.descargarExcelRvieVentas(params);
      const prefijo = tipo === 'compras' ? 'RCE_COMPRAS' : 'RVIE_VENTAS';
      const pv = idPv != null ? this.puntosVenta.find((x) => Number(x.id) === idPv) : null;
      const slug =
        idPv != null && ids.length > 1
          ? `_${(pv?.nombre || `TIENDA_${idPv}`).replace(/[^A-Za-z0-9]+/g, '_').toUpperCase()}`
          : '';
      const nombreDefecto = `${prefijo}${slug}_${v.fechaInicio}_${v.fechaFin}.xlsx`;
      return { obs, nombreDefecto };
    });

    forkJoin(descargas.map((d) => d.obs)).subscribe({
      next: (responses) => {
        (this as any)[flagSetter] = false;
        responses.forEach((resp, i) => {
          const blob = resp.body;
          if (!blob || blob.size === 0) {
            return;
          }
          let nombre = descargas[i].nombreDefecto;
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
        });
        const msg =
          descargas.length > 1
            ? `Se descargaron ${descargas.length} archivos Excel (uno por tienda).`
            : 'Descarga de Excel iniciada.';
        this.funciones.showSuccess(msg);
      },
      error: (err: HttpErrorResponse) => {
        (this as any)[flagSetter] = false;
        void this.mostrarErrorDescargaExcel(err);
      }
    });
  }

  private async mostrarErrorDescargaExcel(err: HttpErrorResponse): Promise<void> {
    this.descargandoExcelCompras = false;
    this.descargandoExcelVentas = false;
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

  etiquetaColumnaCompras(key: string): string {
    return etiquetaColumnaSire(
      key,
      this.tablaCompras.cabeceras,
      this.tablaCompras.keysColumnas,
      'ID compra'
    );
  }

  etiquetaColumnaVentas(key: string): string {
    return etiquetaColumnaSire(
      key,
      this.tablaVentas.cabeceras,
      this.tablaVentas.keysColumnas,
      'ID recibo'
    );
  }
}
