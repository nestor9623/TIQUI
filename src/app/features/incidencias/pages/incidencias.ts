import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/auth/services/auth.service';
import { I18nStore } from '../../../core/i18n/i18n.store';
import { UserRole } from '../../../core/auth/models/auth.model';
import { IncidenciaEntity } from '../../../core/domain/entities/incidencia.entity';
import { IncidenciasFacade } from '../../../core/application/services/incidencias.facade';
import { AppAlertService } from '../../../shared/services/app-alert.service';
import { IncidentApprovalListComponent } from '../../../shared/ui/incident-approval-list/incident-approval-list';

@Component({
  selector: 'app-incidencias',
  standalone: true,
  imports: [CommonModule, IncidentApprovalListComponent],
  templateUrl: './incidencias.html',
  styleUrl: './incidencias.scss',
})
export class IncidenciasPage {
  private readonly authService = inject(AuthService);
  private readonly i18n = inject(I18nStore);
  private readonly incidenciasFacade = inject(IncidenciasFacade);
  private readonly appAlertService = inject(AppAlertService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly incidentsSignal = signal<IncidenciaEntity[]>([]);

  constructor() {
    const currentUser = this.authService.getCurrentUser();
    const managerId = currentUser?.role === UserRole.MANAGER ? currentUser.id : undefined;

    const load$ = managerId
      ? this.incidenciasFacade.getByManager(managerId)
      : this.incidenciasFacade.getAll();

    load$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: items => this.incidentsSignal.set(items),
        error: () => this.incidentsSignal.set([]),
      });
  }

  incidents = computed(() => this.incidentsSignal());
  totalIncidents = computed(() => this.incidents().length);
  missingCheckInCount = computed(() => this.incidents().filter(item => item.type === 'missing-checkin').length);
  pendingApprovalCount = computed(() => this.incidents().filter(item => item.type === 'pending-approval').length);

  onIncidentsApproved(event: { ids: string[]; comment: string }): void {
    const texts = this.i18n.translations().alerts.incidents;
    this.incidentsSignal.update(items => items.filter(item => !event.ids.includes(item.id)));

    const base = event.ids.length > 1
      ? this.interpolate(texts.approvedMultipleMessage, { count: event.ids.length })
      : texts.approvedSingleMessage;
    const feedback = event.comment
      ? this.interpolate(texts.noteRegisteredMessage, { message: base, comment: event.comment })
      : base;
    this.appAlertService.success(
      event.ids.length > 1 ? texts.approvedMultipleTitle : texts.approvedSingleTitle,
      feedback,
    );
  }

  private interpolate(template: string, values: Record<string, string | number>): string {
    return Object.entries(values).reduce(
      (message, [key, value]) => message.replaceAll(`{{${key}}}`, String(value)),
      template,
    );
  }
}


