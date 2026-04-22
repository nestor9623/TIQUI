import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WorklogDashboardFacade } from '../../../../core/application/services/worklog-dashboard.facade';
import { AuthService } from '../../../../core/auth/services/auth.service';

interface ActivityData {
  day: string;
  hours: number;
  color: string;
}

@Component({
  selector: 'app-activity-chart',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './activity-chart.html',
  styleUrl: './activity-chart.scss',
})
export class ActivityChartComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly facade = inject(WorklogDashboardFacade);
  private readonly destroyRef = inject(DestroyRef);

  activityData = signal<ActivityData[]>([]);

  ngOnInit(): void {
    const userId = this.authService.getCurrentUser()?.id ?? '3';

    this.facade.getWeeklyChart(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(chartData => {
        this.activityData.set(chartData.map(item => ({ ...item, color: '#ff8a00' })));
      });
  }

  getBarHeight(hours: number): number {
    const maxHours = 8;
    return (hours / maxHours) * 120;
  }
}
