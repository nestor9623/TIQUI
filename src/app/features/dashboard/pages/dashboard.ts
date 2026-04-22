import { Component } from '@angular/core';
import { TimeSummary } from '../components/time-summary/time-summary';
import { CheckInComponent } from '../components/check-in/check-in';
import { GenerateSummaryComponent } from '../components/generate-summary/generate-summary';
import { ActivityChartComponent } from '../components/activity-chart/activity-chart';
import { RecentActivityComponent } from '../components/recent-activity/recent-activity';
import { AssistantOverviewComponent } from '../components/assistant-overview/assistant-overview';

@Component({
  selector: 'app-dashboard',
  imports: [
    AssistantOverviewComponent,
    TimeSummary,
    CheckInComponent,
    GenerateSummaryComponent,
    ActivityChartComponent,
    RecentActivityComponent,
  ],
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {}
