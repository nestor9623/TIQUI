import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportesPage } from './pages/reportes';

const routes: Routes = [
  {
    path: '',
    component: ReportesPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportesRoutingModule {}

