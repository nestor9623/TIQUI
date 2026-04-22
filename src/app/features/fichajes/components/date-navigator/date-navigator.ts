import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-date-navigator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-navigator.html',
  styleUrl: './date-navigator.scss',
})
export class DateNavigatorComponent {
  formattedDate = input.required<string>();
  prev = output<void>();
  next = output<void>();
}
