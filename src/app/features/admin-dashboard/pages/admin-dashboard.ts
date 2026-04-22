import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/auth/services/auth.service';
import { UserRole } from '../../../core/auth/models/auth.model';
import { I18nStore } from '../../../core/i18n/i18n.store';
import { WorkforceLocationPoint } from '../../../core/domain/models/workforce-summary.model';
import { IncidenciaEntity } from '../../../core/domain/entities/incidencia.entity';
import { WorkforceFacade } from '../../../core/application/services/workforce.facade';
import { IncidenciasFacade } from '../../../core/application/services/incidencias.facade';
import { IncidentApprovalListComponent } from '../../../shared/ui/incident-approval-list/incident-approval-list';
import { FichajeApprovalListComponent } from '../../../shared/ui/fichaje-approval-list/fichaje-approval-list';
import { FichajeApprovalFacade } from '../../../core/application/services/fichaje-approval.facade';
import { PendingFichajeWithUser } from '../../../core/domain/entities/fichaje.entity';
import { AppAlertService } from '../../../shared/services/app-alert.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, IncidentApprovalListComponent, FichajeApprovalListComponent],
  standalone: true,
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard {
  private readonly workforceFacade = inject(WorkforceFacade);
  private readonly incidenciasFacade = inject(IncidenciasFacade);
  private readonly authService = inject(AuthService);
  private readonly i18n = inject(I18nStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fichajeApproval = inject(FichajeApprovalFacade);
  private readonly alertService = inject(AppAlertService);
  readonly texts = computed(() => this.i18n.translations().adminDashboard);

  private readonly workforceSummary = signal({ total: 0, active: 0, onPause: 0, absent: 0 });
  private readonly workforceLocations = signal<WorkforceLocationPoint[]>([]);
  private readonly incidentsState = signal<IncidenciaEntity[]>([]);

  readonly pendingFichajes = signal<PendingFichajeWithUser[]>([]);

  // Overtime: computed from daily_reports — empty until a dedicated use case is added
  readonly overtimeByEmployee = signal<Array<{ userId: string; fullName: string; extraMinutes: number }>>([]);

  constructor() {
    const currentUser = this.authService.getCurrentUser();
    const managerId = currentUser?.role === UserRole.MANAGER ? currentUser.id : undefined;

    this.workforceFacade.getDashboard(managerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        this.workforceSummary.set(data.summary);
        this.workforceLocations.set(data.locations);
      });

    const incidents$ = managerId
      ? this.incidenciasFacade.getByManager(managerId)
      : this.incidenciasFacade.getAll();
    incidents$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(items => this.incidentsState.set(items));

    if (managerId) {
      this.fichajeApproval.getPendingByManager(managerId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(items => this.pendingFichajes.set(items));
    }
  }

  userRole = computed(() => this.authService.getCurrentUser()?.role ?? UserRole.EMPLOYEE);
  employeeStats = computed(() => this.workforceSummary());
  locations = computed(() => this.workforceLocations());
  incidents = computed(() => this.incidentsState());

  mapPoints = computed(() =>
    this.spreadClosePoints(
      this.locations().map(location => ({
        ...location,
        x: this.longitudeToX(location.lng),
        y: this.latitudeToY(location.lat),
        radius: 6 + (location.total * 0.45),
      })),
    ),
  );

  getBreakdownText(category: 'active' | 'onPause' | 'absent'): string {
    const locations = this.locations();
    const chunks = locations
      .map(location => {
        const count = category === 'active'
          ? location.active
          : (category === 'onPause' ? location.onPause : location.absent);
        return { city: location.city, count };
      })
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => `${item.count} ${item.city}`);
    return chunks.join(' | ');
  }

  getTopCitiesLabel(): string {
    const top = this.locations().slice(0, 3).map(location => location.city).join(' | ');
    return top || this.texts().stats.noData;
  }

  getPointLabel(location: WorkforceLocationPoint): string {
    return `${location.city}, ${location.country}: ${location.total} personas`;
  }

  onIncidentsApproved(event: { ids: string[]; comment: string }): void {
    const texts = this.i18n.translations().alerts.incidents;
    this.incidentsState.update(items => items.filter(item => !event.ids.includes(item.id)));

    const label = event.ids.length > 1
      ? this.interpolate(texts.approvedMultipleMessage, { count: event.ids.length })
      : texts.approvedSingleMessage;
    const feedback = event.comment
      ? this.interpolate(texts.noteRegisteredMessage, { message: label, comment: event.comment })
      : label;
    this.alertService.success(
      event.ids.length > 1 ? texts.approvedMultipleTitle : texts.approvedSingleTitle,
      feedback,
    );
  }

  onFichajeApproved(event: { id: string; comment: string }): void {
    const managerId = this.authService.getCurrentUser()?.id;
    if (!managerId) return;
    this.fichajeApproval.approve(event.id, managerId, event.comment || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pendingFichajes.update(items => items.filter(f => f.id !== event.id));
          this.alertService.success(this.texts().alerts.approvedTitle, this.texts().alerts.approvedMessage);
        },
        error: () => this.alertService.warning(this.texts().alerts.approvedErrorTitle, this.texts().alerts.approvedErrorMessage),
      });
  }

  onFichajeRejected(event: { id: string; reason: string }): void {
    const managerId = this.authService.getCurrentUser()?.id;
    if (!managerId) return;
    this.fichajeApproval.reject(event.id, managerId, event.reason)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pendingFichajes.update(items => items.filter(f => f.id !== event.id));
          this.alertService.warning(this.texts().alerts.rejectedTitle, this.texts().alerts.rejectedMessage);
        },
        error: () => this.alertService.warning(this.texts().alerts.rejectedErrorTitle, this.texts().alerts.rejectedErrorMessage),
      });
  }

  formatPresenceSummary(total: number, active: number): string {
    return this.interpolate(this.texts().presence.mapSummary, { total, active });
  }

  formatExtraMinutes(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  private longitudeToX(longitude: number): number {
    return ((longitude + 180) / 360) * 800;
  }

  private latitudeToY(latitude: number): number {
    return ((90 - latitude) / 180) * 400;
  }

  private interpolate(template: string, values: Record<string, string | number>): string {
    return Object.entries(values).reduce(
      (message, [key, value]) => message.replaceAll(`{{${key}}}`, String(value)),
      template,
    );
  }

  private spreadClosePoints(points: Array<WorkforceLocationPoint & {
    x: number;
    y: number;
    radius: number;
  }>): Array<WorkforceLocationPoint & {
    x: number;
    y: number;
    radius: number;
    displayX: number;
    displayY: number;
  }> {
    const minDistance = 26;
    const result = points.map(point => ({
      ...point,
      displayX: point.x,
      displayY: point.y,
    }));

    for (let i = 0; i < result.length; i++) {
      for (let j = 0; j < i; j++) {
        const current = result[i];
        const previous = result[j];
        const dx = current.displayX - previous.displayX;
        const dy = current.displayY - previous.displayY;
        const distance = Math.sqrt((dx * dx) + (dy * dy));

        if (distance < minDistance) {
          const angle = ((i * 53) + (j * 29)) * (Math.PI / 180);
          const shift = ((minDistance - distance) * 0.5) + 7;
          current.displayX += Math.cos(angle) * shift;
          current.displayY += Math.sin(angle) * shift;
        }
      }
    }

    return result;
  }
}
