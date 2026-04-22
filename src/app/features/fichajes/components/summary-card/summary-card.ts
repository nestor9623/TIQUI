import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary-card.html',
  styleUrl: './summary-card.scss',
})
export class SummaryCardComponent {
  totalWorked = input.required<string>();
  totalPause = input.required<string>();
  currentStatus = input.required<string>();
}
