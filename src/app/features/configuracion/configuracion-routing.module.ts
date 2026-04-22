import { Routes } from '@angular/router';

export const CONFIGURACION_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'usuarios',
    pathMatch: 'full',
  },
  {
    path: 'usuarios',
    loadComponent: () =>
      import('../users/pages/users-management').then(m => m.UsersManagement),
  },
  {
    path: 'catalogos',
    loadComponent: () =>
      import('./pages/catalogos/catalogos').then(m => m.CatalogosPage),
  },
];
