import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  ComprobantesService,
  ComprobanteItem,
} from 'src/app/modulos/comprobantes/comprobantes.service';
import { MonedasService } from 'src/app/modulos/mantenimientos/monedas/service/monedas.service';
import { Monedas } from 'src/app/modulos/mantenimientos/monedas/model/monedas';
import { TipoCambioService } from 'src/app/modulos/mantenimientos/tipoCambio/service/tipoCambio.service';
import { ClientesService } from 'src/app/modulos/mantenimientos/clientes/Service/clientes.service';
import { ProductosService } from 'src/app/modulos/almacen/productos/service/Productos.service';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import Swal from 'sweetalert2';

interface Comprobante extends ComprobanteItem {}

@Component({
  selector: 'app-emision-comprobantes',
  templateUrl: './emision-comprobantes.component.html',
  styleUrls: ['./emision-comprobantes.component.css'],
  providers: [
    ComprobantesService,
    ClientesService,
    FuncionesService,
    MonedasService,
  ],
})
export class EmisionComprobantesComponent implements OnInit {
  filterForm: FormGroup;
  // longitud máxima dinámica para documento
  maxLengthDocumento: number = 0;
  cboMonedas: Monedas[] = [];

  // datos cabecera y detalle se almacenarán aquí
  cabecera: any = {
    tipo: '',
    serie: '',
    numero: '',
    fecha: '',
    cliente: '',
    direccion: '',
    celular: '',
    correo: '',
    // nuevos campos agregados a tbl_facturacion
    codigo: '',
    total: 0,
    idTipoCambio: null,
    tipoCambio: 0,
    igv: 0,
    subTotal: 0,
    idMoneda: null,
  };
  detalle: any[] = [];

  tipos: { id: number; documento: string }[] = [];
  tiposDocumento: { codigo: string; tipo: string }[] = [];

  // series disponibles para el tipo seleccionado (filtradas por punto de venta)
  seriesList: any[] = [];

  // catálogo de productos para autocompletar detalle
  productos: any[] = [];
  productosAll: any[] = []; // copia para aplicar filtro local sin perder datos

  // punto de venta actual (almacenado en localStorage)
  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: any = {};

  // IDs de serie y numeración resueltos al cambiar la serie
  idSerieActual: number | null = null;
  idNumeracionActual: number | null = null;

  // último comprobante guardado (para botones CDR/XML/PDF)
  comprobanteGuardado: any = null;
  emitiendo = false;

  constructor(
    private fb: FormBuilder,
    private service: ComprobantesService,
    private clientesService: ClientesService,
    private funcionesService: FuncionesService,
    private monedasService: MonedasService,
    private tipoCambioService: TipoCambioService,
    private productosService: ProductosService,
  ) {
    const today = new Date().toISOString().slice(0, 10); // formato yyyy-MM-dd
    this.filterForm = this.fb.group({
      tipoDocumento: ['', [Validators.required]],
      numeroDocumento: [
        '',
        [Validators.required, Validators.pattern(/^[0-9]*$/)],
      ],
      tipo: ['', [Validators.required]],
      serie: ['', [Validators.required]],
      numero: ['', [Validators.required]],
      fecha: [today, [Validators.required]],
      cliente: ['', [Validators.required]],
      direccion: [''],
      celular: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
      correo: ['', [Validators.required, Validators.email]],
      // campos nuevos del backend
      // código elegido ahora corresponde a id de moneda
      codigo: ['7', [Validators.required]],
      total: [
        { value: 0, disabled: true },
        [Validators.pattern(/^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/)],
      ],
      idTipoCambio: [null, [Validators.required]],
      tipoCambio: [0, [Validators.required]],
      igv: [{ value: 0, disabled: true }],
      subTotal: [{ value: 0, disabled: true }],
      idMoneda: [7],
    });
  }

  ngOnInit(): void {
    // parsear punto de venta del storage para usar en las consultas
    if (this.puntoVentaStorage) {
      this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    }

    // cargar tipos para selector
    this.cargarMonedas();

    // cargar productos para autocomplete de detalle (background)
    this.cargarProductos();

    // cuando cambia la moneda seleccionada, actualizamos el tipo de cambio
    this.filterForm.get('codigo')!.valueChanges.subscribe((value) => {
      // el selector devuelve un string; convertimos a número para las comparaciones
      const monedaId = value ? parseInt(value, 10) : null;
      // sincronizar también el idMoneda (campo paralelo a "codigo")
      this.filterForm.patchValue({ idMoneda: monedaId });

      if (monedaId) {
        this.loadTipoCambioForMoneda(monedaId);
      } else {
        this.filterForm.patchValue({ tipoCambio: 0, idTipoCambio: null });
      }
    });
    this.service.getTipos().subscribe((t) => {
      if (Array.isArray(t)) {
        this.tipos = t;
      } else if (t && typeof t === 'object') {
        this.tipos = t['tipos'] || t['data'] || [];
      }
    });

    // obtener lista de tipos de documento del servidor
    this.service.getTiposDocumento().subscribe(
      (r) => {
        this.tiposDocumento = r.tipos.map((item: any) => ({
          codigo: item.codigo,
          tipo: item.tipo,
        }));

        // también suscribirse a cambios para ajustar maxlength
        this.filterForm.get('tipoDocumento')!.valueChanges.subscribe((code) => {
          this.applyDocumentoValidators(code);
        });
      },
      (err) => {
        console.error('error cargando tipos de documento', err);
        // al menos proveer los más comunes
        this.tiposDocumento = [
          { codigo: '6', tipo: 'RUC - Registro único de contribuyente' },
          { codigo: '1', tipo: 'DNI - Doc. Nacional de Identidad' },
        ];
      },
    );

    // reaccionar cuando el tipo cambia
    this.filterForm.get('tipo')!.valueChanges.subscribe((tipo) => {
      if (tipo) {
        // cargar series disponibles para este punto de venta
        const idPunto = this.puntoVentas?.id;
        this.service.obtenerSeries(idPunto).subscribe((resp) => {
          // ignore responses que no correspondan con el tipo actual (previene carrera)
          if (this.filterForm.get('tipo')!.value !== tipo) {
            return;
          }

          this.seriesList = resp.series || [];

          // si el usuario eligió factura o boleta, aplicamos valores por defecto
          // los nombres/abreviaturas dependen del backend; ajustamos usando
          // heurísticas comunes (F/B o contains palabras).
          let defaultSerie = '';
          let defaultTipoDoc = '';
          const tLower = (tipo || '').toString().toLowerCase();
          if (
            tLower.includes('factura') ||
            tipo === 'F' ||
            tipo === 'f' ||
            tipo === '01' // código numérico para factura en SUNAT/NUBEFact
          ) {
            defaultSerie = 'FE01';
            defaultTipoDoc = '6';
          } else if (
            tLower.includes('boleta') ||
            tipo === 'B' ||
            tipo === 'b' ||
            tipo === '03' // boleta
          ) {
            // seleccionar la serie BE01 si existe y ajustar documento
            defaultSerie = 'BE01';
            defaultTipoDoc = '1';
          }

          if (defaultTipoDoc) {
            this.filterForm.patchValue({ tipoDocumento: defaultTipoDoc });
            this.applyDocumentoValidators(defaultTipoDoc);
          }

          if (defaultSerie) {
            // los elementos de seriesList son objetos { serie: string }
            const foundObj = this.seriesList.find(
              (s: any) =>
                s &&
                s.serie &&
                s.serie.toString().toUpperCase() === defaultSerie.toUpperCase(),
            );
            if (foundObj) {
              this.filterForm.patchValue({ serie: foundObj.serie });
              this.onSerieChange();
            } else {
              // no está disponible, limpiamos para que usuario elija
              this.filterForm.patchValue({ serie: '', numero: '' });
            }
          } else {
            this.filterForm.patchValue({ serie: '', numero: '' });
          }
        });
      } else {
        this.seriesList = [];
        this.filterForm.patchValue({ serie: '', numero: '' });
      }
    });
  }

  cargarMonedas() {
    const idPV = this.puntoVentas?.id;
    this.monedasService.cargarMonedas(idPV).subscribe(
      (response) => {
        if (response && response.monedas) {
          this.cboMonedas = response.monedas
            .filter((m: any) => parseInt(m.status, 10) === 1)
            .sort(this.funcionesService.orderBy('id'));

          const moneda7 = this.cboMonedas.find(
            (m: any) => parseInt(m.id, 10) === 7,
          );
          if (moneda7) {
            this.filterForm.patchValue({
              codigo: moneda7.id,
              idMoneda: parseInt(moneda7.id, 10),
            });
            this.loadTipoCambioForMoneda(parseInt(moneda7.id, 10));
          } else {
            this.filterForm.patchValue({ codigo: '7', idMoneda: 7 });
            this.loadTipoCambioForMoneda(7);
          }
        }
      },
      (err) => {
        console.error('Error cargando monedas', err);
        this.filterForm.patchValue({ codigo: '7', idMoneda: 7 });
        this.loadTipoCambioForMoneda(7);
      },
    );
  }

  loadTipoCambioForMoneda(monedaId: number) {
    const pv = this.puntoVentas?.id;
    if (!pv) {
      return;
    }
    this.tipoCambioService.obtenerTipoCambio(pv).subscribe((resp: any) => {
      if (resp && resp.tipoCambio) {
        // filtrar todos los registros de la moneda y quedarnos con el más reciente
        const registros = resp.tipoCambio.filter(
          (tc: any) => parseInt(tc.idMoneda, 10) === monedaId,
        );
        if (registros.length) {
          // ordenar por fecha de creación (created_at) o por fecha explícita
          registros.sort((a: any, b: any) => {
            const da = new Date(a.created_at || a.fecha).getTime();
            const db = new Date(b.created_at || b.fecha).getTime();
            return db - da;
          });
          const ultimo = registros[0];
          this.filterForm.patchValue({
            tipoCambio: ultimo.valorVenta || ultimo.valorCompra || 0,
            idTipoCambio: ultimo.id || null,
          });
        } else {
          this.filterForm.patchValue({ tipoCambio: 0, idTipoCambio: null });
        }
      }
    });
  }

  private markAllControlsTouched(): void {
    Object.keys(this.filterForm.controls).forEach((controlName) => {
      this.filterForm.get(controlName)!.markAsTouched();
    });
  }

  guardar() {
    if (this.detalle.length === 0) {
      Swal.fire(
        'Detalle vacío',
        'Debe agregar al menos una línea en el detalle.',
        'warning',
      );
      return;
    }

    if (this.filterForm.invalid) {
      this.markAllControlsTouched();
      Swal.fire(
        'Formulario incompleto',
        'Revise los campos requeridos e intente de nuevo.',
        'warning',
      );
      return;
    }

    Swal.fire({
      title: 'Confirmar',
      text: '¿Desea guardar el comprobante?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        const formValues = this.filterForm.getRawValue();
        // campos de texto
        this.cabecera.tipo = formValues.tipo;
        this.cabecera.serie = formValues.serie;
        this.cabecera.numero = formValues.numero;
        this.cabecera.numeracion = formValues.numero;
        this.cabecera.fecha = formValues.fecha;
        this.cabecera.cliente = formValues.cliente;
        this.cabecera.direccion = formValues.direccion;
        this.cabecera.celular = formValues.celular;
        this.cabecera.correo = formValues.correo;
        // IDs de punto de venta, serie, numeracion y tipo
        this.cabecera.idPuntoVenta = this.puntoVentas?.id || null;
        this.cabecera.puntoVenta = this.puntoVentas?.nombre || '';
        this.cabecera.idSerie = this.idSerieActual;
        this.cabecera.idNumeracion = this.idNumeracionActual;
        const tipoObj = this.tipos.find(
          (t: any) => t.documento === formValues.tipo,
        );
        this.cabecera.idTipoComprobante = tipoObj?.id ?? null;
        // campos de moneda y totales
        this.cabecera.codigo = formValues.codigo;
        this.cabecera.total = formValues.total;
        this.cabecera.idTipoCambio = formValues.idTipoCambio;
        this.cabecera.tipoCambio = formValues.tipoCambio;
        this.cabecera.igv = formValues.igv;
        this.cabecera.subTotal = formValues.subTotal;
        this.cabecera.idMoneda = formValues.idMoneda;

        this.emitiendo = true;
        this.service.createComprobante(this.cabecera, this.detalle).subscribe(
          (res) => {
            this.emitiendo = false;
            this.comprobanteGuardado = res.comprobante || null;

            if (res.status === 207) {
              // Guardado local OK, pero OSE devolvió error
              Swal.fire({
                title: 'Guardado con advertencia',
                html: `El comprobante fue guardado localmente pero no se pudo emitir en la OSE eFact.<br><small>${res.efact_error || ''}</small>`,
                icon: 'warning',
              });
            } else {
              const ticket = res.efact_ticket
                ? `<br><small>Ticket OSE: <b>${res.efact_ticket}</b></small>`
                : '';
              Swal.fire(
                'Emitido',
                `El comprobante fue emitido correctamente en la OSE eFact.${ticket}`,
                'success',
              );
            }
          },
          (error) => {
            this.emitiendo = false;
            console.error('Error creando comprobante', error);
            Swal.fire(
              'Error',
              'No se pudo guardar el comprobante. Intente de nuevo.',
              'error',
            );
          },
        );
      }
    });
  }

  onSerieChange(): void {
    const serie = this.filterForm.get('serie')!.value;
    if (serie) {
      this.service
        .getNumeracion(serie, this.puntoVentas?.id)
        .subscribe((nr) => {
          this.filterForm.get('numero')!.setValue(nr.siguiente || '');
          this.idSerieActual = nr.idSerie ?? null;
          this.idNumeracionActual = nr.idNumeracion ?? null;
        });
    } else {
      this.filterForm.get('numero')!.setValue('');
      this.idSerieActual = null;
      this.idNumeracionActual = null;
    }
  }

  cargarProductos(): void {
    const idPV = this.puntoVentas?.id;
    if (!idPV) {
      return;
    }
    this.productosService.cargarProductosVentas(idPV).subscribe(
      (response) => {
        let lista = [];
        if (response && response.productos) {
          lista = response.productos;
        } else if (Array.isArray(response)) {
          lista = response;
        }

        this.productosAll = Array.isArray(lista) ? lista : [];
        this.productos = [...this.productosAll];
      },
      (err) => {
        console.error('Error cargando productos', err);
        this.productosAll = [];
        this.productos = [];
      },
    );
  }

  onProductoInput(detalleItem: any): void {
    if (!detalleItem || !detalleItem.producto) {
      detalleItem.idProducto = null;
      detalleItem.precio = 0;
      detalleItem.subtotal = 0;
      this.calcularTotales();
      return;
    }

    const valor = detalleItem.producto.toString().trim().toLowerCase();
    const productoSeleccionado = this.productosAll.find((prod) => {
      const nombre = (prod.nombre || '').toString().trim().toLowerCase();
      const codigo = (prod.codigoBarra || prod.codigoAntiguo || '')
        .toString()
        .trim()
        .toLowerCase();
      return nombre === valor || codigo === valor;
    });

    if (productoSeleccionado) {
      this.selectProducto(detalleItem, productoSeleccionado);
    } else {
      detalleItem.idProducto = null;
      detalleItem.subtotal = 0;
      this.calcularTotales();
    }
  }

  selectProducto(detalleItem: any, producto: any): void {
    const stock = Number(producto.stockActual ?? 0);

    if (stock <= 0) {
      Swal.fire({
        title: 'Sin stock',
        text: `El producto "${producto.nombre}" no tiene stock disponible (stockActual = 0).`,
        icon: 'warning',
        confirmButtonText: 'Entendido',
      });
      // Limpiamos el producto seleccionado
      detalleItem.idProducto = null;
      detalleItem.producto = '';
      detalleItem.precio = 0;
      detalleItem.stockActual = 0;
      detalleItem.subtotal = 0;
      this.calcularTotales();
      return;
    }

    detalleItem.idProducto = producto.id;
    detalleItem.producto = producto.nombre;
    detalleItem.precio = Number(producto.precio || 0);
    detalleItem.stockActual = stock;
    this.calcularSubtotalLinea(detalleItem);
  }

  onInputChanged(detalleItem: any, query: string): void {
    detalleItem.producto = query;
    this.buscarProductos(query);
  }

  buscarProductos(query: string): void {
    const term = (query || '').toString().trim().toLowerCase();
    if (!term) {
      this.productos = [...this.productosAll];
      return;
    }

    this.productos = this.productosAll.filter((prod) => {
      const nombre = (prod.nombre || '').toString().toLowerCase();
      const codigo = (prod.codigoBarra || prod.codigoAntiguo || '')
        .toString()
        .toLowerCase();
      return nombre.includes(term) || codigo.includes(term);
    });
  }

  calcularSubtotalLinea(detalleItem: any): void {
    if (!detalleItem) {
      return;
    }

    const cantidad = Number(detalleItem.cantidad || 0);
    const precio = Number(detalleItem.precio || 0); // precio ya incluye IGV
    const totalLinea = cantidad * precio;
    const subtotalLinea = totalLinea / 1.18;
    const igvLinea = totalLinea - subtotalLinea;

    detalleItem.total = Number(totalLinea.toFixed(2));
    detalleItem.subtotal = Number(subtotalLinea.toFixed(2));
    detalleItem.igv = Number(igvLinea.toFixed(2));

    // Advertir si la cantidad supera el stock disponible
    const stock = Number(detalleItem.stockActual ?? Infinity);
    if (isFinite(stock) && cantidad > stock) {
      Swal.fire({
        title: 'Stock insuficiente',
        text: `La cantidad ingresada (${cantidad}) supera el stock disponible (${stock}) del producto "${detalleItem.producto}".`,
        icon: 'warning',
        confirmButtonText: 'Entendido',
      });
    }

    this.calcularTotales();
  }

  calcularTotales(): void {
    const sumaSubTotal = this.detalle.reduce((acc: number, item: any) => {
      const lineSubtotal = Number(item.subtotal || 0);
      return acc + (isNaN(lineSubtotal) ? 0 : lineSubtotal);
    }, 0);

    const sumaIgv = this.detalle.reduce((acc: number, item: any) => {
      const lineIgv = Number(item.igv || 0);
      return acc + (isNaN(lineIgv) ? 0 : lineIgv);
    }, 0);

    const sumaTotal = this.detalle.reduce((acc: number, item: any) => {
      const lineTotal = Number(item.total || 0);
      return acc + (isNaN(lineTotal) ? 0 : lineTotal);
    }, 0);

    this.filterForm.patchValue({
      subTotal: Number(sumaSubTotal.toFixed(2)),
      igv: Number(sumaIgv.toFixed(2)),
      total: Number(sumaTotal.toFixed(2)),
    });
  }

  /**
   * Ajusta las reglas del control "numeroDocumento" en función del código
   * de documento seleccionado (DNI = 8, RUC = 11, otros valores por defecto 0).
   */
  applyDocumentoValidators(code: string) {
    const control = this.filterForm.get('numeroDocumento');
    let max = 0;
    if (code === '6') {
      // RUC
      max = 11;
    } else if (code === '1') {
      // DNI
      max = 8;
    } else if (code === '4' || code === '7') {
      // CEX/Passport (ejemplo)
      max = 12;
    }
    this.maxLengthDocumento = max;
    control?.clearValidators();
    const validators = [Validators.required, Validators.pattern(/^[0-9]*$/)];
    if (max > 0) {
      validators.push(Validators.maxLength(max));
      validators.push(Validators.minLength(max));
    }
    control?.setValidators(validators);
    control?.updateValueAndValidity();
  }

  /**
   * Llamada a la API para consultar información en SUNAT/BD interna
   * cuando el usuario presiona ENTER en el campo de número de documento.
   */
  consultarSunat() {
    // only require document type for lookup
    const tipoDoc = this.filterForm.get('tipoDocumento')!.value;
    if (!tipoDoc) {
      this.funcionesService.swalError(
        'Seleccione primero el tipo de documento (RUC, DNI, etc.).',
      );
      return;
    }

    const numCtrl = this.filterForm.get('numeroDocumento');
    const num: string = numCtrl!.value || '';

    // manual check: length according to tipoDoc
    let expectedLen = 0;
    if (tipoDoc === '6') {
      expectedLen = 11; // RUC
    } else if (tipoDoc === '1') {
      expectedLen = 8; // DNI
    }
    if (expectedLen && num.length !== expectedLen) {
      this.funcionesService.swalError(
        `El número debe tener ${expectedLen} dígitos para el tipo seleccionado.`,
      );
      return;
    }

    // only digits
    if (!/^[0-9]*$/.test(num)) {
      this.funcionesService.swalError('Número de documento inválido');
      return;
    }

    if (!num) {
      return;
    }

    this.clientesService.consultasSUNAT(num, this.puntoVentas?.id).subscribe(
      (resp: any) => {
        if (resp && resp.status === 200 && resp.clientes) {
          const c = resp.clientes;
          // si es RUC 20 (empresa), concatenar dirección con ubigeo
          const isRuc20 = tipoDoc === '6' && num.startsWith('20');
          const direccion = isRuc20
            ? [c.direccion, c.ubigeo].filter((v) => v).join(' - ')
            : c.direccion || '';
          // poblar campos relevantes si existen
          this.filterForm.patchValue({
            cliente: c.nombre || '',
            direccion,
            celular: c.celular || '',
            correo: c.correo || '',
          });
        }
      },
      (err) => {
        console.error('error SUNAT', err);
      },
    );
  }

  agregarLinea() {
    this.detalle.push({
      idProducto: null,
      producto: '',
      cantidad: 1,
      precio: 0,
      subtotal: 0,
    });
    this.calcularTotales();
  }

  quitarLinea(idx: number) {
    this.detalle.splice(idx, 1);
    this.calcularTotales();
  }

  // ── OSE eFact: CDR / XML / PDF ────────────────────────────────────────────

  verCdr() {
    if (!this.comprobanteGuardado?.id) {
      return;
    }
    this.service.obtenerCdr(this.comprobanteGuardado.id).subscribe(
      (res) => {
        const codigo = res.sunat_codigo ?? '-';
        const desc = res.sunat_descripcion ?? '-';
        Swal.fire(
          'CDR - Respuesta SUNAT',
          `Código: <b>${codigo}</b><br>${desc}`,
          'info',
        );
      },
      (err) => Swal.fire('Error', 'No se pudo obtener el CDR.', 'error'),
    );
  }

  descargarXml() {
    if (!this.comprobanteGuardado?.id) {
      return;
    }
    this.service.obtenerXml(this.comprobanteGuardado.id).subscribe(
      (res) => {
        if (!res.xml_base64) {
          Swal.fire('Sin datos', 'El XML aún no está disponible.', 'warning');
          return;
        }
        const blob = this._base64ToBlob(res.xml_base64, 'application/xml');
        this._descargar(blob, `comprobante_${this.comprobanteGuardado.id}.xml`);
      },
      (err) => Swal.fire('Error', 'No se pudo obtener el XML.', 'error'),
    );
  }

  descargarPdf() {
    if (!this.comprobanteGuardado?.id) {
      return;
    }
    this.service.obtenerPdf(this.comprobanteGuardado.id).subscribe(
      (res) => {
        if (!res.pdf_base64) {
          Swal.fire('Sin datos', 'El PDF aún no está disponible.', 'warning');
          return;
        }
        const blob = this._base64ToBlob(res.pdf_base64, 'application/pdf');
        this._descargar(blob, `comprobante_${this.comprobanteGuardado.id}.pdf`);
      },
      (err) => Swal.fire('Error', 'No se pudo obtener el PDF.', 'error'),
    );
  }

  private _base64ToBlob(base64: string, type: string): Blob {
    const byteChars = atob(base64);
    const byteNums = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNums[i] = byteChars.charCodeAt(i);
    }
    return new Blob([new Uint8Array(byteNums)], { type });
  }

  private _descargar(blob: Blob, nombre: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  }
}
