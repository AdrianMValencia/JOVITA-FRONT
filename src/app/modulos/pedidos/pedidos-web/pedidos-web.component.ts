import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { PedidosWebService } from './service/pedidos-web.service';
import { PedidoWeb } from './model/pedido-web';
import { ModalDetallePedidoComponent } from './modal-detalle-pedido/modal-detalle-pedido.component';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';

@Component({
  selector: 'app-pedidos-web',
  templateUrl: './pedidos-web.component.html',
  providers: [PedidosWebService]
})
export class PedidosWebComponent implements OnInit {

  // FormGroup para filtros
  fgFiltros: FormGroup | any;

  // PRINCIPAL
  MainDC: string[] = ['id', 'nombre', 'apellido', 'telefono', 'email', 'direccion', 'fecha', 'total', 'estado', 'acciones'];
  MainDS: MatTableDataSource<PedidoWeb> = new MatTableDataSource<PedidoWeb>();
  @ViewChild('pagMain', {static: true}) pagMain: MatPaginator | any;

  constructor(
    private fb: FormBuilder,
    private pedidosWebService: PedidosWebService,
    public funcionesService: FuncionesService,
    private modalService: NgbModal
  ) {
    this.new_fgFiltros();
  }

  new_fgFiltros() {
    this.fgFiltros = this.fb.group({
      nombre: '',
      apellido: '',
      numeroDocumento: '',
      puntoVenta: '',
      metodoPago: '',
      tipoComprobante: '',
      tipoDocumento: '',
      fechaIni: '',
      fechaFin: ''
    });

    this.fgFiltros.valueChanges.subscribe((value: any) => {
      this.MainDS.filter = JSON.stringify(value);
      if (this.MainDS.paginator) {
        this.MainDS.paginator.firstPage();
      }
    });
  }

  ngOnInit(): void {
    this.loadMain();
  }

  loadMain() {
    this.funcionesService.showLoading();
    this.pedidosWebService.obtenerPedidos().subscribe(response => {
      // Verificar si la respuesta es un array o un objeto con propiedad de array
      const pedidos = Array.isArray(response) ? response : (response as any).pedidos || (response as any).data || [];
      this.MainDS = new MatTableDataSource<PedidoWeb>(pedidos);
      this.MainDS.paginator = this.pagMain;
      
      // Configurar el filtro personalizado
      this.MainDS.filterPredicate = ((data: PedidoWeb, filter: string) => {
        const filterObj = JSON.parse(filter);
        
        const matchNombre = !filterObj.nombre || 
          (data.nombre && data.nombre.toLowerCase().includes(filterObj.nombre.toLowerCase()));
        
        const matchApellido = !filterObj.apellido || 
          (data.apellido && data.apellido.toLowerCase().includes(filterObj.apellido.toLowerCase()));
        
        const matchDocumento = !filterObj.numeroDocumento || 
          (data.numero_documento && data.numero_documento.toLowerCase().includes(filterObj.numeroDocumento.toLowerCase()));
        
        const matchPuntoVenta = !filterObj.puntoVenta || 
          (data.punto_venta_direccion && data.punto_venta_direccion.toLowerCase().includes(filterObj.puntoVenta.toLowerCase()));
        
        const matchMetodoPago = !filterObj.metodoPago || 
          (data.metodo_pago && data.metodo_pago.toLowerCase().includes(filterObj.metodoPago.toLowerCase()));
        
        const matchTipoComprobante = !filterObj.tipoComprobante || 
          (data.tipo_comprobante && data.tipo_comprobante.toLowerCase().includes(filterObj.tipoComprobante.toLowerCase()));
        
        const matchTipoDocumento = !filterObj.tipoDocumento || 
          (data.tipo_documento && data.tipo_documento.toLowerCase().includes(filterObj.tipoDocumento.toLowerCase()));
        
        const matchFecha = !filterObj.fechaIni || !filterObj.fechaFin || 
          (data.created_at && 
           new Date(data.created_at) >= new Date(filterObj.fechaIni) && 
           new Date(data.created_at) <= new Date(filterObj.fechaFin));
        
        return matchNombre && matchApellido && matchDocumento && matchPuntoVenta && 
               matchMetodoPago && matchTipoComprobante && matchTipoDocumento && matchFecha;
      }) as (data: any, filter: string) => boolean;

      this.funcionesService.hideLoading();
    }, error => {
      console.log(error);
      this.funcionesService.swalError('Error al cargar los pedidos');
      this.funcionesService.hideLoading();
    });
  }

  limpiarFiltros() {
    this.fgFiltros.reset({
      nombre: '',
      apellido: '',
      numeroDocumento: '',
      puntoVenta: '',
      metodoPago: '',
      tipoComprobante: '',
      tipoDocumento: '',
      fechaIni: '',
      fechaFin: ''
    });
  }

  verDetalle(pedido: PedidoWeb) {
    console.log('Pedido seleccionado:', pedido);
    
    // Abrir modal directamente con los datos del pedido desde la grilla
    const modalRef = this.modalService.open(ModalDetallePedidoComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });
    
    modalRef.componentInstance.fromParent = pedido;
    
    modalRef.result.then((result) => {
      if (result === 'actualizado') {
        this.loadMain();
      }
    }, (reason) => {
      // Modal cerrado sin cambios
    });
  }

  downloadPDF() {
    this.funcionesService.showLoading();
    
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    const col = ['ID', 'Nombre', 'Apellido', 'Teléfono', 'Email', 'Dirección', 'Fecha', 'Total', 'Estado'];
    const rows: any[] = [];

    const data = this.MainDS.filteredData.length > 0 ? this.MainDS.filteredData : this.MainDS.data;

    data.forEach((pedido: PedidoWeb) => {
      const temp = [
        pedido.id,
        pedido.nombre,
        pedido.apellido,
        `${pedido.codigo_pais} ${pedido.telefono}`,
        pedido.email,
        pedido.direccion,
        this.funcionesService.formatearFechaDDMMYYYY(pedido.created_at || ''),
        `S/ ${pedido.total}`,
        pedido.estado
      ];
      rows.push(temp);
    });

    doc.text('Reporte de Pedidos Web', 14, 15);
    doc.setFontSize(10);
    doc.text(`Fecha de generación: ${this.funcionesService.generarFechaLocal2(new Date())}`, 14, 22);
    
    (doc as any).autoTable({
      head: [col],
      body: rows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    doc.save(`pedidos-web-${new Date().getTime()}.pdf`);
    this.funcionesService.hideLoading();
  }

  downloadExcel() {
    this.funcionesService.showLoading();

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Pedidos Web');

    // Configurar columnas
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Nombre', key: 'nombre', width: 20 },
      { header: 'Apellido', key: 'apellido', width: 20 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Dirección', key: 'direccion', width: 40 },
      { header: 'Punto de Venta', key: 'puntoVenta', width: 30 },
      { header: 'Método de Pago', key: 'metodoPago', width: 15 },
      { header: 'Tipo Comprobante', key: 'tipoComprobante', width: 15 },
      { header: 'Tipo Documento', key: 'tipoDocumento', width: 15 },
      { header: 'N° Documento', key: 'numeroDocumento', width: 15 },
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Subtotal', key: 'subtotal', width: 12 },
      { header: 'Envío', key: 'envio', width: 12 },
      { header: 'Propina', key: 'propina', width: 12 },
      { header: 'Total', key: 'total', width: 12 },
      { header: 'Estado', key: 'estado', width: 15 }
    ];

    // Estilos del encabezado
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF428BCA' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    const data = this.MainDS.filteredData.length > 0 ? this.MainDS.filteredData : this.MainDS.data;

    // Agregar datos
    data.forEach((pedido: PedidoWeb) => {
      worksheet.addRow({
        id: pedido.id,
        nombre: pedido.nombre,
        apellido: pedido.apellido,
        telefono: `${pedido.codigo_pais} ${pedido.telefono}`,
        email: pedido.email,
        direccion: pedido.direccion,
        puntoVenta: pedido.punto_venta_direccion,
        metodoPago: pedido.metodo_pago,
        tipoComprobante: pedido.tipo_comprobante,
        tipoDocumento: pedido.tipo_documento,
        numeroDocumento: pedido.numero_documento,
        fecha: this.funcionesService.formatearFechaDDMMYYYY(pedido.created_at || ''),
        subtotal: pedido.subtotal,
        envio: pedido.envio,
        propina: pedido.propina,
        total: pedido.total,
        estado: pedido.estado
      });
    });

    // Guardar archivo
    workbook.xlsx.writeBuffer().then((data: any) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, `pedidos-web-${new Date().getTime()}.xlsx`);
      this.funcionesService.hideLoading();
    });
  }
}
