import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntryType } from '../../../../core/domain/models/timeline-entry.model';

interface ActionConfig {
  type: EntryType;
  icon: string;
  label: string;
  colorClass: string;
}

const ACTION_CONFIGS: Record<EntryType, ActionConfig> = {
  Entrada:  { type: 'Entrada',  icon: '▶',  label: 'Entrada',  colorClass: 'action--entry' },
  Salida:   { type: 'Salida',   icon: '⏹',  label: 'Salida',   colorClass: 'action--exit' },
  Pausa:    { type: 'Pausa',    icon: '⏸',  label: 'Pausa',    colorClass: 'action--pause' },
  Reanudar: { type: 'Reanudar', icon: '⏯',  label: 'Reanudar', colorClass: 'action--resume' },
};

@Component({
  selector: 'app-time-entry-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './time-entry-form.html',
  styleUrl: './time-entry-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeEntryFormComponent {
  timeInput = input.required<string>();
  description = input.required<string>();
  allowedActions = input<EntryType[]>(['Entrada']);
  isDayClosed = input<boolean>(false);
  saving = input<boolean>(false);

  timeInputChange = output<string>();
  descriptionChange = output<string>();
  /** Emitted when user clicks an action button — already includes the type to register */
  directAction = output<EntryType>();

  readonly actionConfigs = computed(() =>
    this.allowedActions().map(t => ACTION_CONFIGS[t])
  );

  readonly isDisabled = computed(() => this.isDayClosed() || this.saving());

  onDirectAction(type: EntryType): void {
    if (!this.isDisabled()) {
      this.directAction.emit(type);
    }
  }

  onTimeInput(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.timeInputChange.emit(target.value);
    }
  }

  onDescriptionInput(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.descriptionChange.emit(target.value);
    }
  }
}
