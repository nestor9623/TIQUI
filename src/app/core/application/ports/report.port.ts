import { InjectionToken } from '@angular/core';
import { DailyReport } from '../../domain/entities/report.entity';
import { Observable } from 'rxjs';

export interface ReportPort {
  getMonthlyReport(userId: string, month: number, year: number): Observable<DailyReport[]>;
}

export const REPORT_PORT_TOKEN = new InjectionToken<ReportPort>('ReportPort');
