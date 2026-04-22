import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth/guards/auth.guard';
import { RoleGuard } from './core/auth/guards/role.guard';
import { LayoutComponent } from './shared/components/layout/layout';
import { UserRole } from './core/auth/models/auth.model';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth-routing.module').then(m => m.AuthRoutingModule),
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        loadChildren: () =>
          import('./features/dashboard/dashboard-routing.module').then(m => m.DashboardRoutingModule),
      },
      {
        path: 'admin-dashboard',
        canActivate: [RoleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.MANAGER] },
        loadChildren: () =>
          import('./features/admin-dashboard/admin-dashboard-routing.module').then(m => m.ADMIN_DASHBOARD_ROUTES),
      },
      {
        path: 'fichajes',
        loadChildren: () =>
          import('./features/fichajes/fichajes-routing.module').then(m => m.FichajesRoutingModule),
      },
      {
        path: 'usuarios',
        canActivate: [RoleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.MANAGER] },
        loadChildren: () =>
          import('./features/users/users-routing.module').then(m => m.USERS_ROUTES),
      },
      {
        path: 'calendar',
        loadChildren: () =>
          import('./features/calendar/calendar-routing.module').then(m => m.CalendarRoutingModule),
      },
      {
        path: 'reportes',
        loadChildren: () =>
          import('./features/reportes/reportes-routing.module').then(m => m.ReportesRoutingModule),
      },
      {
        path: 'incidencias',
        canActivate: [RoleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.MANAGER] },
        loadChildren: () =>
          import('./features/incidencias/incidencias-routing.module').then(m => m.IncidenciasRoutingModule),
      },
      {
        path: 'configuracion',
        canActivate: [RoleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadChildren: () =>
          import('./features/configuracion/configuracion-routing.module').then(m => m.CONFIGURACION_ROUTES),
      },
    ]
  },
  {
    path: '**',
    redirectTo: '',
  },
];
