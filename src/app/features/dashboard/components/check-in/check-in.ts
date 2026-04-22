import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { WorklogDashboardFacade } from '../../../../core/application/services/worklog-dashboard.facade';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { TimelineEntry } from '../../../../core/domain/entities/report.entity';
import { SupabaseVacacionesService } from '../../../../core/infraestructure/repositories/supabase-vacaciones.service';

@Component({
  selector: 'app-check-in',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './check-in.html',
  styleUrl: './check-in.scss',
})
export class CheckInComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly facade = inject(WorklogDashboardFacade);
  private readonly vacService = inject(SupabaseVacacionesService);
  private readonly destroyRef = inject(DestroyRef);

  currentTime = signal<string>('00:00');
  isCheckedIn = signal<boolean>(false);
  lastCheckTime = signal<string>('00:00');
  lastCheckType = signal<'Entrada' | 'Salida'>('Entrada');
  todayEntries = signal<TimelineEntry[]>([]);
  isOnVacation = signal<boolean>(false);

  ngOnInit(): void {
    const userId = this.authService.getCurrentUser()?.id ?? '3';
    const todayIso = new Date().toISOString().slice(0, 10);
    this.updateTime();

    // Comprobar si el empleado está de vacaciones hoy
    this.vacService.isUserOnVacation(userId, todayIso)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(onVacation => this.isOnVacation.set(onVacation));

    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateTime());

    this.facade.getTodayReport(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(report => {
        const entries = report?.entries ?? [];
        this.todayEntries.set(entries);

        const lastEntry = entries.at(-1);
        if (lastEntry) {
          this.lastCheckTime.set(lastEntry.time);
          const mappedType: 'Entrada' | 'Salida' = lastEntry.type === 'out' ? 'Salida' : 'Entrada';
          this.lastCheckType.set(mappedType);
          this.isCheckedIn.set(lastEntry.type === 'in');
          return;
        }

        this.lastCheckTime.set('00:00');
        this.lastCheckType.set('Entrada');
        this.isCheckedIn.set(false);
      });
  }

  ngOnDestroy(): void {
    // Managed by takeUntilDestroyed.
  }

  handleCheckIn(): void {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;

    this.lastCheckTime.set(currentTime);
    this.lastCheckType.set(this.isCheckedIn() ? 'Salida' : 'Entrada');
    this.isCheckedIn.update(value => !value);
  }

  toggleCheckType(): void {
    this.isCheckedIn.update(value => !value);
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

  private updateTime(): void {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    this.currentTime.set(`${hours}:${minutes}`);
  }
}
