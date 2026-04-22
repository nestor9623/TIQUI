import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AdminLocationPoint,
  AdminDashboardData,
  MockWorkforceDashboardService,
} from '../../../core/mock/services/mock-workforce-dashboard.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { UserRole } from '../../../core/auth/models/auth.model';
import { I18nStore } from '../../../core/i18n/i18n.store';
import { IncidentApprovalListComponent } from '../../../shared/ui/incident-approval-list/incident-approval-list';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, IncidentApprovalListComponent],
  standalone: true,
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard {
  private readonly mockWorkforceDashboardService = inject(MockWorkforceDashboardService);
  private readonly authService = inject(AuthService);
  private readonly i18n = inject(I18nStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dashboardData = signal<AdminDashboardData>({
    summary: { total: 0, active: 0, onPause: 0, absent: 0 },
    locations: [] as AdminLocationPoint[],
    incidents: [],
    overtimeByEmployee: [],
  });
  readonly incidentsFeedback = signal('');

  constructor() {
    const currentUser = this.authService.getCurrentUser();
    const managerId = currentUser?.role === UserRole.MANAGER ? currentUser.id : undefined;

    this.mockWorkforceDashboardService.getDashboardData(managerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => this.dashboardData.set(data));
  }

  userRole = computed(() => this.authService.getCurrentUser()?.role ?? UserRole.EMPLOYEE);
  employeeStats = computed(() => this.dashboardData().summary);
  locations = computed(() => this.dashboardData().locations);
  incidents = computed(() => this.dashboardData().incidents);
  overtimeByEmployee = computed(() => this.dashboardData().overtimeByEmployee);

  mapPoints = computed(() =>
    this.spreadClosePoints(
      this.locations().map(location => ({
        ...location,
        x: this.longitudeToX(location.longitude),
        y: this.latitudeToY(location.latitude),
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
          : (category === 'onPause' ? location.paused : location.away);
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
    return top || 'Sin datos';
  }

  getPointLabel(location: AdminLocationPoint): string {
    return `${location.city}, ${location.country}: ${location.total} personas`;
  }

  onIncidentsApproved(event: { ids: string[]; comment: string }): void {
    const texts = this.i18n.translations().alerts.incidents;
    this.mockWorkforceDashboardService.approveIncidents(event.ids, event.comment);
    this.dashboardData.update(data => ({
      ...data,
      incidents: data.incidents.filter(item => !event.ids.includes(item.id)),
    }));

    const label = event.ids.length > 1
      ? this.interpolate(texts.approvedMultipleMessage, { count: event.ids.length })
      : texts.approvedSingleMessage;
    this.incidentsFeedback.set(
      event.comment ? this.interpolate(texts.noteRegisteredMessage, { message: label, comment: event.comment }) : label,
    );
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

  private spreadClosePoints(points: Array<AdminLocationPoint & {
    x: number;
    y: number;
    radius: number;
  }>): Array<AdminLocationPoint & {
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
