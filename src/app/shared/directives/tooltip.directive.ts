import { Directive, computed, input } from '@angular/core';

@Directive({
  selector: '[tiquiTooltip]',
  standalone: true,
  host: {
    '[attr.data-ui-tooltip]': 'tooltipText() || null',
    '[attr.title]': 'tooltipText() || null',
    '[attr.aria-label]': 'tooltipText() || null',
    '[class.ui-tooltip-trigger]': '!!tooltipText()',
  },
})
export class TooltipDirective {
  tiquiTooltip = input('');
  readonly tooltipText = computed(() => this.tiquiTooltip().trim());
}
