import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GetTeamReportsUseCase } from '../use-cases/report/get-team-reports.usecase';
import { TeamReportEntry } from '../../domain/entities/team-report.entity';

@Injectable({ providedIn: 'root' })
export class ReportesFacade {
  private readonly getTeamReports = inject(GetTeamReportsUseCase);

  getForManager(managerId: string, fromIso: string, toIso: string): Observable<TeamReportEntry[]> {
    return this.getTeamReports.execute(managerId, fromIso, toIso);
  }

  getAll(fromIso: string, toIso: string): Observable<TeamReportEntry[]> {
    return this.getTeamReports.executeAll(fromIso, toIso);
  }
}
