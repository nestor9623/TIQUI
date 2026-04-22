import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ReportPort } from '../../../application/ports/report.port';
import { DailyReport } from '../../../domain/entities/report.entity';
import { ReportMapper } from '../../../domain/mappers/report.mapper';
import { MockWorklogDataService } from '../../../mock/services/mock-worklog-data.service';

@Injectable()
export class JsonReportRepository implements ReportPort {
  constructor(private readonly mockWorklogDataService: MockWorklogDataService) {}

  getMonthlyReport(userId: string, month: number, year: number): Observable<DailyReport[]> {
    return this.mockWorklogDataService.getMonthlyReports(userId, month, year).pipe(
      map(reports =>
        reports
          .filter(report => report.user_id === userId)
          .map(report => ReportMapper.mapToDomain(report))
          .sort((left, right) => left.date.getTime() - right.date.getTime()),
      ),
    );
  }
}
