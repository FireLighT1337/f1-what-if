import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'explorer' },
  {
    path: 'explorer',
    title: 'Explorer · F1 What-If',
    loadComponent: () => import('./features/explorer/explorer-page').then((m) => m.ExplorerPage),
  },
  {
    path: 'seasons/:year/drivers/:driverId',
    title: 'Driver · F1 What-If',
    loadComponent: () => import('./features/driver/driver-page').then((m) => m.DriverPage),
  },
  { path: '**', redirectTo: 'explorer' },
];
