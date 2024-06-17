import { Routes } from '@angular/router';
import { UsersComponent } from './users/users.component';
import { DesignationsComponent } from './designations/designations.component';
import { AuthGuard } from 'src/app/core/guards/auth.guard';

export const routes: Routes = [

  { path: 'users', component: UsersComponent, canActivate: [AuthGuard] },
  { path: 'designations', component: DesignationsComponent, canActivate: [AuthGuard] },
];
