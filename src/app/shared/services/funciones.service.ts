import { Injectable } from '@angular/core';

import Swal from 'sweetalert2';
declare var toastr: any;
import swal from 'sweetalert';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatDateFormats, NativeDateAdapter } from '@angular/material/core';
import { FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class FuncionesService {
  /**
   * Convierte una fecha string 'yyyy-MM-dd hh:mm:ss' a formato 'dd/MM/yyyy'.
   * @param fecha Fecha en formato 'yyyy-MM-dd hh:mm:ss'
   * @returns Fecha en formato 'dd/MM/yyyy'
   */

  constructor(
    private spinner: NgxSpinnerService,
    private toastr: ToastrService
  ) {}

  /*MOSTRAR LOADING*/
  showLoading() {
    this.spinner.show();
  }
  /*OCULTAR LOADING*/
  hideLoading() {
    this.spinner.hide();
    return this;
  }

  formatearFechaDDMMYYYY(fecha: string): string {
    if (!fecha) return '';
    // Extraer solo la parte de la fecha, manejando tanto espacio como 'T' como separador
    const fechaSolo = fecha.includes('T') ? fecha.split('T')[0] : fecha.split(' ')[0];
    const partes = fechaSolo.split('-');
    if (partes.length !== 3) return '';
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  formatearFecha(fecha: string): string {
    const year = fecha.split('/')[2];
    const mes = fecha.split('/')[1];
    const dia = fecha.split('/')[0];
    return year + mes + dia;
  }

  formatearFechaLocal(fecha: string): string {
    const year = fecha.split('/')[2];
    const mes = fecha.split('/')[1];
    const dia = fecha.split('/')[0];
    return year + '-' + mes + '-' + dia;
  }

  formatearFechaLocalSUNAT(fecha: string): string {
    const year = fecha.split('/')[2];
    const mes = fecha.split('/')[1];
    const dia = fecha.split('/')[0];
    return dia + '/' + mes + '/' + year;
  }

  formatearFecha3(fecha: string): string {
    const year = fecha.split('/')[2];
    const mes = fecha.split('/')[1];
    const dia = fecha.split('/')[0];
    return year + '-' + mes + '-' + dia;
  }

  formatearFecha5(fecha: string): string {
    const year = fecha.split('-')[0];
    const mes = fecha.split('-')[1];
    const dia = fecha.split('-')[2];
    return dia + '/' + mes + '/' + year;
  }

  formatearFecha4(fecha: string): string {
    const fechas = fecha.split('T')[0];
    return fechas;
  }

  primerDiaMes() {
    const date = new Date();
    const primerDia = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    const mes = (date.getMonth() + 1 < 10 ? '0' : '') + (date.getMonth() + 1);
    const dia = (primerDia.getDate() < 10 ? '0' : '') + primerDia.getDate();
    return date.getFullYear() + '-' + mes + '-' + dia;
  }

  ultimoDiaMes() {
    const date = new Date();
    const ultimoDia = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const mes = (date.getMonth() + 1 < 10 ? '0' : '') + (date.getMonth() + 1);
    const dia = (ultimoDia.getDate() < 10 ? '0' : '') + ultimoDia.getDate();
    return date.getFullYear() + '-' + mes + '-' + dia;
  }

  generarHoraActual(fecha: Date) {
    const hora = fecha.getHours();
    const minuto = fecha.getMinutes();
    return (
      (hora < 10 ? '0' + hora : hora) +
      ':' +
      (minuto < 10 ? '0' + minuto : minuto)
    );
  }

  generarFechaLocal(fecha: Date) {
    const year = fecha.getFullYear();
    const month =
      fecha.getMonth() + 1 < 10
        ? '0' + (fecha.getMonth() + 1)
        : fecha.getMonth() + 1;
    const day = fecha.getDate() < 10 ? '0' + fecha.getDate() : fecha.getDate();

    return year + '-' + month + '-' + day;
  }

  generarFechaLocalSUNAT(fecha: Date) {
    const year = fecha.getFullYear();
    const month =
      fecha.getMonth() + 1 < 10
        ? '0' + (fecha.getMonth() + 1)
        : fecha.getMonth() + 1;
    const day = fecha.getDate() < 10 ? '0' + fecha.getDate() : fecha.getDate();

    return day + '/' + month + '/' + year;
  }

  generarFechaLocal2(fecha: Date) {
    const year = fecha.getFullYear();
    const month =
      fecha.getMonth() + 1 < 10
        ? '0' + (fecha.getMonth() + 1)
        : fecha.getMonth() + 1;
    const day = fecha.getDate() < 10 ? '0' + fecha.getDate() : fecha.getDate();

    return day + '/' + month + '/' + year;
  }

  generarFechaLocal3(fecha: Date) {
    const year = fecha.getFullYear();
    const month =
      fecha.getMonth() + 1 < 10
        ? '0' + (fecha.getMonth() + 1)
        : fecha.getMonth() + 1;
    const day = fecha.getDate() < 10 ? '0' + fecha.getDate() : fecha.getDate();
    const hour =
      fecha.getHours() < 10 ? '0' + fecha.getHours() : fecha.getHours();
    const minutes =
      fecha.getMinutes() < 10 ? '0' + fecha.getMinutes() : fecha.getMinutes();

    // "2023-12-09T06:16"
    return year + '-' + month + '-' + day + 'T' + hour + ':' + minutes;
  }

  generarFechaLocal4(fecha: Date) {
    const year = fecha.getFullYear();
    const month =
      fecha.getMonth() + 1 < 10
        ? '0' + (fecha.getMonth() + 1)
        : fecha.getMonth() + 1;
    const day = fecha.getDate() < 10 ? '0' + fecha.getDate() : fecha.getDate();
    const hour =
      fecha.getHours() < 10 ? '0' + fecha.getHours() : fecha.getHours();
    const minutes =
      fecha.getMinutes() < 10 ? '0' + fecha.getMinutes() : fecha.getMinutes();

    // "2023-12-09T06:16"
    return day + '/' + month + '/' + year + ' ' + hour + ':' + minutes;
  }

  generarFechaReporte(fecha: Date) {
    const year = fecha.getFullYear();
    const month: any =
      fecha.getMonth() + 1 < 10
        ? '0' + (fecha.getMonth() + 1)
        : fecha.getMonth() + 1;
    const day = fecha.getDate() < 10 ? '0' + fecha.getDate() : fecha.getDate();

    return day + ' DE ' + this.meses(month) + ' DE ' + year;
  }

  b64toBlob(b64Data: any, contentType?: any, sliceSize?: any) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }

  convertDataURIToBinary(dataURI: any) {
    let BASE64_MARKER: string | any = ';base64,';
    var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
    var base64 = dataURI.substring(base64Index);
    return base64;
  }

  mensajeConfirmar(
    title: string,
    text: string,
    callBackOk?: any,
    callBackError?: any
  ) {
    Swal.fire({
      title,
      html: text,
      icon: 'question',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showCancelButton: true,
      cancelButtonColor: '#d33',
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Aceptar',
      reverseButtons: true,
    }).then((resultado: any) => {
      if (resultado.value) {
        if (callBackOk) {
          callBackOk(resultado);
        }
      } else {
        if (callBackError) {
          callBackError();
        }
      }
    });
  }

  mensajeConfirmarInfo(text: string, callBackOk?: any, callBackError?: any) {
    Swal.fire({
      title: '',
      html: text,
      icon: 'warning',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showCancelButton: false,
      cancelButtonColor: '#d33',
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Aceptar',
      reverseButtons: true,
    }).then((resultado: any) => {
      if (resultado.value) {
        if (callBackOk) {
          callBackOk();
        }
      } else if (callBackError) {
        callBackError();
      }
    });
  }

  mensajeInput(text: string, callBackOk?: any) {
    const input: any = 'input';
    swal(text, {
      content: input,
    }).then((resultado: any) => {
      callBackOk(resultado);
    });
  }

  showSuccess(title: string) {
    this.toastr.success('', title);
  }

  showWarning(title: string) {
    this.toastr.warning('', title);
  }

  showError(title: string) {
    this.toastr.error('', title);
  }

  showInfo(title: string) {
    this.toastr.info('', title);
  }

  swalInfo(message: string) {
    Swal.fire('Alerta!', message, 'info');
  }

  swalError(message: string) {
    Swal.fire('Error!', message, 'error');
  }

  /*INPUT SOLO NUMEROS*/
  soloAceptarNumeros(target: any) {
    target.value = target.value.replace(/[^0-9]+/g, '');
  }

  /*INPUT SOLO NUMEROS CON PUNTO DECIMAL*/
  soloAceptarNumerosPuntoDecimal(target: any) {
    target.value = target.value.replace(/[^0-9.]/g, '');
  }

  validaDNI(dni: any) {
    // tslint:disable-next-line:variable-name
    let ex_regular_dni: RegExp;
    ex_regular_dni = /^\d{8}(?:[-\s]\d{4})?$/;
    if (ex_regular_dni.test(dni) === true) {
      return true;
    } else {
      return false;
    }
  }

  validarCorreo(email: string | any) {
    const caract = new RegExp(
      /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/
    );
    let retornar: boolean = false;

    if (caract.test(email) === true) {
      retornar = true;
    } else {
      retornar = false;
    }

    return retornar;
  }

  dias: number | any = [
    { id: 1, value: 1 },
    { id: 2, value: 2 },
    { id: 3, value: 3 },
    { id: 4, value: 4 },
    { id: 5, value: 5 },
    { id: 6, value: 6 },
    { id: 7, value: 7 },
    { id: 8, value: 8 },
    { id: 9, value: 9 },
    { id: 10, value: 10 },
    { id: 11, value: 11 },
    { id: 12, value: 12 },
    { id: 13, value: 13 },
    { id: 14, value: 14 },
    { id: 15, value: 15 },
    { id: 16, value: 16 },
    { id: 17, value: 17 },
    { id: 18, value: 18 },
    { id: 19, value: 19 },
    { id: 20, value: 20 },
    { id: 21, value: 21 },
    { id: 22, value: 22 },
    { id: 23, value: 23 },
    { id: 24, value: 24 },
    { id: 25, value: 25 },
    { id: 26, value: 26 },
    { id: 27, value: 27 },
    { id: 28, value: 28 },
    { id: 29, value: 29 },
    { id: 30, value: 30 },
    { id: 31, value: 31 },
  ];

  mesess: number | any = [
    { id: 1, value: 'Enero' },
    { id: 2, value: 'Febrero' },
    { id: 3, value: 'Marzo' },
    { id: 4, value: 'Abril' },
    { id: 5, value: 'Mayo' },
    { id: 6, value: 'Junio' },
    { id: 7, value: 'Julio' },
    { id: 8, value: 'Agosto' },
    { id: 9, value: 'Septiembre' },
    { id: 10, value: 'Octubre' },
    { id: 11, value: 'Noviembre' },
    { id: 12, value: 'Diciembre' }
  ];

  fecha: Date = new Date();

  anios: number | any = [
    { id: this.fecha.getFullYear() - 5, value: this.fecha.getFullYear() - 5 },
    { id: this.fecha.getFullYear() - 4, value: this.fecha.getFullYear() - 4 },
    { id: this.fecha.getFullYear() - 3, value: this.fecha.getFullYear() - 3 },
    { id: this.fecha.getFullYear() - 2, value: this.fecha.getFullYear() - 2 },
    { id: this.fecha.getFullYear() - 1, value: this.fecha.getFullYear() - 1 },
    { id: this.fecha.getFullYear() - 0, value: this.fecha.getFullYear() - 0 },
    { id: this.fecha.getFullYear() + 1, value: this.fecha.getFullYear() + 1 },
    { id: this.fecha.getFullYear() + 2, value: this.fecha.getFullYear() + 2 },
    { id: this.fecha.getFullYear() + 3, value: this.fecha.getFullYear() + 3 },
    { id: this.fecha.getFullYear() + 4, value: this.fecha.getFullYear() + 4 },
    { id: this.fecha.getFullYear() + 5, value: this.fecha.getFullYear() + 5 }
  ];

  meses(value: string | any): any {
    let mesLetra: string;

    switch (value) {
      case 12:
        mesLetra = 'DICIEMBRE';
        break;
      case 11:
        mesLetra = 'NOVIEMBRE';
        break;
      case 10:
        mesLetra = 'OCTUBRE';
        break;
      case 9:
        mesLetra = 'SEPTIEMBRE';
        break;
      case 8:
        mesLetra = 'AGOSTO';
        break;
      case 7:
        mesLetra = 'JULIO';
        break;
      case 6:
        mesLetra = 'JUNIO';
        break;
      case 5:
        mesLetra = 'MAYO';
        break;
      case 4:
        mesLetra = 'ABRIL';
        break;
      case 3:
        mesLetra = 'MARZO';
        break;
      case 2:
        mesLetra = 'FEBRERO';
        break;
      case 1:
        mesLetra = 'ENERO';
        break;
      case '12':
        mesLetra = 'DICIEMBRE';
        break;
      case '11':
        mesLetra = 'NOVIEMBRE';
        break;
      case '10':
        mesLetra = 'OCTUBRE';
        break;
      case '09':
        mesLetra = 'SEPTIEMBRE';
        break;
      case '08':
        mesLetra = 'AGOSTO';
        break;
      case '07':
        mesLetra = 'JULIO';
        break;
      case '06':
        mesLetra = 'JUNIO';
        break;
      case '05':
        mesLetra = 'MAYO';
        break;
      case '04':
        mesLetra = 'ABRIL';
        break;
      case '03':
        mesLetra = 'MARZO';
        break;
      case '02':
        mesLetra = 'FEBRERO';
        break;
      case '01':
        mesLetra = 'ENERO';
        break;
      default:
        mesLetra = '';
        break;
    }

    return mesLetra;
  }

  convertStringToNumber(input: any) {
    if (input.length !== undefined) {
      if (input.trim().length == 0) {
        return NaN;
      }
    }
    return Number(input);
  }

  public toFloat(value: string): any {
    return parseFloat(value);
  }

  orderBy(key: any) {
    return (a: any, b: any) => {
      if (a[key] < b[key]) return 1;
      if (a[key] > b[key]) return -1;
      return 0;
    };
  }

  orderBy2(keys: any) {
    return (a: any, b: any) => {
      for (let key of keys) {
        if (a[key] > b[key]) return 1;
        if (a[key] < b[key]) return -1;
      }
      return 0;
    };
  }
}

export const APP_DATE_FORMATS = {
  parse: {
    dateInput: 'LL',
  },
  display: {
    dateInput: 'YYYY-MM-DD',
    monthYearLabel: 'YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'YYYY',
  },
};

export function MustMatch(controlName: string, matchingControlName: string) {
  return (formGroup: FormGroup) => {
    const control = formGroup.controls[controlName];
    const matchingControl = formGroup.controls[matchingControlName];

    if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
      // return if another validator has already found an error on the matchingControl
      return;
    }

    // set error on matchingControl if validation fails
    if (control.value !== matchingControl.value) {
      matchingControl.setErrors({ mustMatch: true });
    } else {
      matchingControl.setErrors(null);
    }
  };
}
