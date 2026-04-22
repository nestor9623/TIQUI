import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/auth/services/auth.service';
import { I18nStore } from '../../../core/i18n/i18n.store';
import { MockWorkforceDashboardService } from '../../../core/mock/services/mock-workforce-dashboard.service';
import { UserRole } from '../../../core/auth/models/auth.model';
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
  private readonly dashboardService = inject(MockWorkforceDashboardService);
  private readonly appAlertService = inject(AppAlertService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly incidentsSignal = signal<Array<{
    id: string;
    userId: string;
    fullName: string;
    type: 'missing-checkin' | 'pending-approval';
    dateIso: string;
  }>>([]);
  readonly feedbackMessage = signal('');

  constructor() {
    const currentUser = this.authService.getCurrentUser();
    const managerId = currentUser?.role === UserRole.MANAGER ? currentUser.id : undefined;
    this.dashboardService.getDashboardData(managerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => this.incidentsSignal.set(data.incidents));
  }

  incidents = computed(() => this.incidentsSignal());
  totalIncidents = computed(() => this.incidents().length);
  missingCheckInCount = computed(() => this.incidents().filter(item => item.type === 'missing-checkin').length);
  pendingApprovalCount = computed(() => this.incidents().filter(item => item.type === 'pending-approval').length);

  onIncidentsApproved(event: { ids: string[]; comment: string }): void {
    const texts = this.i18n.translations().alerts.incidents;
    this.dashboardService.approveIncidents(event.ids, event.comment);
    this.incidentsSignal.update(items => items.filter(item => !event.ids.includes(item.id)));

    const base = event.ids.length > 1
      ? this.interpolate(texts.approvedMultipleMessage, { count: event.ids.length })
      : texts.approvedSingleMessage;
    const feedback = event.comment
      ? this.interpolate(texts.noteRegisteredMessage, { message: base, comment: event.comment })
      : base;
    this.feedbackMessage.set(feedback);
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

