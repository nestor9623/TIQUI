import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FichajesPage } from './pages/fichajes';

const routes: Routes = [
  {
    path: '',
    component: FichajesPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FichajesRoutingModule {}
