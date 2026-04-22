import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DateNavigatorComponent } from '../components/date-navigator/date-navigator';
import { HistoryTableComponent } from '../components/history-table/history-table';
import { SummaryCardComponent } from '../components/summary-card/summary-card';
import { TimeEntryFormComponent } from '../components/time-entry-form/time-entry-form';
import { MockJsonLoaderService } from '../../../core/mock/services/mock-json-loader.service';
import { MOCK_PATHS } from '../../../core/mock/mock-config';
import { AuthService } from '../../../core/auth/services/auth.service';
import { I18nStore } from '../../../core/i18n/i18n.store';
import { toIsoDate } from '../../../core/utils/date.utils';
import { AppAlertService } from '../../../shared/services/app-alert.service';
import { FichajeFlowFacade } from '../../../core/application/services/fichaje-flow.facade';
import { EntryType, HistoryEntry } from '../../../core/domain/models/timeline-entry.model';
import { CalendarRules } from '../../../core/domain/models/calendar-rules.model';

@Component({
  selector: 'app-fichajes',
  standalone: true,
  imports: [
    CommonModule,
    DateNavigatorComponent,
    HistoryTableComponent,
    SummaryCardComponent,
    TimeEntryFormComponent,
  ],
  templateUrl: './fichajes.html',
  styleUrl: './fichajes.scss',
})
export class FichajesPage {
  private readonly jsonLoader = inject(MockJsonLoaderService);
  private readonly authService = inject(AuthService);
  private readonly i18n = inject(I18nStore);
  private readonly appAlertService = inject(AppAlertService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fichajeFlow = inject(FichajeFlowFacade);

  selectedDate = signal(new Date());
  timeInput = signal(this.getCurrentTime());
  typeInput = signal<EntryType>('Entrada');
  description = signal('');
  entries = signal<HistoryEntry[]>([]);
  dayBlockedMessage = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);

  private calendarRules: CalendarRules | null = null;

  allowedActions = computed(() => this.fichajeFlow.computeAllowedActions(this.entries()));
  isDayClosed = computed(() => this.allowedActions().length === 0);

  formattedSelectedDate = computed(() => {
    const date = this.selectedDate();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('es-ES', options);
  });

  totalWorked = computed(() => this.fichajeFlow.computeWorkedFormatted(this.entries()));
  totalPause = computed(() => this.fichajeFlow.computePauseFormatted(this.entries()));
  currentStatus = computed(() => this.fichajeFlow.computeStatusLabel(this.entries()));

  constructor() {
    this.loadRules();
    this.loadEntriesForDate(this.selectedDate());
  }

  prevDay(): void {
    const prev = this.addDays(this.selectedDate(), -1);
    this.selectedDate.set(prev);
    this.loadEntriesForDate(prev);
    this.timeInput.set(this.getCurrentTime());
  }

  nextDay(): void {
    const next = this.addDays(this.selectedDate(), 1);
    this.selectedDate.set(next);
    this.loadEntriesForDate(next);
    this.timeInput.set(this.getCurrentTime());
  }

  addEntry(): void {
    const texts = this.i18n.translations().alerts.checkins;
    const blockedReason = this.resolveBlockedReason(this.selectedDate());
    if (blockedReason) {
      this.dayBlockedMessage.set(blockedReason);
      this.appAlertService.warning(texts.blockedTitle, blockedReason);
      return;
    }

    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.saving.set(true);
    this.fichajeFlow
      .addEvent(user.id, toIsoDate(this.selectedDate()), this.typeInput(), this.timeInput(), this.description())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updatedEntries => {
          this.entries.set(updatedEntries);
          this.description.set('');
          this.dayBlockedMessage.set(null);
          this.saving.set(false);
          // Auto-select next allowed action
          const allowed = this.fichajeFlow.computeAllowedActions(updatedEntries);
          if (allowed.length > 0) this.typeInput.set(allowed[0]);
          this.appAlertService.success(
            texts.registeredTitle,
            this.interpolate(texts.registeredMessage, { type: this.typeInput(), time: this.timeInput() }),
          );
        },
        error: () => {
          this.saving.set(false);
          this.appAlertService.warning('Error', 'No se pudo guardar el fichaje. Inténtalo de nuevo.');
        },
      });
  }

  private loadRules(): void {
    this.jsonLoader.loadJson<CalendarRules>(MOCK_PATHS.calendarRules)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(rules => {
        this.calendarRules = rules;
      });
  }

  private loadEntriesForDate(date: Date): void {
    const blockedReason = this.resolveBlockedReason(date);
    this.dayBlockedMessage.set(blockedReason);

    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.loading.set(true);
    this.fichajeFlow
      .loadDayEntries(user.id, toIsoDate(date))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: entries => {
          this.entries.set(entries);
          this.loading.set(false);
          // Auto-select first allowed action
          const allowed = this.fichajeFlow.computeAllowedActions(entries);
          if (allowed.length > 0) this.typeInput.set(allowed[0]);
        },
        error: () => {
          this.entries.set([]);
          this.loading.set(false);
        },
      });
  }

  private resolveBlockedReason(date: Date): string | null {
    const isoDate = toIsoDate(date);
    const dayOfWeek = date.getDay();
    const user = this.authService.getCurrentUser();
    const rules = this.calendarRules;
    if (!rules || !user) return null;

    if (user.vacationDates?.includes(isoDate)) {
      return this.i18n.translations().alerts.checkins.vacationBlockedMessage;
    }

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const weekendEnabled = rules.managerWeekendOverrides.some(
      item => item.userId === user.id && item.date_iso === isoDate,
    );
    if (isWeekend && !weekendEnabled) {
      return this.i18n.translations().alerts.checkins.weekendBlockedMessage;
    }

    const community = user.community ?? 'madrid';
    const holidays = rules.communities[community]?.holidays ?? [];
    if (holidays.includes(isoDate)) {
      return this.i18n.translations().alerts.checkins.holidayBlockedMessage;
    }

    return null;
  }

  private interpolate(template: string, values: Record<string, string | number>): string {
    return Object.entries(values).reduce(
      (message, [key, value]) => message.replaceAll(`{{${key}}}`, String(value)),
      template,
    );
  }

  private getCurrentTime(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}

