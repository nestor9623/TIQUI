import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/auth/services/auth.service';
import { GetMonthlyReportUseCase } from '../../../core/application/use-cases/report/get-monthly-report.usecase';
import { DailyReport, DayStatus, TimelineEntry } from '../../../core/domain/entities/report.entity';
import { addDays, startOfWeekMonday, toIsoDate } from '../../../core/utils/date.utils';

interface DayData {
  date: Date;
  dayNumber: number;
  status: DayStatus;
  hours: string;
  hoursDifference: string | null;
  entries: TimelineEntry[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
}

@Component({
  selector: 'app-calendar',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.scss'],
})
export class CalendarPage implements OnInit {
  private readonly getMonthlyReportUseCase = inject(GetMonthlyReportUseCase);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly today = new Date();
  private readonly currentUserId = signal<string>('3');
  private readonly monthLabels = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ] as const;

  currentMonth = signal<number>(this.today.getMonth());
  currentYear = signal<number>(this.today.getFullYear());
  selectedDay = signal<DayData | null>(null);
  monthlyReports = signal<DailyReport[]>([]);
  targetWeekHours = 40;

  calendarDays = computed<DayData[]>(() => {
    const month = this.currentMonth();
    const year = this.currentYear();
    const firstDay = new Date(year, month, 1);
    const firstDayMondayIndex = (firstDay.getDay() + 6) % 7;
    const reportsByDate = new Map<string, DailyReport>();
    for (const report of this.monthlyReports()) {
      reportsByDate.set(toIsoDate(report.date), report);
    }

    const grid: DayData[] = [];

    for (let index = firstDayMondayIndex; index > 0; index--) {
      const date = new Date(year, month, 1 - index);
      grid.push(this.buildDay(date, false, reportsByDate.get(toIsoDate(date)) ?? null));
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      grid.push(this.buildDay(date, true, reportsByDate.get(toIsoDate(date)) ?? null));
    }

    while (grid.length % 7 !== 0) {
      const nextDay = grid.length - (firstDayMondayIndex + daysInMonth) + 1;
      const date = new Date(year, month + 1, nextDay);
      grid.push(this.buildDay(date, false, reportsByDate.get(toIsoDate(date)) ?? null));
    }

    return grid;
  });

  totalMonthHours = computed(() => {
    const total = this.monthlyReports().reduce((sum, r) => sum + r.totalMinutes, 0);
    return `${Math.floor(total / 60)}h ${total % 60}m`;
  });

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserId.set(user?.id ?? '3');
    this.loadMonthData();
  }

  changeMonth(direction: -1 | 1): void {
    const current = new Date(this.currentYear(), this.currentMonth(), 1);
    current.setMonth(current.getMonth() + direction);
    this.currentMonth.set(current.getMonth());
    this.currentYear.set(current.getFullYear());
    this.selectedDay.set(null);
    this.loadMonthData();
  }

  goToToday(): void {
    this.currentMonth.set(this.today.getMonth());
    this.currentYear.set(this.today.getFullYear());
    this.selectedDay.set(null);
    this.loadMonthData();
  }

  getMonthName(): string {
    return `${this.monthLabels[this.currentMonth()]} ${this.currentYear()}`;
  }

  getDayClass(day: DayData): string {
    return `day-status-${day.status}`;
  }

  selectDay(day: DayData): void {
    if (!day.isCurrentMonth || day.isFuture) {
      return;
    }
    this.selectedDay.set(day);
  }

  closeDetail(): void {
    this.selectedDay.set(null);
  }

  getMonthDays(): DayData[] {
    return this.calendarDays().filter(day => day.isCurrentMonth);
  }

  getStatusLabel(status: DayStatus): string {
    switch (status) {
      case 'clocked-in':
        return 'Trabajando';
      case 'clocked-out':
        return 'Completado';
      case 'on-pause':
        return 'En pausa';
      case 'holiday':
        return 'Festivo';
      case 'weekend':
        return 'Fin de semana';
      case 'vacation':
        return 'Vacaciones';
      case 'not-clocked':
      default:
        return 'Sin fichar';
    }
  }

  getDifferenceClass(): 'over' | 'under' | 'exact' {
    const difference = this.getCurrentWeekMinutes() - (this.targetWeekHours * 60);
    if (difference === 0) {
      return 'exact';
    }
    return difference > 0 ? 'over' : 'under';
  }

  getHoursDifference(): string {
    const difference = this.getCurrentWeekMinutes() - (this.targetWeekHours * 60);
    if (difference === 0) {
      return '0h';
    }
    const sign = difference > 0 ? '+' : '-';
    const absolute = Math.abs(difference);
    const hours = Math.floor(absolute / 60);
    const minutes = absolute % 60;
    return `${sign}${hours}h ${minutes}m`;
  }

  private loadMonthData(): void {
    this.getMonthlyReportUseCase.execute(this.currentUserId(), this.currentMonth(), this.currentYear())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(reports => {
        this.monthlyReports.set(reports);
      });
  }

  private getCurrentWeekMinutes(): number {
    const anchorDate = this.selectedDay()?.date ?? this.today;
    const weekStart = startOfWeekMonday(anchorDate);
    const weekEnd = addDays(weekStart, 6);
    return this.monthlyReports()
      .filter(report => report.date >= weekStart && report.date <= weekEnd)
      .reduce((acc, report) => acc + report.totalMinutes, 0);
  }

  private buildDay(date: Date, isCurrentMonth: boolean, report: DailyReport | null): DayData {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const defaultStatus: DayStatus = isWeekend ? 'weekend' : 'not-clocked';
    const dayStatus = report?.status ?? defaultStatus;

    return {
      date,
      dayNumber: date.getDate(),
      status: dayStatus,
      hours: report?.hours ?? (isWeekend ? '' : '0h 0m'),
      hoursDifference: this.formatDayDifference(dayStatus, report?.totalMinutes ?? 0),
      entries: report?.entries ?? [],
      isCurrentMonth,
      isToday: this.isSameDate(date, this.today),
      isFuture: date.getTime() > this.endOfDay(this.today).getTime(),
    };
  }

  private formatDayDifference(status: DayStatus, totalMinutes: number): string | null {
    if (status === 'weekend' || status === 'holiday' || status === 'vacation') {
      return null;
    }

    const diff = totalMinutes - 480;
    if (diff === 0) {
      return null;
    }

    const sign = diff > 0 ? '+' : '-';
    const absolute = Math.abs(diff);
    const hours = Math.floor(absolute / 60);
    const minutes = absolute % 60;
    return `${sign}${hours}h ${minutes}m`;
  }

  private endOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  }

  private isSameDate(left: Date, right: Date): boolean {
    return toIsoDate(left) === toIsoDate(right);
  }
}
