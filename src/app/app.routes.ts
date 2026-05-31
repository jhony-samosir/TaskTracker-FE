import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout';
import { MainLayoutComponent } from './layouts/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/pages/login/login').then((m) => m.LoginComponent),
      },
    ],
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'tasks',
        loadComponent: () =>
          import('./features/task-management/pages/task-management/task-management').then(
            (m) => m.TaskManagement,
          ),
      },
      {
        path: 'my-tasks',
        loadComponent: () =>
          import('./features/my-tasks/pages/my-tasks/my-tasks').then((m) => m.MyTasks),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
