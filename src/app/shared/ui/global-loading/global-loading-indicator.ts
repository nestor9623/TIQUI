import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpLoadingService } from '../../../core/http/http-loading.service';
import { I18nStore } from '../../../core/i18n/i18n.store';

@Component({
  selector: 'tiqui-global-loading-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-loading-indicator.html',
  styleUrl: './global-loading-indicator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalLoadingIndicatorComponent {
  private readonly httpLoadingService = inject(HttpLoadingService);
  private readonly i18n = inject(I18nStore);

  readonly loading = this.httpLoadingService.loading;
  readonly loadingText = computed(() => this.i18n.translations().common.labels.globalLoading);
}
