import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { EntryType, HistoryEntry } from '../../domain/models/timeline-entry.model';

export interface TimelinePort {
  getDayEntries(userId: string, dateIso: string): Observable<HistoryEntry[]>;
  addEvent(
    userId: string,
    dateIso: string,
    entryType: EntryType,
    timeStr: string,
    description: string,
  ): Observable<HistoryEntry[]>;
}

export const TIMELINE_PORT_TOKEN = new InjectionToken<TimelinePort>('TimelinePort');
