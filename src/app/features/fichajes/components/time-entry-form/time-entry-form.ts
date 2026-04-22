import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

type EntryType = 'Entrada' | 'Salida' | 'Pausa';

@Component({
  selector: 'app-time-entry-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './time-entry-form.html',
  styleUrl: './time-entry-form.scss',
})
export class TimeEntryFormComponent {
  timeInput = input.required<string>();
  typeInput = input.required<EntryType>();
  description = input.required<string>();

  timeInputChange = output<string>();
  typeInputChange = output<EntryType>();
  descriptionChange = output<string>();
  addEntry = output<void>();

  onTimeInput(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.timeInputChange.emit(target.value);
    }
  }

  onTypeChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }
    if (target.value === 'Entrada' || target.value === 'Salida' || target.value === 'Pausa') {
      this.typeInputChange.emit(target.value);
    }
  }

  onDescriptionInput(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.descriptionChange.emit(target.value);
    }
  }
}
