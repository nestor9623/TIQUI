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

type EntryType = 'Entrada' | 'Salida' | 'Pausa';

interface HistoryEntry {
  time: string;
  type: EntryType;
  label: string;
}

interface CalendarRules {
  defaultDailyHoursTarget: number;
  communities: Record<string, { holidays: string[] }>;
  managerWeekendOverrides: Array<{ userId: string; date_iso: string; reason: string }>;
}

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

  selectedDate = signal(new Date());
  timeInput = signal(this.getCurrentTime());
  typeInput = signal<EntryType>('Entrada');
  description = signal('');
  entries = signal<HistoryEntry[]>([]);
  dayBlockedMessage = signal<string | null>(null);

  private history: Record<string, HistoryEntry[]> = {};
  private calendarRules: CalendarRules | null = null;

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

  totalWorked = computed(() => this.formatDuration(this.calculateWorkedMinutes(this.entries())));
  totalPause = computed(() => this.formatDuration(this.calculatePauseMinutes(this.entries())));
  currentStatus = computed(() => this.getDayStatus(this.entries()));

  constructor() {
    this.seedHistory();
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

    if (this.isDayApproved(this.selectedDate())) {
      const message = texts.approvedDayMessage;
      this.dayBlockedMessage.set(message);
      this.appAlertService.warning(texts.approvedDayTitle, message);
      return;
    }

    const entry: HistoryEntry = {
      time: this.timeInput(),
      type: this.typeInput(),
      label: this.description() || this.typeInput(),
    };

    const updated = [...this.entries(), entry].sort((a, b) => a.time.localeCompare(b.time));
    this.entries.set(updated);
    this.history[toIsoDate(this.selectedDate())] = updated;
    this.description.set('');
    this.dayBlockedMessage.set(null);
    this.appAlertService.success(
      texts.registeredTitle,
      this.interpolate(texts.registeredMessage, { type: entry.type, time: entry.time }),
    );
  }

  private seedHistory(): void {
    const today = new Date();
    this.history = {
      [toIsoDate(today)]: [
        { time: '08:30', type: 'Entrada', label: 'Entrada - Teletrabajo' },
        { time: '14:00', type: 'Pausa', label: 'Almuerzo' },
        { time: '15:00', type: 'Entrada', label: 'Retorno' },
        { time: '17:35', type: 'Salida', label: 'Salida' },
      ],
      [toIsoDate(this.addDays(today, -1))]: [
        { time: '08:45', type: 'Entrada', label: 'Entrada - Oficina' },
        { time: '12:30', type: 'Pausa', label: 'Almuerzo' },
        { time: '13:30', type: 'Entrada', label: 'Retorno' },
        { time: '17:15', type: 'Salida', label: 'Salida' },
      ],
    };
  }

  private loadRules(): void {
    this.jsonLoader.loadJson<CalendarRules>(MOCK_PATHS.calendarRules)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(rules => {
        this.calendarRules = rules;
        this.loadEntriesForDate(this.selectedDate());
      });
  }

  private loadEntriesForDate(date: Date): void {
    const key = toIsoDate(date);
    const blockedReason = this.resolveBlockedReason(date);
    this.dayBlockedMessage.set(blockedReason);

    if (!this.history[key] && this.isVacationDate(date)) {
      this.history[key] = [
        { time: '08:00', type: 'Entrada', label: 'Vacaciones (tramo 1)' },
        { time: '14:00', type: 'Pausa', label: 'Corte automático' },
        { time: '15:00', type: 'Entrada', label: 'Vacaciones (tramo 2)' },
        { time: '17:00', type: 'Salida', label: 'Cierre automático' },
      ];
    }

    this.entries.set(this.history[key] ?? []);
  }

  private resolveBlockedReason(date: Date): string | null {
    const isoDate = toIsoDate(date);
    const dayOfWeek = date.getDay();
    const user = this.authService.getCurrentUser();
    const rules = this.calendarRules;
    if (!rules || !user) {
      return null;
    }
    if (this.isVacationDate(date)) {
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

  private isVacationDate(date: Date): boolean {
    const user = this.authService.getCurrentUser();
    return Boolean(user?.vacationDates?.includes(toIsoDate(date)));
  }

  private isDayApproved(date: Date): boolean {
    return this.entries().some(entry => entry.type === 'Salida') && date < new Date();
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

  private parseMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private formatDuration(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }

  private calculateWorkedMinutes(entries: HistoryEntry[]): number {
    let total = 0;
    let lastIn: number | null = null;

    for (const entry of entries) {
      if (entry.type === 'Entrada') {
        lastIn = this.parseMinutes(entry.time);
      } else if ((entry.type === 'Salida' || entry.type === 'Pausa') && lastIn !== null) {
        total += this.parseMinutes(entry.time) - lastIn;
        lastIn = null;
      }
    }

    if (lastIn !== null) {
      total += this.parseMinutes(this.getCurrentTime()) - lastIn;
    }

    const pauseMinutes = this.calculatePauseMinutes(entries);
    total = Math.max(total - pauseMinutes, 0);
    return Math.min(total, 9 * 60);
  }

  private calculatePauseMinutes(entries: HistoryEntry[]): number {
    let total = 0;
    let pauseStart: number | null = null;

    for (const entry of entries) {
      if (entry.type === 'Pausa') {
        pauseStart = this.parseMinutes(entry.time);
      } else if (pauseStart !== null && entry.type === 'Entrada') {
        total += this.parseMinutes(entry.time) - pauseStart;
        pauseStart = null;
      }
    }

    if (pauseStart !== null) {
      total += this.parseMinutes(this.getCurrentTime()) - pauseStart;
    }

    return Math.max(total, 0);
  }

  private getDayStatus(entries: HistoryEntry[]): string {
    if (!entries.length) {
      return 'Sin fichar';
    }

    const last = entries[entries.length - 1];
    if (last.type === 'Salida') {
      return 'Jornada finalizada';
    }
    if (last.type === 'Pausa') {
      return 'En pausa';
    }
    return 'Trabajando';
  }
}

