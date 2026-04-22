import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TimeSummary } from '../components/time-summary/time-summary';
import { CheckInComponent } from '../components/check-in/check-in';
import { GenerateSummaryComponent } from '../components/generate-summary/generate-summary';
import { ActivityChartComponent } from '../components/activity-chart/activity-chart';
import { RecentActivityComponent } from '../components/recent-activity/recent-activity';
import { AssistantOverviewComponent } from '../components/assistant-overview/assistant-overview';
import { AuthService } from '../../../core/auth/services/auth.service';
import { AzureDashboardFacade, AzureTaskPreview } from '../../../core/application/services/azure-dashboard.facade';

@Component({
  selector: 'app-dashboard',
  imports: [
    AssistantOverviewComponent,
    TimeSummary,
    CheckInComponent,
    GenerateSummaryComponent,
    ActivityChartComponent,
    RecentActivityComponent,
  ],
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly authService = inject(AuthService);
  private readonly azureFacade = inject(AzureDashboardFacade);

  private readonly currentUser = this.authService.getCurrentUser();
  private readonly now = signal(new Date());

  readonly azurePreview = toSignal(this.azureFacade.getPreviewForUser(this.currentUser), { initialValue: null });
  readonly isAzureConnected = computed(() => Boolean(this.currentUser?.azureConnected));
  readonly sprintBadge = computed(() => this.azurePreview()?.sprint.name ?? 'Sin Azure');

  readonly sprintRange = computed(() => {
    const sprint = this.azurePreview()?.sprint;
    if (!sprint) {
      return null;
    }

    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    return `${this.formatDate(start)} - ${this.formatDate(end)}`;
  });

  readonly sprintRemainingDays = computed(() => {
    const sprint = this.azurePreview()?.sprint;
    if (!sprint) {
      return null;
    }

    const end = new Date(sprint.endDate);
    const diffMs = end.getTime() - this.now().getTime();
    const remaining = Math.ceil(diffMs / 86400000);
    return Math.max(0, remaining);
  });

  readonly quickTasks = computed<AzureTaskPreview[]>(() => this.azurePreview()?.tasks ?? []);

  taskPriorityClass(priority: AzureTaskPreview['priority']): string {
    return `priority-${priority}`;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
