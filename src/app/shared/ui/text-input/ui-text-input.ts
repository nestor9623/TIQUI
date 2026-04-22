import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

type InputType = 'text' | 'email' | 'password' | 'search' | 'number';

@Component({
  selector: 'tiqui-ui-text-input',
  imports: [],
  templateUrl: './ui-text-input.html',
  styleUrl: './ui-text-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiTextInputComponent {
  id = input.required<string>();
  label = input.required<string>();
  value = input<string>('');
  placeholder = input<string>('');
  type = input<InputType>('text');
  disabled = input(false);
  error = input<string>('');

  valueChange = output<string>();

  inputClass = computed(() => {
    if (this.error()) {
      return 'ui-input__field ui-input__field--error';
    }
    return 'ui-input__field';
  });

  onInput(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    this.valueChange.emit(target.value);
  }
}
