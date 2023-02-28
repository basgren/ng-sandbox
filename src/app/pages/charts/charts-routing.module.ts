import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'sankey' },
  { path: 'sankey', loadComponent: () => import('./sankey-charts/sankey-charts.component').then(m => m.SankeyChartsComponent)},
  { path: 'line', loadComponent: () => import('./line-charts/line-charts.component').then(m => m.LineChartsComponent)},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChartsRoutingModule { }
