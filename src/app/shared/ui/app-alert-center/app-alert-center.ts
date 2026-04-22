import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nStore } from '../../../core/i18n/i18n.store';
import { AppAlertItem, AppAlertService } from '../../services/app-alert.service';

@Component({
  selector: 'tiqui-app-alert-center',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-alert-center.html',
  styleUrl: './app-alert-center.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppAlertCenterComponent {
  private readonly appAlertService = inject(AppAlertService);
  private readonly i18n = inject(I18nStore);

  readonly alerts = this.appAlertService.alerts;
  readonly commonTexts = this.i18n.translations;

  dismiss(id: string): void {
    this.appAlertService.dismiss(id);
  }

  trackAlert(index: number, alert: AppAlertItem): string {
    return `${alert.id}-${index}`;
  }
}
