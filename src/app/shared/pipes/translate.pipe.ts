import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nStore } from '../../core/i18n/i18n.store';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nStore);

  transform(path: string): string {
    return this.i18n.t(path);
  }
}
