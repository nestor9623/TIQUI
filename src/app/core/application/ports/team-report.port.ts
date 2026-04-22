import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { TeamReportEntry } from '../../domain/entities/team-report.entity';

export interface TeamReportPort {
  getTeamReports(managerId: string, fromIso: string, toIso: string): Observable<TeamReportEntry[]>;
  getAllReports(fromIso: string, toIso: string): Observable<TeamReportEntry[]>;
}

export const TEAM_REPORT_PORT_TOKEN = new InjectionToken<TeamReportPort>('TeamReportPort');
