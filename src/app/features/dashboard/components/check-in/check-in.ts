import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnDestroy, OnInit, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { SupabaseVacacionesService } from '../../../../core/infraestructure/repositories/supabase-vacaciones.service';
import { FichajeFlowFacade } from '../../../../core/application/services/fichaje-flow.facade';
import { EntryType, HistoryEntry } from '../../../../core/domain/models/timeline-entry.model';
import { toIsoDate } from '../../../../core/utils/date.utils';

@Component({
  selector: 'app-check-in',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './check-in.html',
  styleUrl: './check-in.scss',
})
export class CheckInComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly fichajeFlow = inject(FichajeFlowFacade);
  private readonly vacService = inject(SupabaseVacacionesService);
  private readonly destroyRef = inject(DestroyRef);

  readonly compact = input(false);

  currentTime = signal<string>('00:00');
  isCheckedIn = signal<boolean>(false);
  todayEntries = signal<HistoryEntry[]>([]);
  allowedActions = signal<EntryType[]>(['Entrada']);
  isOnVacation = signal<boolean>(false);
  saving = signal<boolean>(false);

  ngOnInit(): void {
    const userId = this.authService.getCurrentUser()?.id ?? '3';
    const todayIso = toIsoDate(new Date());
    this.updateTime();

    // Comprobar si el empleado está de vacaciones hoy
    this.vacService.isUserOnVacation(userId, todayIso)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(onVacation => this.isOnVacation.set(onVacation));

    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateTime());

    this.fichajeFlow.loadDayEntries(userId, todayIso)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(entries => {
        this.todayEntries.set(entries);
        this.allowedActions.set(this.fichajeFlow.computeAllowedActions(entries));

        const lastEntry = entries.at(-1);
        if (lastEntry) {
          this.isCheckedIn.set(lastEntry.type === 'Entrada' || lastEntry.type === 'Reanudar');
          return;
        }
        this.isCheckedIn.set(false);
      });
  }

  ngOnDestroy(): void {
    // Managed by takeUntilDestroyed.
  }

  onDirectAction(action: EntryType): void {
    if (this.isOnVacation() || this.saving()) {
      return;
    }

    const userId = this.authService.getCurrentUser()?.id ?? '3';
    const dateIso = toIsoDate(new Date());
    const time = this.currentTime();

    this.saving.set(true);
    this.fichajeFlow
      .addEvent(userId, dateIso, action, time, 'Dashboard rápido')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: entries => {
          this.todayEntries.set(entries);
          this.allowedActions.set(this.fichajeFlow.computeAllowedActions(entries));
          const lastEntry = entries.at(-1);
          this.isCheckedIn.set(lastEntry?.type === 'Entrada' || lastEntry?.type === 'Reanudar');
          this.saving.set(false);
        },
        error: () => this.saving.set(false),
      });
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

  getCheckinStatusLabel(): string {
    if (this.isOnVacation()) {
      return 'Vacaciones';
    }
    if (this.saving()) {
      return 'Guardando';
    }
    return this.isCheckedIn() ? 'En jornada' : 'Sin fichar';
  }

  getLastMovementLabel(): string {
    const lastEntry = this.todayEntries().at(-1);
    if (!lastEntry) {
      return 'Sin movimientos hoy';
    }

    return `${lastEntry.type} · ${lastEntry.time}`;
  }

  getActionClass(action: EntryType): string {
    if (action === 'Entrada') return 'btn-check-in--entry';
    if (action === 'Salida') return 'btn-check-in--exit';
    if (action === 'Pausa') return 'btn-check-in--pause';
    return 'btn-check-in--resume';
  }

  private updateTime(): void {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    this.currentTime.set(`${hours}:${minutes}`);
  }
}
