import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { TimelinePort } from '../../../application/ports/timeline.port';
import { SupabaseClientService } from '../../supabase/supabase-client.service';
import { TimelineEntryMapper } from '../../../domain/mappers/timeline-entry.mapper';
import { EntryType, HistoryEntry } from '../../../domain/models/timeline-entry.model';

@Injectable({ providedIn: 'root' })
export class SupabaseTimelineRepository implements TimelinePort {
  private readonly supabase = inject(SupabaseClientService).client;

  getDayEntries(userId: string, dateIso: string): Observable<HistoryEntry[]> {
    return from(
      this.supabase
        .from('timeline_events')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', `${dateIso}T00:00:00`)
        .lte('timestamp', `${dateIso}T23:59:59`)
        .order('timestamp'),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const raw = (data ?? []).map((row: any) => TimelineEntryMapper.toDomain(row));
        return TimelineEntryMapper.resolveTypes(raw);
      }),
    );
  }

  addEvent(
    userId: string,
    dateIso: string,
    entryType: EntryType,
    timeStr: string,
    description: string,
  ): Observable<HistoryEntry[]> {
    const eventType = TimelineEntryMapper.toDbEventType(entryType);
    const isoTimestamp = `${dateIso}T${timeStr}:00`;

    return this.getOrCreateDailyReport(userId, dateIso).pipe(
      switchMap(reportId =>
        from(
          this.supabase.from('timeline_events').insert({
            report_id: reportId,
            user_id: userId,
            event_type: eventType,
            timestamp: isoTimestamp,
            description: description || entryType,
          }),
        ).pipe(
          map(({ error }) => { if (error) throw error; return reportId; }),
          switchMap(rId =>
            this.getDayEntries(userId, dateIso).pipe(
              switchMap(entries =>
                this.updateDailyReport(rId, entries).pipe(map(() => entries)),
              ),
            ),
          ),
        ),
      ),
    );
  }

  private getOrCreateDailyReport(userId: string, dateIso: string): Observable<string> {
    return from(
      this.supabase
        .from('daily_reports')
        .select('id')
        .eq('user_id', userId)
        .eq('date_iso', dateIso)
        .maybeSingle(),
    ).pipe(
      switchMap(({ data }) => {
        if (data?.id) return of(data.id as string);
        return from(
          this.supabase
            .from('daily_reports')
            .insert({
              user_id: userId,
              date_iso: dateIso,
              day_status: 'not-clocked',
              worked_hours: '0h 00m',
              total_minutes: 0,
            })
            .select('id')
            .single(),
        ).pipe(
          map(({ data: d, error }) => {
            if (error) throw error;
            return (d as { id: string }).id;
          }),
        );
      }),
    );
  }

  private updateDailyReport(reportId: string, entries: HistoryEntry[]): Observable<void> {
    const workedMinutes = this.calculateWorkedMinutes(entries);
    const status = this.computeDayStatus(entries);
    const workedHours = this.formatDuration(workedMinutes);
    return from(
      this.supabase
        .from('daily_reports')
        .update({ day_status: status, worked_hours: workedHours, total_minutes: workedMinutes })
        .eq('id', reportId),
    ).pipe(map(({ error }) => { if (error) throw error; }));
  }

  private computeDayStatus(entries: HistoryEntry[]): string {
    if (!entries.length) return 'not-clocked';
    const last = entries[entries.length - 1];
    if (last.type === 'Salida') return 'clocked-out';
    if (last.type === 'Pausa') return 'on-pause';
    return 'clocked-in'; // Entrada or Reanudar
  }

  private calculateWorkedMinutes(entries: HistoryEntry[]): number {
    let total = 0;
    let lastIn: number | null = null;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const entry of entries) {
      if (entry.type === 'Entrada' || entry.type === 'Reanudar') {
        lastIn = this.parseMinutes(entry.time);
      } else if ((entry.type === 'Salida' || entry.type === 'Pausa') && lastIn !== null) {
        total += this.parseMinutes(entry.time) - lastIn;
        lastIn = null;
      }
    }

    if (lastIn !== null) total += currentMinutes - lastIn;
    return Math.min(Math.max(total, 0), 9 * 60);
  }

  private parseMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private formatDuration(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
}
