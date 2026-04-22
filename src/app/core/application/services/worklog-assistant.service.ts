import { Injectable, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, combineLatest, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { User, UserRole } from '../../auth/models/auth.model';
import { DailyReport } from '../../domain/entities/report.entity';
import { I18nStore } from '../../i18n/i18n.store';
import { IncidenciasFacade } from './incidencias.facade';
import { DashboardSummary, WorklogDashboardFacade } from './worklog-dashboard.facade';

const ASSISTANT_INBOX_STORAGE_KEY = 'tiqui.assistant.reviewed-alerts';

export type AssistantSeverity = 'info' | 'warning' | 'success';

export interface WorklogAssistantAlert {
  id: string;
  fingerprint: string;
  severity: AssistantSeverity;
  title: string;
  message: string;
  actionLabel?: string;
  route?: string;
}

export interface WorklogAssistantSnapshot {
  headline: string;
  summary: string;
  statusLabel: string;
  dailyBalanceLabel: string;
  weeklyBalanceLabel: string;
  suggestedStartTime: string | null;
  suggestedEndTime: string | null;
  incidentCount: number;
  unreadCount: number;
  alerts: WorklogAssistantAlert[];
}

export const EMPTY_ASSISTANT_SNAPSHOT: WorklogAssistantSnapshot = {
  headline: '',
  summary: '',
  statusLabel: '',
  dailyBalanceLabel: '0h 00m',
  weeklyBalanceLabel: '0h 00m',
  suggestedStartTime: null,
  suggestedEndTime: null,
  incidentCount: 0,
  unreadCount: 0,
  alerts: [],
};

@Injectable({ providedIn: 'root' })
export class WorklogAssistantService {
  private readonly authService = inject(AuthService);
  private readonly i18n = inject(I18nStore);
  private readonly dashboardFacade = inject(WorklogDashboardFacade);
  private readonly incidenciasFacade = inject(IncidenciasFacade);
  private readonly authState$ = toObservable(this.authService.auth);
  private readonly reviewedAlertsState = signal<Record<string, string[]>>(this.readReviewedAlerts());
  private readonly reviewedAlerts$ = toObservable(this.reviewedAlertsState);
  private readonly translations$ = toObservable(this.i18n.translations);

  getSnapshot(baseDate: Date = new Date()): Observable<WorklogAssistantSnapshot> {
    return combineLatest([this.authState$, this.reviewedAlerts$, this.translations$]).pipe(
      map(([auth]) => auth.user),
      switchMap(user => {
        if (!user) {
          return of({
            ...EMPTY_ASSISTANT_SNAPSHOT,
            headline: this.i18n.translations().assistant.fallback.inactiveHeadline,
            summary: this.i18n.translations().assistant.fallback.inactiveSummary,
            statusLabel: this.i18n.translations().assistant.status.inactive,
          });
        }

        const summary$ = this.dashboardFacade.getDashboardSummary(user.id, baseDate);
        const incidentCount$ = user.role === UserRole.EMPLOYEE
          ? of(0)
          : (user.role === UserRole.MANAGER
            ? this.incidenciasFacade.getByManager(user.id)
            : this.incidenciasFacade.getAll()
          ).pipe(map(items => items.length));

        return combineLatest([summary$, incidentCount$]).pipe(
          map(([summary, incidentCount]) => this.buildSnapshot(user, summary, incidentCount, baseDate)),
        );
      }),
    );
  }

  markAlertAsRead(alertFingerprint: string): void {
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId || !alertFingerprint) {
      return;
    }

    this.reviewedAlertsState.update(current => {
      const existing = current[userId] ?? [];
      if (existing.includes(alertFingerprint)) {
        return current;
      }

      const updated = {
        ...current,
        [userId]: [...existing, alertFingerprint],
      };
      this.persistReviewedAlerts(updated);
      return updated;
    });
  }

  dismissAlert(alertFingerprint: string): void {
    this.markAlertAsRead(alertFingerprint);
  }

  dismissAllAlerts(alerts: WorklogAssistantAlert[]): void {
    for (const alert of alerts) {
      this.markAlertAsRead(alert.fingerprint);
    }
  }

  private buildSnapshot(
    user: User,
    summary: DashboardSummary,
    incidentCount: number,
    baseDate: Date,
  ): WorklogAssistantSnapshot {
    const assistantTexts = this.i18n.translations().assistant;
    const dailyTargetMinutes = this.resolveDailyTargetMinutes(user);
    const weeklyTargetMinutes = dailyTargetMinutes * this.getElapsedWeekdays(baseDate);
    const todayMinutes = summary.todayReport?.totalMinutes ?? 0;
    const dailyBalanceMinutes = todayMinutes - dailyTargetMinutes;
    const weeklyBalanceMinutes = summary.weeklyTotalMinutes - weeklyTargetMinutes;
    const suggestedStartTime = this.getSuggestedStartTime(summary.todayReport, dailyBalanceMinutes);
    const suggestedEndTime = this.getSuggestedEndTime(summary.todayReport, dailyTargetMinutes, baseDate);
    const allAlerts = this.buildAlerts({
      user,
      todayReport: summary.todayReport,
      dailyBalanceMinutes,
      weeklyBalanceMinutes,
      incidentCount,
      dailyTargetMinutes,
      suggestedStartTime,
      suggestedEndTime,
      baseDate,
    });
    const reviewedFingerprints = new Set(this.reviewedAlertsState()[user.id] ?? []);
    const alerts = allAlerts.filter(alert => !reviewedFingerprints.has(alert.fingerprint));
    const primaryAlert = alerts[0];
    const hasPendingAlerts = alerts.length > 0;

    return {
      headline: primaryAlert?.title ?? assistantTexts.fallback.noPendingHeadline,
      summary: primaryAlert?.message ?? assistantTexts.fallback.noPendingSummary,
      statusLabel: this.getStatusLabel(summary.todayReport, dailyBalanceMinutes),
      dailyBalanceLabel: this.formatSignedDuration(dailyBalanceMinutes),
      weeklyBalanceLabel: this.formatSignedDuration(weeklyBalanceMinutes),
      suggestedStartTime,
      suggestedEndTime,
      incidentCount,
      unreadCount: hasPendingAlerts ? alerts.length : 0,
      alerts: alerts.slice(0, 4),
    };
  }

  private buildAlerts(context: {
    user: User;
    todayReport: DailyReport | null;
    dailyBalanceMinutes: number;
    weeklyBalanceMinutes: number;
    incidentCount: number;
    dailyTargetMinutes: number;
    suggestedStartTime: string | null;
    suggestedEndTime: string | null;
    baseDate: Date;
  }): WorklogAssistantAlert[] {
    const alerts: WorklogAssistantAlert[] = [];
    const texts = this.i18n.translations().assistant.alerts;
    const { todayReport, dailyBalanceMinutes, weeklyBalanceMinutes, incidentCount, suggestedStartTime, suggestedEndTime, baseDate } = context;

    if (!todayReport || todayReport.totalMinutes === 0) {
      alerts.push({
        id: 'missing-checkin',
        fingerprint: this.buildFingerprint('missing-checkin', texts.missingCheckin.title, texts.missingCheckin.message),
        severity: 'warning',
        title: texts.missingCheckin.title,
        message: texts.missingCheckin.message,
        actionLabel: texts.missingCheckin.action,
        route: '/fichajes',
      });
      return alerts;
    }

    if ((todayReport.status === 'clocked-in' || todayReport.status === 'on-pause') && suggestedEndTime) {
      alerts.push({
        id: 'suggested-end',
        fingerprint: this.buildFingerprint(
          'suggested-end',
          dailyBalanceMinutes >= 60 ? texts.suggestedEnd.titleExceeded : texts.suggestedEnd.titleAligned,
          dailyBalanceMinutes >= 60
            ? this.interpolate(texts.suggestedEnd.messageExceeded, { time: suggestedEndTime ?? '' })
            : this.interpolate(texts.suggestedEnd.messageAligned, { time: suggestedEndTime ?? '' }),
        ),
        severity: dailyBalanceMinutes >= 60 ? 'warning' : 'info',
        title: dailyBalanceMinutes >= 60 ? texts.suggestedEnd.titleExceeded : texts.suggestedEnd.titleAligned,
        message: dailyBalanceMinutes >= 60
          ? this.interpolate(texts.suggestedEnd.messageExceeded, { time: suggestedEndTime ?? '' })
          : this.interpolate(texts.suggestedEnd.messageAligned, { time: suggestedEndTime ?? '' }),
        actionLabel: texts.suggestedEnd.action,
        route: '/fichajes',
      });
    }

    if (todayReport.status === 'clocked-out' && Math.abs(dailyBalanceMinutes) >= 30 && suggestedStartTime) {
      alerts.push({
        id: 'suggested-start',
        fingerprint: this.buildFingerprint(
          'suggested-start',
          dailyBalanceMinutes > 0 ? texts.suggestedStart.titlePositive : texts.suggestedStart.titleNegative,
          dailyBalanceMinutes > 0
            ? this.interpolate(texts.suggestedStart.messagePositive, { time: suggestedStartTime ?? '' })
            : this.interpolate(texts.suggestedStart.messageNegative, { time: suggestedStartTime ?? '' }),
        ),
        severity: dailyBalanceMinutes > 0 ? 'success' : 'warning',
        title: dailyBalanceMinutes > 0 ? texts.suggestedStart.titlePositive : texts.suggestedStart.titleNegative,
        message: dailyBalanceMinutes > 0
          ? this.interpolate(texts.suggestedStart.messagePositive, { time: suggestedStartTime ?? '' })
          : this.interpolate(texts.suggestedStart.messageNegative, { time: suggestedStartTime ?? '' }),
        actionLabel: texts.suggestedStart.action,
        route: '/home',
      });
    }

    const continuousWorkMinutes = this.getContinuousWorkMinutes(todayReport, baseDate);
    if (continuousWorkMinutes >= 180) {
      alerts.push({
        id: 'break-reminder',
        fingerprint: this.buildFingerprint(
          'break-reminder',
          texts.breakReminder.title,
          this.interpolate(texts.breakReminder.message, { duration: this.formatAbsoluteDuration(continuousWorkMinutes) }),
        ),
        severity: 'info',
        title: texts.breakReminder.title,
        message: this.interpolate(texts.breakReminder.message, { duration: this.formatAbsoluteDuration(continuousWorkMinutes) }),
        actionLabel: texts.breakReminder.action,
        route: '/fichajes',
      });
    }

    if (Math.abs(weeklyBalanceMinutes) >= 120 && suggestedStartTime) {
      alerts.push({
        id: 'weekly-balance',
        fingerprint: this.buildFingerprint(
          'weekly-balance',
          weeklyBalanceMinutes > 0 ? texts.weeklyBalance.titlePositive : texts.weeklyBalance.titleNegative,
          weeklyBalanceMinutes > 0
            ? this.interpolate(texts.weeklyBalance.messagePositive, { duration: this.formatAbsoluteDuration(weeklyBalanceMinutes), time: suggestedStartTime ?? '' })
            : this.interpolate(texts.weeklyBalance.messageNegative, { duration: this.formatAbsoluteDuration(Math.abs(weeklyBalanceMinutes)) }),
        ),
        severity: weeklyBalanceMinutes > 0 ? 'success' : 'warning',
        title: weeklyBalanceMinutes > 0 ? texts.weeklyBalance.titlePositive : texts.weeklyBalance.titleNegative,
        message: weeklyBalanceMinutes > 0
          ? this.interpolate(texts.weeklyBalance.messagePositive, { duration: this.formatAbsoluteDuration(weeklyBalanceMinutes), time: suggestedStartTime ?? '' })
          : this.interpolate(texts.weeklyBalance.messageNegative, { duration: this.formatAbsoluteDuration(Math.abs(weeklyBalanceMinutes)) }),
        actionLabel: texts.weeklyBalance.action,
        route: '/home',
      });
    }

    if (incidentCount > 0 && context.user.role !== UserRole.EMPLOYEE) {
      alerts.push({
        id: 'incidents-pending',
        fingerprint: this.buildFingerprint(
          'incidents-pending',
          this.interpolate(texts.incidentsPending.title, { count: incidentCount }),
          texts.incidentsPending.message,
        ),
        severity: 'warning',
        title: this.interpolate(texts.incidentsPending.title, { count: incidentCount }),
        message: texts.incidentsPending.message,
        actionLabel: texts.incidentsPending.action,
        route: '/incidencias',
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        id: 'balanced-day',
        fingerprint: this.buildFingerprint(
          'balanced-day',
          texts.balancedDay.title,
          texts.balancedDay.message,
        ),
        severity: 'success',
        title: texts.balancedDay.title,
        message: texts.balancedDay.message,
        actionLabel: texts.balancedDay.action,
        route: '/home',
      });
    }

    return alerts.slice(0, 4);
  }

  private resolveDailyTargetMinutes(user: User): number {
    const weeklyHoursTarget = user.weeklyHoursTarget ?? 40;
    return Math.round((weeklyHoursTarget / 5) * 60);
  }

  private getElapsedWeekdays(baseDate: Date): number {
    const day = baseDate.getDay();
    if (day === 0) {
      return 5;
    }
    if (day === 6) {
      return 5;
    }
    return Math.min(day, 5);
  }

  private getSuggestedStartTime(todayReport: DailyReport | null, dailyBalanceMinutes: number): string | null {
    if (Math.abs(dailyBalanceMinutes) < 30) {
      return null;
    }

    const referenceTime = todayReport?.entries.find(entry => entry.type === 'in')?.time ?? '09:00';
    const adjusted = this.parseTime(referenceTime) + dailyBalanceMinutes;
    return this.formatTime(this.clamp(adjusted, 7 * 60, 11 * 60));
  }

  private getSuggestedEndTime(todayReport: DailyReport | null, dailyTargetMinutes: number, baseDate: Date): string | null {
    if (!todayReport || (todayReport.status !== 'clocked-in' && todayReport.status !== 'on-pause')) {
      return null;
    }

    const remainingMinutes = Math.max(dailyTargetMinutes - todayReport.totalMinutes, 0);
    return this.formatTime(this.parseTime(this.getCurrentTime(baseDate)) + remainingMinutes);
  }

  private getContinuousWorkMinutes(todayReport: DailyReport | null, baseDate: Date): number {
    if (!todayReport || (todayReport.status !== 'clocked-in' && todayReport.status !== 'on-pause')) {
      return 0;
    }

    let latestOpenBlock: number | null = null;

    for (const entry of todayReport.entries) {
      if (entry.type === 'in') {
        latestOpenBlock = this.parseTime(entry.time);
      }

      if (entry.type === 'pause' || entry.type === 'out') {
        latestOpenBlock = null;
      }
    }

    if (latestOpenBlock === null) {
      return 0;
    }

    return Math.max(this.parseTime(this.getCurrentTime(baseDate)) - latestOpenBlock, 0);
  }

  private getStatusLabel(todayReport: DailyReport | null, dailyBalanceMinutes: number): string {
    const texts = this.i18n.translations().assistant.status;
    if (!todayReport || todayReport.totalMinutes === 0) {
      return texts.pending;
    }
    if (dailyBalanceMinutes >= 60) {
      return texts.excess;
    }
    if (dailyBalanceMinutes <= -45 && todayReport.status === 'clocked-out') {
      return texts.adjust;
    }
    if (todayReport.status === 'clocked-out') {
      return texts.closed;
    }
    return texts.active;
  }

  private formatSignedDuration(totalMinutes: number): string {
    const sign = totalMinutes > 0 ? '+' : totalMinutes < 0 ? '-' : '';
    return `${sign}${this.formatAbsoluteDuration(Math.abs(totalMinutes))}`;
  }

  private formatAbsoluteDuration(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }

  private parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(value => Number(value));
    return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
  }

  private formatTime(totalMinutes: number): string {
    const normalized = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
    const hours = Math.floor(normalized / 60);
    const minutes = normalized % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  private getCurrentTime(baseDate: Date): string {
    const hours = String(baseDate.getHours()).padStart(2, '0');
    const minutes = String(baseDate.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private buildFingerprint(id: string, title: string, message: string): string {
    return `${id}::${title}::${message}`;
  }

  private interpolate(template: string, values: Record<string, string | number>): string {
    return Object.entries(values).reduce(
      (message, [key, value]) => message.replaceAll(`{{${key}}}`, String(value)),
      template,
    );
  }

  private readReviewedAlerts(): Record<string, string[]> {
    const raw = localStorage.getItem(ASSISTANT_INBOX_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    try {
      const parsed = JSON.parse(raw) as Record<string, string[]>;
      return parsed ?? {};
    } catch {
      return {};
    }
  }

  private persistReviewedAlerts(value: Record<string, string[]>): void {
    localStorage.setItem(ASSISTANT_INBOX_STORAGE_KEY, JSON.stringify(value));
  }
}
