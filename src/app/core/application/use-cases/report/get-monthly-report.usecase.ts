import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReportPort, REPORT_PORT_TOKEN } from '../../ports/report.port';
import { DailyReport } from '../../../domain/entities/report.entity';

@Injectable({ providedIn: 'root' })
export class GetMonthlyReportUseCase {
  constructor(@Inject(REPORT_PORT_TOKEN) private reportPort: ReportPort) {}

  execute(userId: string, month: number, year: number): Observable<DailyReport[]> {
    return this.reportPort.getMonthlyReport(userId, month, year);
  }
}
