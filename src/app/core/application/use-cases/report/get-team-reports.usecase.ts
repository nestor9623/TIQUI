import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TeamReportPort, TEAM_REPORT_PORT_TOKEN } from '../../ports/team-report.port';
import { TeamReportEntry } from '../../../domain/entities/team-report.entity';

@Injectable({ providedIn: 'root' })
export class GetTeamReportsUseCase {
  constructor(@Inject(TEAM_REPORT_PORT_TOKEN) private port: TeamReportPort) {}

  execute(managerId: string, fromIso: string, toIso: string): Observable<TeamReportEntry[]> {
    return this.port.getTeamReports(managerId, fromIso, toIso);
  }

  executeAll(fromIso: string, toIso: string): Observable<TeamReportEntry[]> {
    return this.port.getAllReports(fromIso, toIso);
  }
}
