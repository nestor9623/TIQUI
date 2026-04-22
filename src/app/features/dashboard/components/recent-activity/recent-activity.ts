import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WorklogDashboardFacade } from '../../../../core/application/services/worklog-dashboard.facade';
import { AuthService } from '../../../../core/auth/services/auth.service';

interface Activity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

@Component({
  selector: 'app-recent-activity',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './recent-activity.html',
  styleUrl: './recent-activity.scss',
})
export class RecentActivityComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly facade = inject(WorklogDashboardFacade);
  private readonly destroyRef = inject(DestroyRef);

  activities = signal<Activity[]>([]);

  ngOnInit(): void {
    const userId = this.authService.getCurrentUser()?.id ?? '3';

    this.facade.getRecentActivities(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(activities => this.activities.set(activities));
  }
}
