import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { TeamReportPort } from '../../../application/ports/team-report.port';
import { SupabaseClientService } from '../../supabase/supabase-client.service';
import { TeamReportMapper } from '../../../domain/mappers/team-report.mapper';
import { TeamReportEntry } from '../../../domain/entities/team-report.entity';

@Injectable({ providedIn: 'root' })
export class SupabaseTeamReportRepository implements TeamReportPort {
  private readonly supabase = inject(SupabaseClientService).client;

  getTeamReports(managerId: string, fromIso: string, toIso: string): Observable<TeamReportEntry[]> {
    return from(
      this.supabase
        .from('daily_reports')
        .select('*, profiles:user_id(first_name, last_name, area, manager_id)')
        .gte('date_iso', fromIso)
        .lte('date_iso', toIso)
        .order('date_iso', { ascending: false }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? [])
          .filter((row: any) => row.profiles?.manager_id === managerId)
          .map((row: any) => TeamReportMapper.toDomain(row));
      }),
    );
  }

  getAllReports(fromIso: string, toIso: string): Observable<TeamReportEntry[]> {
    return from(
      this.supabase
        .from('daily_reports')
        .select('*, profiles:user_id(first_name, last_name, area, manager_id)')
        .gte('date_iso', fromIso)
        .lte('date_iso', toIso)
        .order('date_iso', { ascending: false }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((row: any) => TeamReportMapper.toDomain(row));
      }),
    );
  }
}
