import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

type EntryType = 'Entrada' | 'Salida' | 'Pausa';

interface HistoryEntry {
  time: string;
  type: EntryType;
  label: string;
}

@Component({
  selector: 'app-history-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history-table.html',
  styleUrl: './history-table.scss',
})
export class HistoryTableComponent {
  entries = input.required<HistoryEntry[]>();
}
