export type DayStatus =
  | 'not-clocked'
  | 'clocked-in'
  | 'on-pause'
  | 'clocked-out'
  | 'holiday'
  | 'weekend'
  | 'vacation';

export interface TimelineEntry {
  time: string;
  type: 'in' | 'out' | 'pause';
  label: string;
}

export interface ReportMockDTO {
  date_iso: string;
  user_id: string;
  day_status: string;
  worked_hours: string;
  timeline_events: Array<{
    timestamp: string;
    event_type: 'in' | 'out' | 'pause';
    description: string;
  }>;
}

export class DailyReport {
  constructor(
    public readonly date: Date,
    public readonly userId: string,
    public readonly status: DayStatus,
    public readonly hours: string,
    public readonly totalMinutes: number,
    public readonly entries: TimelineEntry[]
  ) {}

  get workedHoursFormatted(): string {
    const hours = Math.floor(this.totalMinutes / 60);
    const minutes = this.totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }
}
