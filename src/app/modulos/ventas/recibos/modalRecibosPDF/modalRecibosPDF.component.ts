import { Component, OnInit, Input } from '@angular/core';
import { RecibosService } from '../service/recibos.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FuncionesService } from '../../../../shared/services/funciones.service';
import { Recibos } from '../model/recibos';
import { ComprobantesService } from 'src/app/modulos/comprobantes/comprobantes.service';
import { generarPdfTicketDesdeUblXml } from 'src/app/modulos/comprobantes/utils/efact-representacion-ticket-pdf.util';
import { resolverTicketEfactDesdeItem } from 'src/app/modulos/comprobantes/utils/efact-ticket-resolver.util';
declare var $: any;

@Component({
  selector: 'app-modalRecibosPDF',
  templateUrl: './modalRecibosPDF.component.html',
  providers: [RecibosService],
})
export class ModalRecibosPDFComponent implements OnInit {

  @Input() fromParent: any;

  recibos: Recibos = new Recibos(0, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', true, '', '');

  /** Tras cobrar en POS: mostrar PDF eFact en lugar del ticket interno. */
  private preferirComprobanteEfact = false;
  /** Si el iframe muestra el PDF descargado desde eFact (OSE). */
  mostroPdfEfact = false;

  // Progress Bar
  progressBar: boolean | any;

  constructor(
    public activeModal: NgbActiveModal,
    public funcionesService: FuncionesService,
    public service: RecibosService,
    private comprobantesService: ComprobantesService
  ) { }

  get tituloPdf(): string {
    if (this.mostroPdfEfact) {
      const r = this.recibos as any;
      const cpe =
        r?.comprobante_emitido ||
        r?.comprobante_electronico?.comprobante ||
        '';
      return cpe ? `Comprobante eFact ${cpe}` : 'Comprobante electrónico (eFact)';
    }
    return `RECIBO N° ${this.recibos.series}-${this.recibos.numeracion}`;
  }

  ngOnInit() {
    this.recibos = this.fromParent.recibos;
    this.preferirComprobanteEfact = !!this.fromParent.preferirComprobanteEfact;
    this.cargarPDF();
  }

  private getEfactTicketString(): string | null {
    const desdeRecibo = resolverTicketEfactDesdeItem(this.recibos);
    if (desdeRecibo) {
      return desdeRecibo;
    }
    const t = this.fromParent?.efactTicket ?? this.fromParent?.efact_ticket;
    if (t == null) {
      return null;
    }
    const s = String(t).trim();
    return s && s.toLowerCase() !== 'null' ? s : null;
  }

  /**
   * PDF eFact para recibo: ticket ~72 mm desde XML OSE (diseño original);
   * si falla, PDF del API eFact.
   */
  private obtenerBlobPdfEfactRecibo(onBlob: (b: Blob) => void, onFalloPdfApi: () => void): void {
    const idRec = Number(this.recibos?.id);
    if (!(idRec > 0)) {
      onFalloPdfApi();
      return;
    }
    const ticket = this.getEfactTicketString();

    const pdfApi = () => {
      if (ticket) {
        this.comprobantesService
          .descargarEfactPorQuery('pdf', { origen: 'recibo', id: idRec, ticket })
          .subscribe(
            (d) => onBlob(d),
            () =>
              this.comprobantesService.descargarPdfPorTicket(ticket).subscribe(
                (d) => onBlob(d),
                () => onFalloPdfApi()
              )
          );
        return;
      }
      this.comprobantesService.descargarEfactPorQuery('pdf', { origen: 'recibo', id: idRec }).subscribe(
        (d) => onBlob(d),
        () => onFalloPdfApi()
      );
    };

    this.comprobantesService
      .descargarEfactPorQuery('xml', { origen: 'recibo', id: idRec, ticket: ticket || null })
      .subscribe(
        (xmlBlob) => {
          if (!xmlBlob || xmlBlob.size < 200) {
            pdfApi();
            return;
          }
          void xmlBlob
            .text()
            .then((xmlText) => {
              const t = xmlText.trim();
              if (t.startsWith('{') || !t.includes('<Invoice')) {
                pdfApi();
                return;
              }
              void generarPdfTicketDesdeUblXml(xmlText, { vendedor: this.recibos?.vendedor })
                .then((ticketPdf) => {
                  if (ticketPdf && ticketPdf.size > 400) {
                    onBlob(ticketPdf);
                  } else {
                    pdfApi();
                  }
                })
                .catch(() => pdfApi());
            })
            .catch(() => pdfApi());
        },
        () => pdfApi()
      );
  }

  private descargarPdfEfactReciboPreferente(
    onBlob: (data: Blob) => void,
    onFalloTodoEfact: () => void
  ): void {
    const finOk = (data: Blob) => {
      onBlob(data);
      this.mostroPdfEfact = true;
      this.progressBar = false;
      this.funcionesService.hideLoading();
    };
    const finEfactMal = () => {
      this.funcionesService.showInfo('El PDF eFact aún no está disponible; se muestra el ticket de venta.');
      onFalloTodoEfact();
    };
    this.obtenerBlobPdfEfactRecibo(finOk, finEfactMal);
  }

  private mostrarIframePdf(data: Blob): void {
    const blob = new Blob([data], { type: 'application/pdf;charset=utf-8' });
    const fileURL = URL.createObjectURL(blob);
    $('#viewer').html('<iframe src="' + fileURL + '" width="100%" height="520px" frameborder="0"></iframe>');
  }

  cargarPDF(): void {
    this.progressBar = true;
    this.funcionesService.showLoading();
    this.mostroPdfEfact = false;

    const idRec = Number(this.recibos?.id);
    if (this.preferirComprobanteEfact && idRec > 0) {
      this.descargarPdfEfactReciboPreferente(
        (data) => this.mostrarIframePdf(data),
        () => this.cargarPdfReciboInterno()
      );
      return;
    }

    this.cargarPdfReciboInterno();
  }

  private cargarPdfReciboInterno(): void {
    this.service.cargarPDF(this.recibos.id).subscribe(
      (data) => {
        this.mostrarIframePdf(data);
        this.mostroPdfEfact = false;
        this.progressBar = false;
        this.funcionesService.hideLoading();
      },
      () => {
        this.progressBar = false;
        this.funcionesService.hideLoading();
        this.funcionesService.showError('No se pudo cargar el PDF.');
      }
    );
  }

  nombreArchivoDescarga(): string {
    if (this.mostroPdfEfact) {
      const r = this.recibos as any;
      const cpe =
        r?.comprobante_emitido ||
        r?.comprobante_electronico?.comprobante ||
        `recibo_${this.recibos.id}`;
      return `CPE_${String(cpe).replace(/[^A-Za-z0-9\-_.]/g, '_')}.pdf`;
    }
    return `RECIBO N° ${this.recibos.series}-${this.recibos.numeracion}.pdf`;
  }

  verNavegador(): void {
    this.progressBar = true;
    this.funcionesService.showLoading();

    const idRec = Number(this.recibos?.id);
    if (this.preferirComprobanteEfact && idRec > 0) {
      const onBlob = (data: Blob) => {
        const blob = new Blob([data], { type: 'application/pdf;charset=utf-8' });
        const fileURL = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = fileURL;
        link.download = this.nombreArchivoDescarga();
        link.click();
        this.progressBar = false;
        this.funcionesService.hideLoading();
      };
      this.obtenerBlobPdfEfactRecibo(onBlob, () => this.descargarReciboInternoNavegador());
      return;
    }

    this.descargarReciboInternoNavegador();
  }

  private descargarReciboInternoNavegador(): void {
    this.service.cargarPDF(this.recibos.id).subscribe(
      (data) => {
        const blob = new Blob([data], { type: 'application/pdf;charset=utf-8' });
        const fileURL = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = fileURL;
        link.download = `RECIBO N° ${this.recibos.series}-${this.recibos.numeracion}.pdf`;
        link.click();
        this.progressBar = false;
        this.funcionesService.hideLoading();
      },
      () => {
        this.progressBar = false;
        this.funcionesService.hideLoading();
      }
    );
  }

  ImprimirPDF(): void {
    this.progressBar = true;
    this.funcionesService.showLoading();

    const idRec = Number(this.recibos?.id);
    if (this.preferirComprobanteEfact && idRec > 0) {
      const onBlob = (data: Blob) => {
        const blob = new Blob([data], { type: 'application/pdf;charset=utf-8' });
        const fileURL = URL.createObjectURL(blob);
        const iframe: any = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = fileURL;
        document.body.appendChild(iframe);
        iframe.contentWindow.print();
        this.progressBar = false;
        this.funcionesService.hideLoading();
      };
      this.obtenerBlobPdfEfactRecibo(onBlob, () => this.imprimirReciboInterno());
      return;
    }

    this.imprimirReciboInterno();
  }

  private imprimirReciboInterno(): void {
    this.service.cargarPDF(this.recibos.id).subscribe(
      (data) => {
        const blob = new Blob([data], { type: 'application/pdf;charset=utf-8' });
        const fileURL = URL.createObjectURL(blob);
        const iframe: any = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = fileURL;
        document.body.appendChild(iframe);
        iframe.contentWindow.print();
        this.progressBar = false;
        this.funcionesService.hideLoading();
      },
      () => {
        this.progressBar = false;
        this.funcionesService.hideLoading();
      }
    );
  }
}
