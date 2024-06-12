import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map, filter, tap } from 'rxjs/operators';

import { DataService } from './data.service';
import { Menu } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private db$ = new BehaviorSubject<Menu[]>([]);

  menus$ = this.db$.pipe(
    map(ms => {
      const n: Menu[] = ms.filter(m => !m.ref_screen_code);
      n.forEach(function f(m) {
        const v = ms.filter(m1 => m1.ref_screen_code === m.code);
        if (v.length > 0) {
          m.children = v;
          m.children.forEach(f);
        }
      })
      return n;
    }),
  );

  allowedUrls$ = this.db$.pipe(
    map(m => {
      const urls: string[] = ['/index', '/login', '/home', '/forgot-password']; // special urls , '/nc/index'
      console.log("allowedUrls");

      m.forEach(m => {
        if (m.router_link)
          urls.push(m.router_link);
        if (m.related_router_links && m.related_router_links.length > 0)
          urls.push(...m.related_router_links);
      });
      return urls;
    })
  );

  constructor(private dataService: DataService) {
    console.log("constructor");

    this.dataService.curr_user$.subscribe(u => {
      if (!!u) {
        // id: u.id
        this.dataService.getUserMenus({}).subscribe(data => {
          console.log(data);

          this.db$.next(data);
        },
          (error) => {
            // console.log(error.error);
            if (error.error == "Token is not valid / Expired.") {
              this.dataService.Logout();
            }
          });
      } else {
        this.db$.next([]);
      }
    });
  }
}
