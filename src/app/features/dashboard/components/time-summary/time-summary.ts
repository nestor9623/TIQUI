import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WorklogDashboardFacade } from '../../../../core/application/services/worklog-dashboard.facade';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { DayStatus, TimelineEntry } from '../../../../core/domain/entities/report.entity';
import { CheckInComponent } from '../check-in/check-in';

@Component({
  selector: 'app-time-summary',
  imports: [CommonModule, CheckInComponent],
  standalone: true,
  templateUrl: './time-summary.html',
  styleUrl: './time-summary.scss',
})
export class TimeSummary implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly facade = inject(WorklogDashboardFacade);
  private readonly destroyRef = inject(DestroyRef);

  todayTimeline = signal<TimelineEntry[]>([]);
  todayHours = signal('0h 0m');
  todayProgress = signal(0);
  weeklyHours = signal('0h 0m');
  monthlyHours = signal('0h 0m');
  monthlyWorkedDays = signal(0);
  private currentStatus = signal<DayStatus>('not-clocked');

  ngOnInit(): void {
    const userId = this.authService.getCurrentUser()?.id ?? '3';

    this.facade.getDashboardSummary(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(summary => {
        const todayReport = summary.todayReport;
        const totalHours = Math.floor((todayReport?.totalMinutes ?? 0) / 60);
        const totalMinutes = (todayReport?.totalMinutes ?? 0) % 60;

        this.todayHours.set(`${totalHours}h ${totalMinutes}m`);
        this.todayTimeline.set(todayReport?.entries ?? []);
        this.currentStatus.set(this.getDayStatus());
        this.todayProgress.set(Math.min(100, Math.round(((todayReport?.totalMinutes ?? 0) / 480) * 100)));
        this.weeklyHours.set(this.formatMinutes(summary.weeklyTotalMinutes));
        this.monthlyHours.set(this.formatMinutes(summary.monthlyTotalMinutes));
        this.monthlyWorkedDays.set(summary.monthlyWorkedDays);
      });
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getEntryTime(): string {
    const firstEntry = this.todayTimeline().find(entry => entry.type === 'in');
    return firstEntry?.time ?? 'Sin fichar';
  }

  getFirstEntryTime(): string | null {
    const firstEntry = this.todayTimeline().find(entry => entry.type === 'in');
    return firstEntry?.time ?? null;
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
    const now = new Date();
    return date.getFullYear() === now.getFullYear()
      && date.getMonth() === now.getMonth()
      && date.getDate() === now.getDate();
  }

  getStatusLabel(): string {
    const status = this.getDayStatus();
    if (status === 'clocked-in') {
      return 'Trabajando';
    }
    if (status === 'on-pause') {
      return 'En pausa';
    }
    if (status === 'clocked-out') {
      return 'Jornada finalizada';
    }
    if (status === 'vacation') {
      return 'Vacaciones';
    }
    return 'Sin fichar';
  }

  getDayStatus(): DayStatus {
    const timeline = this.todayTimeline();
    if (timeline.length === 0) {
      return 'not-clocked';
    }

    const lastEntry = timeline[timeline.length - 1];
    if (lastEntry.type === 'out') {
      return 'clocked-out';
    }
    if (lastEntry.type === 'pause') {
      return 'on-pause';
    }
    return 'clocked-in';
  }

  getTodayStatusClass(): string {
    return `status-${this.currentStatus()}`;
  }

  getProgressOffset(percentage: number): number {
    const circumference = 2 * Math.PI * 45;
    return circumference - (percentage / 100) * circumference;
  }

  getDotClass(type: 'in' | 'out' | 'pause'): string {
    return `dot-${type}`;
  }

  private formatMinutes(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }
}
