import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-generate-summary',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './generate-summary.html',
  styleUrl: './generate-summary.scss',
})
export class GenerateSummaryComponent {
  // Checkbox para solo hoy
  onlyToday: boolean = false;

  // Fechas para rango personalizado
  startDate: string = '';
  endDate: string = '';

  constructor() {
    // Inicializar fechas por defecto
    this.initializeDates();
  }

  // Inicializar fechas
  private initializeDates(): void {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    
    this.startDate = lastWeek.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
  }

  // Cambio en el checkbox de "Solo hoy"
  onTodayChange(): void {
    console.log('Solo hoy:', this.onlyToday);
  }

  // Generar PDF
  generatePDF(): void {
    const params = this.getReportParams();
    console.log('Generando PDF con parámetros:', params);
    // TODO: Implementar lógica de generación de PDF
  }

  // Generar Excel
  generateExcel(): void {
    const params = this.getReportParams();
    console.log('Generando Excel con parámetros:', params);
    // TODO: Implementar lógica de generación de Excel
  }

  // Obtener parámetros del reporte
  private getReportParams() {
    if (this.onlyToday) {
      const today = new Date().toISOString().split('T')[0];
      return {
        type: 'day',
        date: today,
      };
    } else {
      return {
        type: 'range',
        startDate: this.startDate,
        endDate: this.endDate,
      };
    }
  }
}
