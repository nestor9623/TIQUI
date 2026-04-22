import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoryEntry } from '../../../../core/domain/models/timeline-entry.model';

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
