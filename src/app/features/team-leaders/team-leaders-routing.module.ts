import { Routes } from '@angular/router';

export const TEAM_LEADERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/team-leaders-assignments/team-leaders-assignments').then(
        m => m.TeamLeadersAssignmentsPage,
      ),
  },
];
