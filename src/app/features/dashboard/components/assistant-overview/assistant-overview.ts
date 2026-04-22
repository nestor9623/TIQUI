import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { I18nStore } from '../../../../core/i18n/i18n.store';
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

  readonly snapshot = toSignal(this.assistantService.getSnapshot(), {
    initialValue: EMPTY_ASSISTANT_SNAPSHOT,
  });
  readonly texts = computed(() => this.i18n.translations().assistant);
  readonly topAlerts = computed(() => this.snapshot().alerts.slice(0, 2));

  trackAlert(index: number, alert: WorklogAssistantAlert): string {
    return `${alert.id}-${index}`;
  }
}
