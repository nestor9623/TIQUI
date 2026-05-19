import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { User, UserRole } from '../../../../core/auth/models/auth.model';
import {
  SupabaseVacacionesService,
  VacationBalance,
  VacationRequest,
} from '../../../../core/infraestructure/repositories/supabase-vacaciones.service';
import { VacationTypeCode } from '../../../../core/infraestructure/supabase/database.types';
import { AppAlertService } from '../../../../shared/services/app-alert.service';

@Component({
  selector: 'app-vacaciones',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vacaciones.html',
  styleUrl: './vacaciones.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VacacionesPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly vacService = inject(SupabaseVacacionesService);
  private readonly alertService = inject(AppAlertService);
  private readonly destroyRef = inject(DestroyRef);

  readonly vacationForm = this.fb.nonNullable.group({
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
    vacationType: ['', [Validators.required]],
    notes: [''],
  });

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly balancesLoading = signal(true);

  readonly balances = signal<VacationBalance[]>([]);
  readonly holidays = signal<Set<string>>(new Set());
  readonly myRequests = signal<VacationRequest[]>([]);
  readonly pendingRequests = signal<VacationRequest[]>([]);
  readonly rejectingId = signal<string | null>(null);
  readonly rejectComment = signal('');
  readonly approvingId = signal<string | null>(null);
  readonly approveComment = signal('');
  private readonly loadedKey = signal<string | null>(null);

  readonly currentUser = computed(() => this.authService.getCurrentUser());
  readonly currentRole = computed(() => this.currentUser()?.role ?? UserRole.EMPLOYEE);
  readonly requiresProfileAssignment = computed(() => {
    const user = this.currentUser();
    if (!user) {
      return true;
    }

    if (user.role === UserRole.GENERIC) {
      return true;
    }

    return user.role === UserRole.EMPLOYEE && !user.managerId && !user.isTeamLeader;
  });

  readonly isManagerView = computed(
    () => this.currentRole() === UserRole.MANAGER || this.currentRole() === UserRole.ADMIN,
  );

  readonly estimatedDays = computed(() => {
    const { startDate, endDate } = this.vacationForm.getRawValue();
    if (!startDate || !endDate || startDate > endDate) return 0;
    return this.vacService.calcBusinessDaysWithHolidays(startDate, endDate, this.holidays());
  });

  readonly vacationTypeOptions = computed(() =>
    this.balances().map(item => ({
      value: item.code,
      label: item.label,
      disabled: item.available <= 0,
      badge: `${item.available} días disponibles`,
    })),
  );
  readonly showNoTypesHint = computed(() => !this.balancesLoading() && this.vacationTypeOptions().length === 0);

  readonly todayIso = new Date().toISOString().slice(0, 10);

  constructor() {
    effect(() => {
      const user = this.currentUser();
      if (!user) {
        return;
      }

      const key = `${user.id}:${user.role}`;
      if (this.loadedKey() === key) {
        return;
      }

      this.loadedKey.set(key);
      this.loadData(user);
    });
  }

  private loadData(user: User): void {
    this.loading.set(true);
    this.balancesLoading.set(true);
    const year = new Date().getFullYear();

    // Cargar balances desde BD
    this.vacService.getBalancesForUser(user.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(balances => {
          if (balances.length > 0) {
            return of({ balances, fallback: false as const });
          }

          return this.vacService.getCatalogBalancesFallback().pipe(
            map(fallbackBalances => ({ balances: fallbackBalances, fallback: true as const })),
          );
        }),
        catchError((err: { message?: string }) =>
          this.vacService.getCatalogBalancesFallback().pipe(
            map(fallbackBalances => ({ balances: fallbackBalances, fallback: true as const, rpcError: err })),
          ),
        ),
      )
      .subscribe({
        next: result => {
          this.balances.set(result.balances);
          this.balancesLoading.set(false);
          if (result.fallback) {
            const details = 'Se cargaron tipos desde catálogo (sin consumo histórico).';
            const reason = 'rpcError' in result
              ? ` Detalle técnico: ${result.rpcError?.message ?? 'RPC no disponible.'}`
              : '';
            this.alertService.warning('Balance no disponible', `${details}${reason}`);
          }
          if (result.balances.length === 0) {
            this.alertService.warning('Sin tipos configurados', 'No hay tipos activos en vacation_type_catalog. Revisa el seed SQL.');
          }
        },
        error: (err: { message?: string }) => {
          this.balances.set([]);
          this.balancesLoading.set(false);
          this.alertService.danger('Error cargando tipos', err?.message ?? 'No se pudieron cargar los tipos de vacaciones.');
        },
      });

    // Cargar festivos de la comunidad del empleado
    const community = user.community ?? 'madrid';
    this.vacService.getHolidaysForCommunity(community, year)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: h => this.holidays.set(h),
        error: () => { /* fallback: sin festivos */ },
      });

    this.vacService.getMyRequests(user.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: requests => { this.myRequests.set(requests); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    if (this.isManagerView()) {
      this.vacService.getPendingRequestsForReviewer(user.role, user.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
        next: requests => this.pendingRequests.set(requests),
        error: (err: { message?: string }) => {
          this.pendingRequests.set([]);
          this.alertService.warning('Pendientes no disponibles', err?.message ?? 'No se pudieron cargar las solicitudes pendientes.');
        },
      });
    }
  }

  submitRequest(): void {
    if (this.requiresProfileAssignment()) {
      this.alertService.warning(
        'Funcionalidad temporalmente deshabilitada',
        'Tu cuenta esta pendiente de asignacion de perfil o manager. Puedes seguir usando fichajes.',
      );
      return;
    }

    if (this.vacationForm.invalid) {
      this.vacationForm.markAllAsTouched();
      return;
    }
    const user = this.currentUser();
    if (!user) return;
    const { startDate, endDate, vacationType, notes } = this.vacationForm.getRawValue();
    if (!vacationType) {
      this.alertService.warning('Tipo obligatorio', 'Selecciona un tipo de solicitud antes de enviar.');
      return;
    }
    const daysCount = this.vacService.calcBusinessDaysWithHolidays(startDate, endDate, this.holidays());
    const balance = this.balances().find(b => b.code === vacationType);
    if (!balance || balance.available < daysCount) {
      this.alertService.warning('Días insuficientes', `Solo tienes ${balance?.available ?? 0} días disponibles para este tipo.`);
      return;
    }
    this.submitting.set(true);
    // Primero comprobar solapamiento
    this.vacService.checkOverlap(user.id, startDate, endDate)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(overlaps => {
          if (overlaps.length > 0) {
            const existing = overlaps[0];
            throw {
              message: `Ya tienes una solicitud ${existing.status === 'approved' ? 'aprobada' : 'pendiente'} que incluye esas fechas (${existing.start_date} – ${existing.end_date}).`,
            };
          }
          return this.vacService.createRequest({
            user_id: user.id,
            manager_id: user.managerId ?? null,
            vacation_type: vacationType as VacationTypeCode,
            start_date: startDate,
            end_date: endDate,
            days_count: daysCount,
            notes: notes || null,
            status: 'pending',
          });
        }),
      )
      .subscribe({
        next: newRequest => {
          this.myRequests.update(items => [newRequest, ...items]);
          // Recargar balances para reflejar los días consumidos
          this.vacService.getBalancesForUser(user.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ next: b => this.balances.set(b) });
          this.vacationForm.reset({ startDate: '', endDate: '', vacationType: '', notes: '' });
          this.submitting.set(false);
          this.alertService.success('Solicitud enviada', 'Tu solicitud ha sido enviada al manager para aprobación.');
        },
        error: (err: { message?: string }) => {
          this.submitting.set(false);
          this.alertService.danger('Error', err?.message ?? 'No se pudo enviar la solicitud.');
        },
      });
  }

  startApprove(id: string): void {
    this.approvingId.set(id);
    this.approveComment.set('');
  }

  confirmApprove(): void {
    const id = this.approvingId();
    if (!id) return;
    this.vacService.reviewRequest(id, 'approved', this.approveComment() || undefined).subscribe({
      next: () => {
        this.pendingRequests.update(items => items.filter(r => r.id !== id));
        this.approvingId.set(null);
        this.alertService.success('Aprobado', 'La solicitud ha sido aprobada.');
      },
      error: (err: { message?: string }) => this.alertService.danger('Error', err?.message ?? 'No se pudo aprobar.'),
    });
  }

  startReject(id: string): void {
    this.approvingId.set(null);
    this.rejectingId.set(id);
    this.rejectComment.set('');
  }

  confirmReject(): void {
    const id = this.rejectingId();
    if (!id) return;
    this.vacService.reviewRequest(id, 'rejected', this.rejectComment()).subscribe({
      next: () => {
        this.pendingRequests.update(items => items.filter(r => r.id !== id));
        this.rejectingId.set(null);
        this.alertService.warning('Rechazada', 'La solicitud ha sido rechazada.');
      },
      error: (err: { message?: string }) => this.alertService.danger('Error', err?.message ?? 'No se pudo rechazar.'),
    });
  }

  cancelMyRequest(requestId: string): void {
    const user = this.currentUser();
    if (!user) return;
    this.vacService.cancelRequest(requestId, user.id).subscribe({
      next: () => {
        this.myRequests.update(items =>
          items.map(r => r.id === requestId ? { ...r, status: 'cancelled' as const } : r),
        );
        this.alertService.success('Cancelada', 'La solicitud ha sido cancelada.');
      },
      error: (err: { message?: string }) => this.alertService.danger('Error', err?.message ?? 'No se pudo cancelar.'),
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada', cancelled: 'Cancelada',
    };
    return map[status] ?? status;
  }
}
