import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GetDayTimelineUseCase } from '../use-cases/timeline/get-day-timeline.usecase';
import { AddTimelineEventUseCase } from '../use-cases/timeline/add-timeline-event.usecase';
import { EntryType, HistoryEntry } from '../../domain/models/timeline-entry.model';
import { DayStatus } from '../../domain/entities/report.entity';

@Injectable({ providedIn: 'root' })
export class FichajeFlowFacade {
  private readonly getDayTimeline = inject(GetDayTimelineUseCase);
  private readonly addTimelineEvent = inject(AddTimelineEventUseCase);

  loadDayEntries(userId: string, dateIso: string): Observable<HistoryEntry[]> {
    return this.getDayTimeline.execute(userId, dateIso);
  }

  addEvent(
    userId: string,
    dateIso: string,
    entryType: EntryType,
    timeStr: string,
    description: string,
  ): Observable<HistoryEntry[]> {
    return this.addTimelineEvent.execute(userId, dateIso, entryType, timeStr, description);
  }

  /** Returns the list of actions available given the current day entries. */
  computeAllowedActions(entries: HistoryEntry[]): EntryType[] {
    if (!entries.length) return ['Entrada'];
    const last = entries[entries.length - 1];
    if (last.type === 'Salida') return [];
    if (last.type === 'Pausa') return ['Reanudar'];
    // Entrada or Reanudar — currently working
    return ['Pausa', 'Salida'];
  }

  computeWorkedFormatted(entries: HistoryEntry[]): string {
    return this.formatDuration(this.calculateWorkedMinutes(entries));
  }

  computePauseFormatted(entries: HistoryEntry[]): string {
    return this.formatDuration(this.calculatePauseMinutes(entries));
  }

  computeStatusLabel(entries: HistoryEntry[]): string {
    const status = this.computeDayStatus(entries);
    const labels: Record<DayStatus, string> = {
      'not-clocked': 'Sin fichar',
      'clocked-in': 'Trabajando',
      'on-pause': 'En pausa',
      'clocked-out': 'Jornada finalizada',
      holiday: 'Festivo',
      weekend: 'Fin de semana',
      vacation: 'Vacaciones',
    };
    return labels[status] ?? 'Sin fichar';
  }

  private computeDayStatus(entries: HistoryEntry[]): DayStatus {
    if (!entries.length) return 'not-clocked';
    const last = entries[entries.length - 1];
    if (last.type === 'Salida') return 'clocked-out';
    if (last.type === 'Pausa') return 'on-pause';
    return 'clocked-in'; // Entrada or Reanudar
  }

  private calculateWorkedMinutes(entries: HistoryEntry[]): number {
    let total = 0;
    let lastIn: number | null = null;
    const currentMinutes = this.currentTimeMinutes();

    for (const entry of entries) {
      if (entry.type === 'Entrada' || entry.type === 'Reanudar') {
        lastIn = this.parseMinutes(entry.time);
      } else if ((entry.type === 'Salida' || entry.type === 'Pausa') && lastIn !== null) {
        total += this.parseMinutes(entry.time) - lastIn;
        lastIn = null;
      }
    }

    if (lastIn !== null) total += currentMinutes - lastIn;
    return Math.min(Math.max(total - this.calculatePauseMinutes(entries), 0), 9 * 60);
  }

  private calculatePauseMinutes(entries: HistoryEntry[]): number {
    let total = 0;
    let pauseStart: number | null = null;
    const currentMinutes = this.currentTimeMinutes();

    for (const entry of entries) {
      if (entry.type === 'Pausa') {
        pauseStart = this.parseMinutes(entry.time);
      } else if (pauseStart !== null && (entry.type === 'Reanudar' || entry.type === 'Entrada')) {
        total += this.parseMinutes(entry.time) - pauseStart;
        pauseStart = null;
      }
    }

    if (pauseStart !== null) total += currentMinutes - pauseStart;
    return Math.max(total, 0);
  }

  private parseMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private currentTimeMinutes(): number {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  private formatDuration(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
}
