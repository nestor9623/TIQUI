import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IncidenciasPage } from './pages/incidencias';

const routes: Routes = [
  {
    path: '',
    component: IncidenciasPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class IncidenciasRoutingModule {}

