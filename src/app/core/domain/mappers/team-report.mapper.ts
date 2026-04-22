import { TeamReportEntry } from '../entities/team-report.entity';

export class TeamReportMapper {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static toDomain(row: any): TeamReportEntry {
    const profile = row.profiles ?? {};
    const firstName: string = profile.first_name ?? '';
    const lastName: string = profile.last_name ?? '';
    return {
      userId: row.user_id,
      fullName: `${firstName} ${lastName}`.trim() || 'Usuario desconocido',
      area: profile.area ?? 'Sin área',
      dateIso: row.date_iso,
      workedHours: row.worked_hours ?? '0h 00m',
      totalMinutes: row.total_minutes ?? 0,
      status: row.day_status ?? 'not-clocked',
    };
  }
}
