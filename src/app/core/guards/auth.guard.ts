import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router, CanActivateFn } from '@angular/router';
import { Observable, combineLatest, timer } from 'rxjs';
import { delay, distinctUntilChanged, map, switchMap } from 'rxjs/operators';

import { DataService } from '../services/data.service';
import { RoleService } from '../services/role.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard  {

  constructor(
    private router: Router,
    private dataService: DataService,
    private roleService: RoleService
  ) { }

  canActivate (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree | CanActivateFn {
    console.log("canActivate");

    return timer(1000).pipe( // Introduce a 1-second delay
      switchMap(() => combineLatest([this.dataService.curr_user$, this.roleService.allowedUrls$])),
      map(([user, urls]) => {
        const isAllowed = user && user.designation_code && urls.includes(state.url);

        if (isAllowed) {
          return true;
        } else {
          console.log("login");
          const tree: UrlTree = this.router.parseUrl('/login');
          this.dataService.login_err_message$.next('You tried to access an unauthorized page.');
          return tree;
        }
      })
    );
  }
  // canActivate (next: ActivatedRouteSnapshot, state: RouterStateSnapshot):CanActivateFn {

  // }
}
