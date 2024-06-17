import { Routes } from '@angular/router';

export const routes: Routes = [

  { path: '', redirectTo: 'login', pathMatch: 'full', },
  { path: 'login', loadComponent: () => import('./core/components/login/login.component').then((m) => m.LoginComponent) },
  { path: 'home', loadChildren: () => import('./home/home.routes').then((m) => m.routes), },
  { path: 'masters', loadChildren: () => import('./modules/masters/masters.routes').then((m) => m.routes)},
];
