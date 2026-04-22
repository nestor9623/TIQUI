import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'tiqui-ui-button',
  imports: [],
  templateUrl: './ui-button.html',
  styleUrl: './ui-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  type = input<ButtonType>('button');
  fullWidth = input(false);
  loading = input(false);
  disabled = input(false);

  pressed = output<void>();

  buttonClass = computed(() => {
    const base = 'ui-btn';
    const classes = [
      base,
      `${base}--${this.variant()}`,
      `${base}--${this.size()}`,
    ];

    if (this.fullWidth()) {
      classes.push(`${base}--full`);
    }

    return classes.join(' ');
  });

  isDisabled = computed(() => this.disabled() || this.loading());

  onClick(): void {
    if (this.isDisabled()) {
      return;
    }
    this.pressed.emit();
  }
}
