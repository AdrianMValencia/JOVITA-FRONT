import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { PuntosVenta } from 'src/app/modulos/mantenimientos/puntosventa/model/puntosVenta';
import { FuncionesService } from 'src/app/shared/services/funciones.service';
import { ProductosStockMinimo, ProductosStockMinimoResponse } from '../model/productosStockMinimo';
import { ReportesService } from '../service/reportes.service';

@Component({
  selector: 'app-productos-stock-minimo',
  templateUrl: './productos-stock-minimo.component.html',
  styleUrls: ['./productos-stock-minimo.component.css'],
  providers: [ReportesService]
})
export class ProductosStockMinimoComponent implements OnInit {

  puntoVentaStorage: string | any = localStorage.getItem('puntosVenta');
  puntoVentas: PuntosVenta = new PuntosVenta();

  // Progress Bar
  progressBar: boolean = false;

  // DataSource
  displayedColumns: string[] = ['puntoVenta', 'categoria', 'codigoBarra', 'nombreProducto', 'stockMinimo', 'stockActual', 'estado'];
  dataSource: MatTableDataSource<ProductosStockMinimo> = new MatTableDataSource<ProductosStockMinimo>();

  // Datos del reporte
  productosStockMinimo: ProductosStockMinimo[] = [];
  stockMinimo: number = 0;
  stockAlerta: number = 0;
  totalProductos: number = 0;

  constructor(
    private reportesService: ReportesService,
    public funcionesService: FuncionesService
  ) { }

  ngOnInit(): void {
    this.puntoVentas = JSON.parse(this.puntoVentaStorage);
    this.cargarReporteProductosStockMinimo();
  }

  cargarReporteProductosStockMinimo(): void {
    this.funcionesService.showLoading();
    this.progressBar = true;

    this.reportesService.productosStockMinimo(this.puntoVentas.id).subscribe(
      (response: ProductosStockMinimoResponse) => {
        if (response.status === 200) {
          this.productosStockMinimo = response.productosStockMinimo;
          this.stockMinimo = response.stockMinimo;
          this.stockAlerta = response.stockAlerta;
          this.totalProductos = response.totalProductos;

          this.dataSource = new MatTableDataSource<ProductosStockMinimo>(this.productosStockMinimo);
        } else {
          this.funcionesService.showError('Error al cargar el reporte');
        }

        this.funcionesService.hideLoading();
        this.progressBar = false;
      },
      (error) => {
        console.error('Error al cargar productos con stock mínimo:', error);
        this.funcionesService.showError('Error al cargar el reporte');
        this.funcionesService.hideLoading();
        this.progressBar = false;
      }
    );
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  getEstadoStock(stockActual: number, stockMinimo: number): string {
    if (stockActual <= 0) {
      return 'Sin Stock';
    } else if (stockActual <= stockMinimo) {
      return 'Stock Crítico';
    } else if (stockActual <= this.stockAlerta) {
      return 'Stock Bajo';
    } else {
      return 'Stock Normal';
    }
  }

  getEstadoClass(stockActual: number, stockMinimo: number): string {
    if (stockActual <= 0) {
      return 'sin-stock';
    } else if (stockActual <= stockMinimo) {
      return 'stock-critico';
    } else if (stockActual <= this.stockAlerta) {
      return 'stock-bajo';
    } else {
      return 'stock-normal';
    }
  }

  exportarExcel(): void {
    if (this.productosStockMinimo.length === 0) {
      this.funcionesService.showError('No hay datos para exportar');
      return;
    }

    // Crear un nuevo libro de trabajo
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Productos Stock Mínimo');

    // Configurar propiedades del documento
    workbook.creator = 'Sistema JOVITA';
    workbook.lastModifiedBy = 'Sistema JOVITA';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Título del reporte
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'REPORTE DE PRODUCTOS CON STOCK MÍNIMO';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1F4E79' }
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Información del punto de venta
    worksheet.mergeCells('A2:G2');
    const infoCell = worksheet.getCell('A2');
    infoCell.value = `Punto de Venta: ${this.puntoVentas.nombre}`;
    infoCell.font = { size: 12, bold: true };
    infoCell.alignment = { horizontal: 'center' };

    // Fecha del reporte
    worksheet.mergeCells('A3:G3');
    const dateCell = worksheet.getCell('A3');
    dateCell.value = `Fecha: ${new Date().toLocaleDateString('es-ES')}`;
    dateCell.font = { size: 10 };
    dateCell.alignment = { horizontal: 'center' };

    // Resumen estadístico
    const summaryRow = 4;
    worksheet.mergeCells(`A${summaryRow}:G${summaryRow}`);
    const summaryCell = worksheet.getCell(`A${summaryRow}`);
    summaryCell.value = `Total Productos: ${this.totalProductos} | Stock Mínimo: ${this.stockMinimo} | Stock Alerta: ${this.stockAlerta}`;
    summaryCell.font = { size: 10, bold: true };
    summaryCell.alignment = { horizontal: 'center' };
    summaryCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F2F2F2' }
    };

    // Encabezados de la tabla
    const headerRow = 6;
    const headers = [
      'Punto de Venta',
      'Categoría',
      'Código de Barra',
      'Nombre del Producto',
      'Stock Mínimo',
      'Stock Actual',
      'Estado'
    ];

    headers.forEach((header, index) => {
      const cell = worksheet.getCell(headerRow, index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Datos de los productos
    this.productosStockMinimo.forEach((producto, index) => {
      const row = headerRow + 1 + index;
      const estado = this.getEstadoStock(producto.stockActual, producto.stockMinimo);

      // Datos de la fila
      const rowData = [
        producto.puntoVenta,
        producto.categoria,
        producto.codigoBarra,
        producto.nombreProducto,
        producto.stockMinimo,
        producto.stockActual,
        estado
      ];

      rowData.forEach((data, colIndex) => {
        const cell = worksheet.getCell(row, colIndex + 1);
        cell.value = data;
        cell.alignment = {
          horizontal: colIndex === 3 ? 'left' : 'center',
          vertical: 'middle'
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        // Colorear según el estado del stock
        if (colIndex === 6) { // Columna de estado
          let bgColor = 'FFFFFF';
          let fontColor = '000000';

          switch (estado) {
            case 'Sin Stock':
              bgColor = 'DC3545';
              fontColor = 'FFFFFF';
              break;
            case 'Stock Crítico':
              bgColor = 'FD7E14';
              fontColor = 'FFFFFF';
              break;
            case 'Stock Bajo':
              bgColor = 'FFC107';
              fontColor = '212529';
              break;
            case 'Stock Normal':
              bgColor = '28A745';
              fontColor = 'FFFFFF';
              break;
          }

          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: bgColor }
          };
          cell.font = { color: { argb: fontColor }, bold: true };
        }

        // Colorear la columna de stock actual según el estado
        if (colIndex === 5) { // Columna de stock actual
          if (producto.stockActual <= 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFEBEE' }
            };
            cell.font = { color: { argb: 'DC3545' }, bold: true };
          } else if (producto.stockActual <= producto.stockMinimo) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF3E0' }
            };
            cell.font = { color: { argb: 'FD7E14' }, bold: true };
          }
        }
      });
    });

    // Ajustar ancho de columnas
    const columnWidths = [15, 20, 18, 35, 12, 12, 15];
    columnWidths.forEach((width, index) => {
      worksheet.getColumn(index + 1).width = width;
    });

    // Ajustar altura de filas
    worksheet.getRow(1).height = 25;
    worksheet.getRow(headerRow).height = 20;

    // Generar el archivo
    const fileName = `Productos_Stock_Minimo_${this.puntoVentas.nombre}_${new Date().toISOString().split('T')[0]}.xlsx`;

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      saveAs(blob, fileName);
      this.funcionesService.showSuccess('Archivo Excel exportado correctamente');
    }).catch((error) => {
      console.error('Error al generar el archivo Excel:', error);
      this.funcionesService.showError('Error al generar el archivo Excel');
    });
  }

  imprimir(): void {
    window.print();
  }

}
