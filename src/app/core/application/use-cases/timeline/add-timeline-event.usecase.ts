import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TimelinePort, TIMELINE_PORT_TOKEN } from '../../ports/timeline.port';
import { EntryType, HistoryEntry } from '../../../domain/models/timeline-entry.model';

@Injectable({ providedIn: 'root' })
export class AddTimelineEventUseCase {
  constructor(@Inject(TIMELINE_PORT_TOKEN) private timelinePort: TimelinePort) {}

  execute(
    userId: string,
    dateIso: string,
    entryType: EntryType,
    timeStr: string,
    description: string,
  ): Observable<HistoryEntry[]> {
    return this.timelinePort.addEvent(userId, dateIso, entryType, timeStr, description);
  }
}
