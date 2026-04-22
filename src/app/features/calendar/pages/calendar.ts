import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/auth/services/auth.service';
import { UserRole } from '../../../core/auth/models/auth.model';
import { GetMonthlyReportUseCase } from '../../../core/application/use-cases/report/get-monthly-report.usecase';
import { DailyReport, DayStatus, TimelineEntry } from '../../../core/domain/entities/report.entity';
import { addDays, startOfWeekMonday, toIsoDate } from '../../../core/utils/date.utils';
import { FichajeApprovalFacade } from '../../../core/application/services/fichaje-approval.facade';
import { AppAlertService } from '../../../shared/services/app-alert.service';
import { SupabaseVacacionesService } from '../../../core/infraestructure/repositories/supabase-vacaciones.service';

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

type AdjustmentType = 'Entrada' | 'Salida';

interface AdjustmentDraft {
  id: string;
  type: AdjustmentType;
  time: string;
  note: string;
}

@Component({
  selector: 'app-calendar',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.scss'],
})
export class CalendarPage implements OnInit {
  private static readonly MAX_DAILY_MINUTES = 9 * 60;

  private readonly getMonthlyReportUseCase = inject(GetMonthlyReportUseCase);
  private readonly authService = inject(AuthService);
  private readonly fichajeApprovalFacade = inject(FichajeApprovalFacade);
  private readonly appAlertService = inject(AppAlertService);
  private readonly vacService = inject(SupabaseVacacionesService);
  private readonly destroyRef = inject(DestroyRef);

  /** ISO dates (YYYY-MM-DD) que tienen vacaciones aprobadas */
  private readonly approvedVacationDates = signal<Set<string>>(new Set());

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
  adjustmentDrafts = signal<AdjustmentDraft[]>([]);
  adjustmentSubmitting = signal(false);

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

  canSubmitAdjustments = computed(() => {
    const user = this.authService.getCurrentUser();
    const day = this.selectedDay();
    if (!user || !day) {
      return false;
    }
    return user.role === UserRole.EMPLOYEE && !day.isFuture;
  });

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserId.set(user?.id ?? '3');
    this.loadMonthData();
    this.loadApprovedVacations();
  }

  private loadApprovedVacations(): void {
    const userId = this.currentUserId();
    this.vacService.getMyRequests(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(requests => {
        const dates = new Set<string>();
        for (const req of requests) {
          if (req.status !== 'approved') continue;
          const cur = new Date(req.start_date + 'T00:00:00');
          const end = new Date(req.end_date + 'T00:00:00');
          while (cur <= end) {
            dates.add(cur.toISOString().slice(0, 10));
            cur.setDate(cur.getDate() + 1);
          }
        }
        this.approvedVacationDates.set(dates);
      });
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
    this.adjustmentDrafts.set([]);
  }

  closeDetail(): void {
    this.selectedDay.set(null);
    this.adjustmentDrafts.set([]);
  }

  addAdjustmentDraft(): void {
    if (!this.canSubmitAdjustments()) {
      return;
    }

    this.adjustmentDrafts.update(drafts => [
      ...drafts,
      {
        id: this.makeDraftId(),
        type: 'Entrada',
        time: '09:00',
        note: '',
      },
    ]);
  }

  updateDraftType(id: string, event: Event): void {
    const value = (event.target as HTMLSelectElement).value as AdjustmentType;
    this.adjustmentDrafts.update(drafts => drafts.map(draft => draft.id === id ? { ...draft, type: value } : draft));
  }

  updateDraftTime(id: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.adjustmentDrafts.update(drafts => drafts.map(draft => draft.id === id ? { ...draft, time: value } : draft));
  }

  updateDraftNote(id: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.adjustmentDrafts.update(drafts => drafts.map(draft => draft.id === id ? { ...draft, note: value } : draft));
  }

  removeDraft(id: string): void {
    this.adjustmentDrafts.update(drafts => drafts.filter(draft => draft.id !== id));
  }

  submitAdjustmentRequests(): void {
    const user = this.authService.getCurrentUser();
    const day = this.selectedDay();
    const drafts = this.adjustmentDrafts();

    if (!user || !day || drafts.length === 0) {
      return;
    }

    if (!user.managerId) {
      this.appAlertService.warning('Sin manager asignado', 'No se puede enviar la solicitud hasta que tengas manager asignado.');
      return;
    }

    const validationError = this.validateDrafts(day.entries, drafts);
    if (validationError) {
      this.appAlertService.warning('Solicitud no válida', validationError);
      return;
    }

    const dateIso = toIsoDate(day.date);
    this.adjustmentSubmitting.set(true);

    const requests = drafts.map(draft =>
      this.fichajeApprovalFacade.submitRequest({
        userId: user.id,
        managerId: user.managerId,
        dateIso,
        hours: draft.time,
        description: `Solicitud ajuste ${draft.type.toLowerCase()}: ${draft.note.trim() || 'sin comentario'}`,
      }),
    );

    forkJoin(requests)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.adjustmentDrafts.set([]);
          this.adjustmentSubmitting.set(false);
          this.appAlertService.success('Solicitud enviada', 'El manager ya puede revisar tus ajustes de fichaje.');
        },
        error: () => {
          this.adjustmentSubmitting.set(false);
          this.appAlertService.warning('Error', 'No se pudieron enviar las solicitudes de ajuste.');
        },
      });
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

  isParsableDate(value: string): boolean {
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
  }

  isTodayEntry(value: string): boolean {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return true;
    }
    return this.isSameDate(date, this.today);
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
    const iso = toIsoDate(date);
    const isVacation = this.approvedVacationDates().has(iso);
    const defaultStatus: DayStatus = isVacation ? 'vacation' : (isWeekend ? 'weekend' : 'not-clocked');
    const dayStatus = isVacation ? 'vacation' : (report?.status ?? defaultStatus);

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

  private validateDrafts(entries: TimelineEntry[], drafts: AdjustmentDraft[]): string | null {
    const timeline = this.buildValidationTimeline(entries, drafts);
    let openStart: number | null = null;
    let totalWorked = 0;

    for (const item of timeline) {
      if (item.type === 'in') {
        if (openStart !== null) {
          return 'Hay entradas consecutivas sin una salida intermedia.';
        }
        openStart = item.minutes;
        continue;
      }

      if (openStart === null) {
        return 'Hay una salida sin una entrada previa en la línea temporal del día.';
      }

      const delta = item.minutes - openStart;
      if (delta < 0) {
        return 'El orden de horas no es válido. Revisa las horas de entrada y salida.';
      }
      totalWorked += delta;
      openStart = null;
    }

    if (openStart !== null) {
      return 'Falta una salida para completar una entrada en las solicitudes de ajuste.';
    }

    if (totalWorked > CalendarPage.MAX_DAILY_MINUTES) {
      return `La jornada total del día no puede superar ${CalendarPage.MAX_DAILY_MINUTES / 60} horas.`;
    }

    return null;
  }

  private buildValidationTimeline(entries: TimelineEntry[], drafts: AdjustmentDraft[]): Array<{ type: 'in' | 'out'; minutes: number }> {
    const existing = entries
      .filter(entry => entry.type === 'in' || entry.type === 'out' || entry.type === 'pause')
      .map(entry => ({
        type: entry.type === 'in' ? 'in' as const : 'out' as const,
        minutes: this.toMinutes(entry.time),
      }));

    const requested = drafts.map(draft => ({
      type: draft.type === 'Entrada' ? 'in' as const : 'out' as const,
      minutes: this.toMinutes(draft.time),
    }));

    return [...existing, ...requested].sort((a, b) => {
      if (a.minutes !== b.minutes) {
        return a.minutes - b.minutes;
      }
      if (a.type === b.type) {
        return 0;
      }
      return a.type === 'in' ? -1 : 1;
    });
  }

  private toMinutes(value: string): number {
    if (value.includes('T')) {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return date.getHours() * 60 + date.getMinutes();
      }
    }

    const [h, m] = value.split(':').map(Number);
    const hours = Number.isFinite(h) ? h : 0;
    const minutes = Number.isFinite(m) ? m : 0;
    return hours * 60 + minutes;
  }

  private makeDraftId(): string {
    return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
