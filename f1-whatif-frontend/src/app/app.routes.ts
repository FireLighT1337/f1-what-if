import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

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
  {
    path: 'login',
    title: 'Log in · F1 What-If',
    data: { mode: 'login' },
    loadComponent: () => import('./features/auth/auth-page').then((m) => m.AuthPage),
  },
  {
    path: 'register',
    title: 'Sign up · F1 What-If',
    data: { mode: 'register' },
    loadComponent: () => import('./features/auth/auth-page').then((m) => m.AuthPage),
  },
  {
    path: 'scenarios',
    title: 'My scenarios · F1 What-If',
    canActivate: [authGuard],
    loadComponent: () => import('./features/scenarios/scenarios-page').then((m) => m.ScenariosPage),
  },
  {
    path: 'shared/:publicId',
    title: 'Shared scenario · F1 What-If',
    loadComponent: () => import('./features/shared/shared-page').then((m) => m.SharedPage),
  },
  { path: '**', redirectTo: 'explorer' },
];
