import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type UiIconName = 'add' | 'edit' | 'delete' | 'activate' | 'deactivate' | 'close' | 'check';

@Component({
  selector: 'tiqui-ui-icon',
  imports: [],
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.width]="size()"
      [attr.height]="size()"
      [attr.aria-hidden]="true">
      @switch (name()) {
        @case ('add') {
          <path d="M12 5v14"></path>
          <path d="M5 12h14"></path>
        }
        @case ('edit') {
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>
        }
        @case ('delete') {
          <path d="M3 6h18"></path>
          <path d="M8 6V4h8v2"></path>
          <path d="M19 6l-1 14H6L5 6"></path>
          <path d="M10 11v6"></path>
          <path d="M14 11v6"></path>
        }
        @case ('activate') {
          <path d="M12 2v10"></path>
          <path d="M6.2 6.2a8 8 0 1 0 11.3 0"></path>
        }
        @case ('deactivate') {
          <path d="M12 2v10"></path>
          <path d="M6.2 6.2a8 8 0 1 0 11.3 0"></path>
          <path d="M4 4l16 16"></path>
        }
        @case ('close') {
          <path d="M18 6 6 18"></path>
          <path d="m6 6 12 12"></path>
        }
        @case ('check') {
          <path d="m5 12 5 5L20 7"></path>
        }
      }
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'ui-icon',
    '[style.display]': '"inline-flex"',
    '[style.alignItems]': '"center"',
    '[style.justifyContent]': '"center"',
    '[style.lineHeight]': '"0"',
  },
})
export class UiIconComponent {
  name = input<UiIconName>('edit');
  size = input<number>(18);
}
