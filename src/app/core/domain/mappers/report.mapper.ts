import { DailyReport, DayStatus, TimelineEntry, ReportMockDTO } from '../entities/report.entity';
import { parseHoursToMinutes } from '../../utils/worklog.utils';

export class ReportMapper {
  static parseMinutes(workedHours: string): number {
    return parseHoursToMinutes(workedHours);
  }

  static mapToDomain(dto: ReportMockDTO): DailyReport {
    const totalMinutes = this.parseMinutes(dto.worked_hours);
    return new DailyReport(
      new Date(dto.date_iso),
      dto.user_id,
      dto.day_status as DayStatus,
      dto.worked_hours,
      totalMinutes,
      dto.timeline_events.map(e => ({
        time: e.timestamp,
        type: e.event_type as TimelineEntry['type'],
        label: e.description
      }))
    );
  }
}
