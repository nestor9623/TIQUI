import { Routes } from '@angular/router';

export const ADMIN_DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/admin-dashboard').then((m) => m.AdminDashboard),
  },
];
