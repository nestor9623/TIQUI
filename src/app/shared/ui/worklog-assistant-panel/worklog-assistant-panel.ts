import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { I18nStore } from '../../../core/i18n/i18n.store';
import { AppAlertService } from '../../services/app-alert.service';
import {
  EMPTY_ASSISTANT_SNAPSHOT,
  WorklogAssistantAlert,
  WorklogAssistantService,
} from '../../../core/application/services/worklog-assistant.service';

@Component({
  selector: 'tiqui-worklog-assistant-panel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './worklog-assistant-panel.html',
  styleUrl: './worklog-assistant-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorklogAssistantPanelComponent {
  private readonly assistantService = inject(WorklogAssistantService);
  private readonly appAlertService = inject(AppAlertService);
  private readonly i18n = inject(I18nStore);

  readonly open = input(false);
  readonly closed = output<void>();
  readonly snapshot = toSignal(this.assistantService.getSnapshot(), {
    initialValue: EMPTY_ASSISTANT_SNAPSHOT,
  });
  readonly texts = computed(() => this.i18n.translations().assistant);
  readonly alertTexts = computed(() => this.i18n.translations().alerts);
  readonly visibleAlerts = computed(() => this.snapshot().alerts);
  readonly unreadCountLabel = computed(() => {
    const unreadCount = this.snapshot().unreadCount;
    return unreadCount > 9 ? '9+' : String(unreadCount);
  });
  readonly unreadCountAriaLabel = computed(() => this.interpolate(this.texts().panel.accessibility.unreadCount, {
    count: this.snapshot().unreadCount,
  }));

  trackAlert(index: number, alert: WorklogAssistantAlert): string {
    return `${alert.id}-${index}`;
  }

  onClose(): void {
    this.closed.emit();
  }

  onAlertReviewed(alert: WorklogAssistantAlert): void {
    this.assistantService.markAlertAsRead(alert.fingerprint);
    this.appAlertService.info(this.alertTexts().assistant.reviewedTitle, this.alertTexts().assistant.reviewedMessage);
  }

  onAlertDismissed(alert: WorklogAssistantAlert): void {
    this.assistantService.dismissAlert(alert.fingerprint);
    this.appAlertService.info(this.alertTexts().assistant.removedTitle, this.alertTexts().assistant.removedMessage);
  }

  onAlertAction(alert: WorklogAssistantAlert): void {
    this.assistantService.markAlertAsRead(alert.fingerprint);
    this.onClose();
  }

  dismissAll(): void {
    this.assistantService.dismissAllAlerts(this.visibleAlerts());
    this.appAlertService.info(this.alertTexts().assistant.clearedTitle, this.alertTexts().assistant.clearedMessage);
  }

  private interpolate(template: string, values: Record<string, string | number>): string {
    return Object.entries(values).reduce(
      (message, [key, value]) => message.replaceAll(`{{${key}}}`, String(value)),
      template,
    );
  }
}
