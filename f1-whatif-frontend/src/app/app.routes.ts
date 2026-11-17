import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'explorer' },
  {
    path: 'explorer',
    title: 'Explorer · F1 What-If',
    loadComponent: () => import('./features/explorer/explorer-page').then((m) => m.ExplorerPage),
  },
  { path: '**', redirectTo: 'explorer' },
];
