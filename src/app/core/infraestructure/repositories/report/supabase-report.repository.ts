import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { ReportPort } from '../../../application/ports/report.port';
import { DailyReport, TimelineEntry, DayStatus } from '../../../domain/entities/report.entity';
import { SupabaseClientService } from '../../supabase/supabase-client.service';

@Injectable()
export class SupabaseReportRepository implements ReportPort {
  private readonly supabase = inject(SupabaseClientService).client;

  getMonthlyReport(userId: string, month: number, year: number): Observable<DailyReport[]> {
    const from_date = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to_date = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    return from(
      this.supabase
        .from('daily_reports')
        .select(`*, timeline_events(*)`)
        .eq('user_id', userId)
        .gte('date_iso', from_date)
        .lte('date_iso', to_date)
        .order('date_iso'),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map(row => this.mapToDomain(row));
      }),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToDomain(row: any): DailyReport {
    const entries: TimelineEntry[] = (row.timeline_events ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) => ({
        time: e.timestamp,
        type: e.event_type as 'in' | 'out' | 'pause',
        label: e.description,
      }),
    );

    return new DailyReport(
      new Date(row.date_iso),
      row.user_id,
      row.day_status as DayStatus,
      row.worked_hours,
      row.total_minutes,
      entries,
    );
  }
}
