import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TimelinePort, TIMELINE_PORT_TOKEN } from '../../ports/timeline.port';
import { HistoryEntry } from '../../../domain/models/timeline-entry.model';

@Injectable({ providedIn: 'root' })
export class GetDayTimelineUseCase {
  constructor(@Inject(TIMELINE_PORT_TOKEN) private timelinePort: TimelinePort) {}

  execute(userId: string, dateIso: string): Observable<HistoryEntry[]> {
    return this.timelinePort.getDayEntries(userId, dateIso);
  }
}
