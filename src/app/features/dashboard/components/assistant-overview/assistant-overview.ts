import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { I18nStore } from '../../../../core/i18n/i18n.store';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { AssistantPreferencesService } from '../../../../core/application/services/assistant-preferences.service';
import {
  EMPTY_ASSISTANT_SNAPSHOT,
  WorklogAssistantAlert,
  WorklogAssistantService,
} from '../../../../core/application/services/worklog-assistant.service';

@Component({
  selector: 'app-assistant-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './assistant-overview.html',
  styleUrl: './assistant-overview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssistantOverviewComponent {
  private readonly assistantService = inject(WorklogAssistantService);
  private readonly i18n = inject(I18nStore);
  private readonly authService = inject(AuthService);
  private readonly preferencesService = inject(AssistantPreferencesService);

  readonly snapshot = toSignal(this.assistantService.getSnapshot(), {
    initialValue: EMPTY_ASSISTANT_SNAPSHOT,
  });
  readonly texts = computed(() => this.i18n.translations().assistant);
  readonly topAlerts = computed(() => this.snapshot().alerts.slice(0, 2));
  readonly currentUser = computed(() => this.authService.getCurrentUser());
  readonly preferences = computed(() => {
    const userId = this.currentUser()?.id;
    if (!userId) {
      return null;
    }

    return this.preferencesService.getPreferences(userId);
  });

  trackAlert(index: number, alert: WorklogAssistantAlert): string {
    return `${alert.id}-${index}`;
  }

  updateNumberPreference(key: 'breakReminderMinutes' | 'weeklyBalanceThresholdMinutes' | 'suggestedEndOvertimeThresholdMinutes', event: Event): void {
    const userId = this.currentUser()?.id;
    if (!userId) {
      return;
    }

    const target = event.target as HTMLInputElement;
    const value = Number(target.value);
    this.preferencesService.setPreferences(userId, { [key]: value });
  }
}
