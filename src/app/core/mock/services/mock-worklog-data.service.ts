import { Injectable } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';
import { DayStatus, ReportMockDTO } from '../../domain/entities/report.entity';
import { MOCK_PATHS } from '../mock-config';
import { MockJsonLoaderService } from './mock-json-loader.service';
import {
  buildAutoVacationTimeline,
  defaultStatusFromCalendar,
  minutesToHoursLabel,
} from '../../utils/worklog.utils';
import { toIsoDate } from '../../utils/date.utils';

interface MockUserData {
  id: string;
  community?: 'madrid' | 'galicia';
  weeklyHoursTarget?: number;
  vacationDates?: string[];
}

interface CalendarRules {
  defaultWeeklyHoursTarget: number;
  defaultDailyHoursTarget: number;
  maxDailyHours: number;
  communities: Record<string, { holidays: string[] }>;
  managerWeekendOverrides: Array<{
    userId: string;
    date_iso: string;
    reason: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class MockWorklogDataService {
  constructor(private readonly jsonLoader: MockJsonLoaderService) {}

  getMonthlyReports(userId: string, month: number, year: number): Observable<ReportMockDTO[]> {
    return combineLatest([
      this.jsonLoader.loadJson<MockUserData[]>(MOCK_PATHS.users),
      this.jsonLoader.loadJson<ReportMockDTO[]>(MOCK_PATHS.monthlyReports),
      this.jsonLoader.loadJson<CalendarRules>(MOCK_PATHS.calendarRules),
    ]).pipe(
      map(([users, overrides, rules]) => {
        const selectedUsers = users.some(user => user.id === userId)
          ? users.filter(user => user.id === userId)
          : users;
        const reports: ReportMockDTO[] = [];
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (const currentUser of selectedUsers) {
          for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isoDate = toIsoDate(date);
            const randomValue = this.pseudoRandom(`${currentUser.id}-${isoDate}`);
            const status = this.getDefaultStatus(date, randomValue, currentUser, rules);

            reports.push({
              date_iso: isoDate,
              user_id: currentUser.id,
              day_status: status,
              worked_hours: this.buildWorkedHours(status, randomValue, rules),
              timeline_events: this.buildTimeline(status, currentUser, isoDate, rules),
            });
          }

          this.enforceWeeklyLimit(currentUser, reports, rules);
        }

        for (const override of overrides) {
          const overrideDate = new Date(override.date_iso);
          if (
            overrideDate.getFullYear() === year &&
            overrideDate.getMonth() === month &&
            selectedUsers.some(user => user.id === override.user_id)
          ) {
            const index = reports.findIndex(
              report => report.user_id === override.user_id && report.date_iso === override.date_iso,
            );
            if (index >= 0) {
              reports[index] = { ...override };
            } else {
              reports.push({ ...override });
            }
          }
        }

        return reports;
      }),
    );
  }

  private pseudoRandom(seed: string): number {
    let hash = 0;
    for (let index = 0; index < seed.length; index++) {
      hash = (hash * 31 + seed.charCodeAt(index)) | 0;
    }
    return Math.abs(hash % 1000) / 1000;
  }

  private getDefaultStatus(
    date: Date,
    randomValue: number,
    user: MockUserData,
    rules: CalendarRules,
  ): DayStatus {
    const dayOfWeek = date.getDay();
    const isoDate = toIsoDate(date);
    const communityKey = user.community ?? 'madrid';
    const communityHolidays = rules.communities[communityKey]?.holidays ?? [];
    const isHoliday = communityHolidays.includes(isoDate);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const weekendEnabled = rules.managerWeekendOverrides.some(
      override => override.userId === user.id && override.date_iso === isoDate,
    );
    const isVacation = Boolean(user.vacationDates?.includes(isoDate));

    return defaultStatusFromCalendar(isWeekend, isHoliday, isVacation, weekendEnabled, randomValue);
  }

  private buildTimeline(
    status: DayStatus,
    user: MockUserData,
    isoDate: string,
    rules: CalendarRules,
  ): ReportMockDTO['timeline_events'] {
    if (status === 'vacation') {
      return buildAutoVacationTimeline();
    }
    if (status === 'weekend') {
      return [];
    }
    const weekendOverride = rules.managerWeekendOverrides.find(
      override => override.userId === user.id && override.date_iso === isoDate,
    );
    if (weekendOverride) {
      return [
        { timestamp: '08:00', event_type: 'in', description: `Válido por manager: ${weekendOverride.reason}` },
        { timestamp: '14:00', event_type: 'pause', description: 'Corte jornada extra' },
        { timestamp: '15:00', event_type: 'in', description: 'Retorno jornada extra' },
        { timestamp: '17:00', event_type: 'out', description: 'Salida jornada extra' },
      ];
    }
    if (status === 'holiday' || status === 'not-clocked') {
      return [];
    }
    if (status === 'clocked-in') {
      return [{ timestamp: '08:42', event_type: 'in', description: 'Entrada - oficina' }];
    }
    if (status === 'on-pause') {
      return [
        { timestamp: '08:31', event_type: 'in', description: 'Entrada - teletrabajo' },
        { timestamp: '13:58', event_type: 'pause', description: 'Pausa comida' },
      ];
    }
    return [
      { timestamp: '08:30', event_type: 'in', description: 'Entrada' },
      { timestamp: '13:55', event_type: 'pause', description: 'Pausa comida' },
      { timestamp: '15:00', event_type: 'in', description: 'Retorno' },
      { timestamp: '17:45', event_type: 'out', description: 'Salida' },
    ];
  }

  private buildWorkedHours(status: DayStatus, randomValue: number, rules: CalendarRules): string {
    if (status === 'vacation') {
      return `${rules.defaultDailyHoursTarget}h 0m`;
    }
    if (status === 'weekend' || status === 'holiday' || status === 'not-clocked') {
      return '0h 0m';
    }
    if (status === 'clocked-in') {
      const minutes = 240 + Math.floor(randomValue * 150);
      return minutesToHoursLabel(minutes);
    }
    if (status === 'on-pause') {
      const minutes = 250 + Math.floor(randomValue * 90);
      return minutesToHoursLabel(minutes);
    }
    const minutes = 450 + Math.floor(randomValue * 70);
    return minutesToHoursLabel(Math.min(minutes, rules.maxDailyHours * 60));
  }

  private enforceWeeklyLimit(user: MockUserData, reports: ReportMockDTO[], rules: CalendarRules): void {
    const weeklyTargetMinutes = (user.weeklyHoursTarget ?? rules.defaultWeeklyHoursTarget) * 60;
    const userReports = reports.filter(report => report.user_id === user.id);
    const groupedByWeek = new Map<string, ReportMockDTO[]>();

    for (const report of userReports) {
      const date = new Date(report.date_iso);
      const weekKey = `${date.getFullYear()}-${this.weekNumber(date)}`;
      const bucket = groupedByWeek.get(weekKey);
      if (bucket) {
        bucket.push(report);
      } else {
        groupedByWeek.set(weekKey, [report]);
      }
    }

    for (const weekReports of groupedByWeek.values()) {
      const sorted = weekReports.sort((left, right) => left.date_iso.localeCompare(right.date_iso));
      let accumulated = 0;
      for (const report of sorted) {
        const minutes = this.parseWorkedMinutes(report.worked_hours);
        accumulated += minutes;
        if (accumulated <= weeklyTargetMinutes) {
          continue;
        }
        const available = Math.max(weeklyTargetMinutes - (accumulated - minutes), 0);
        report.worked_hours = minutesToHoursLabel(available);
        if (available === 0 && report.day_status !== 'vacation') {
          report.day_status = 'not-clocked';
          report.timeline_events = [];
        }
        accumulated = weeklyTargetMinutes;
      }
    }
  }

  private parseWorkedMinutes(workedHours: string): number {
    const [hoursPart, minutesPart] = workedHours.split('h');
    const hours = Number(hoursPart.trim());
    const minutes = Number((minutesPart ?? '0m').replace('m', '').trim());
    return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
  }

  private weekNumber(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 1);
    const diffDays = Math.floor((date.getTime() - start.getTime()) / 86400000);
    return Math.ceil((diffDays + start.getDay() + 1) / 7);
  }
}
