import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'tiqui-ui-card',
  imports: [],
  templateUrl: './ui-card.html',
  styleUrl: './ui-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiCardComponent {
  title = input<string>('');
  subtitle = input<string>('');
  compact = input(false);
}
