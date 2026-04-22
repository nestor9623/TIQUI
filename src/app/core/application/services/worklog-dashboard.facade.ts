import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { GetMonthlyReportUseCase } from '../use-cases/report/get-monthly-report.usecase';
import { DailyReport } from '../../domain/entities/report.entity';
import { addDays, isSameDate, startOfWeekMonday } from '../../utils/date.utils';

export interface WeeklyChartPoint {
  day: string;
  hours: number;
}

export interface RecentActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

export interface DashboardSummary {
  todayReport: DailyReport | null;
  weeklyTotalMinutes: number;
  monthlyTotalMinutes: number;
  monthlyWorkedDays: number;
}

interface YearMonth {
  year: number;
  month: number;
}

@Injectable({ providedIn: 'root' })
export class WorklogDashboardFacade {
  private readonly getMonthlyReportUseCase = inject(GetMonthlyReportUseCase);

  getMonthlyReports(userId: string, month: number, year: number): Observable<DailyReport[]> {
    return this.getMonthlyReportUseCase.execute(userId, month, year);
  }

  getTodayReport(userId: string, baseDate: Date = new Date()): Observable<DailyReport | null> {
    return this.getMonthlyReports(userId, baseDate.getMonth(), baseDate.getFullYear()).pipe(
      map(reports => reports.find(report => isSameDate(report.date, baseDate)) ?? null),
    );
  }

  getDashboardSummary(userId: string, baseDate: Date = new Date()): Observable<DashboardSummary> {
    return this.getMonthlyReports(userId, baseDate.getMonth(), baseDate.getFullYear()).pipe(
      switchMap(monthlyReports =>
        this.getWeekReports(userId, baseDate).pipe(
          map(weeklyReports => ({
            todayReport: monthlyReports.find(report => isSameDate(report.date, baseDate)) ?? null,
            weeklyTotalMinutes: weeklyReports.reduce((acc, report) => acc + report.totalMinutes, 0),
            monthlyTotalMinutes: monthlyReports.reduce((acc, report) => acc + report.totalMinutes, 0),
            monthlyWorkedDays: monthlyReports.filter(report => report.totalMinutes > 0).length,
          })),
        ),
      ),
    );
  }

  getWeeklyChart(userId: string, baseDate: Date = new Date()): Observable<WeeklyChartPoint[]> {
    return this.getWeekReports(userId, baseDate).pipe(
      map(reports => {
        const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;
        const start = startOfWeekMonday(baseDate);

        return labels.map((label, index) => {
          const date = addDays(start, index);
          const report = reports.find(item => isSameDate(item.date, date));
          return {
            day: label,
            hours: Number(((report?.totalMinutes ?? 0) / 60).toFixed(1)),
          };
        });
      }),
    );
  }

  getRecentActivities(userId: string, limit: number = 5, baseDate: Date = new Date()): Observable<RecentActivityItem[]> {
    return this.getMonthlyReports(userId, baseDate.getMonth(), baseDate.getFullYear()).pipe(
      map(reports => reports
        .flatMap(report => report.entries.map(entry => ({
          reportDate: report.date,
          entry,
        })))
        .sort((left, right) => {
          const leftTime = this.toDateTime(left.reportDate, left.entry.time).getTime();
          const rightTime = this.toDateTime(right.reportDate, right.entry.time).getTime();
          return rightTime - leftTime;
        })
        .slice(0, limit)
        .map((item, index) => ({
          id: String(index + 1),
          title: this.entryTitle(item.entry.type),
          description: item.entry.label,
          timestamp: this.toDateTime(item.reportDate, item.entry.time).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
          icon: this.entryIcon(item.entry.type),
        })),
      ),
    );
  }

  private getWeekReports(userId: string, baseDate: Date): Observable<DailyReport[]> {
    const weekStart = startOfWeekMonday(baseDate);
    const weekEnd = addDays(weekStart, 6);
    const months = this.getMonthsBetween(weekStart, weekEnd);

    if (months.length === 0) {
      return of([]);
    }

    return forkJoin(
      months.map(item => this.getMonthlyReports(userId, item.month, item.year)),
    ).pipe(
      map(monthlySets => monthlySets
        .flat()
        .filter(report => report.date >= weekStart && report.date <= weekEnd)
        .sort((left, right) => left.date.getTime() - right.date.getTime()),
      ),
    );
  }

  private getMonthsBetween(start: Date, end: Date): YearMonth[] {
    const result: YearMonth[] = [];
    let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const limit = new Date(end.getFullYear(), end.getMonth(), 1);

    while (cursor <= limit) {
      result.push({ year: cursor.getFullYear(), month: cursor.getMonth() });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }

    return result;
  }

  private toDateTime(date: Date, hhmm: string): Date {
    const [hours, minutes] = hhmm.split(':').map(value => Number(value));
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      Number.isFinite(hours) ? hours : 0,
      Number.isFinite(minutes) ? minutes : 0,
    );
  }

  private entryTitle(type: 'in' | 'out' | 'pause'): string {
    if (type === 'in') {
      return 'Entrada registrada';
    }
    if (type === 'out') {
      return 'Salida registrada';
    }
    return 'Pausa registrada';
  }

  private entryIcon(type: 'in' | 'out' | 'pause'): string {
    if (type === 'in') {
      return 'login';
    }
    if (type === 'out') {
      return 'logout';
    }
    return 'pause';
  }
}
