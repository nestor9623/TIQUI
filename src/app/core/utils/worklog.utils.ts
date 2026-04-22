import { DayStatus, ReportMockDTO } from '../domain/entities/report.entity';

export function parseHoursToMinutes(workedHours: string): number {
  const match = workedHours.match(/(\d+)h\s+(\d+)m/);
  const parsedHours = Number(match?.[1] ?? '0');
  const parsedMinutes = Number(match?.[2] ?? '0');
  return (parsedHours * 60) + parsedMinutes;
}

export function minutesToHoursLabel(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.max(0, totalMinutes % 60);
  return `${hours}h ${minutes}m`;
}

export function buildAutoVacationTimeline(): ReportMockDTO['timeline_events'] {
  return [
    { timestamp: '08:00', event_type: 'in', description: 'Vacaciones (tramo 1)' },
    { timestamp: '14:00', event_type: 'pause', description: 'Corte automático' },
    { timestamp: '15:00', event_type: 'in', description: 'Vacaciones (tramo 2)' },
    { timestamp: '17:00', event_type: 'out', description: 'Cierre automático' },
  ];
}

export function defaultStatusFromCalendar(
  isWeekend: boolean,
  isHoliday: boolean,
  isVacation: boolean,
  weekendEnabled: boolean,
  randomValue: number,
): DayStatus {
  if (isVacation) {
    return 'vacation';
  }
  if (isHoliday) {
    return 'holiday';
  }
  if (isWeekend && !weekendEnabled) {
    return 'weekend';
  }
  if (randomValue > 0.88) {
    return 'not-clocked';
  }
  if (randomValue > 0.68) {
    return 'on-pause';
  }
  if (randomValue > 0.48) {
    return 'clocked-in';
  }
  return 'clocked-out';
}

