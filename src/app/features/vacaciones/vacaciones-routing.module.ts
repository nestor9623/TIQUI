import { Routes } from '@angular/router';

export const VACACIONES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/vacaciones/vacaciones').then(m => m.VacacionesPage),
  },
];
