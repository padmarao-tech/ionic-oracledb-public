import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { combineLatest, filter, map } from 'rxjs';
import { Menu, User } from 'src/app/shared/models';
import { RoleService } from '../../services/role.service';
import { DataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule
  ]
})
export class HeaderComponent {
  @Output()
  side = new EventEmitter<boolean>(false);

  showMenu: boolean;
  @Output()
  menu = new EventEmitter<Menu[]>;
  isSideMenu: boolean = false;
  header_options$ = combineLatest([
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)),
    this.rs.menus$,
    this.ds.curr_user$,
  ]).pipe(
    map(([e, menu, user]: [NavigationEnd, Menu[], User]) => {
      const options = {
        title: 'Payroll',
        subtitle: 'Payment Payroll',
        loginUrl: null,
        show_user_menu: true,
        user: user,
        menu: menu
      };
      console.log(e.url);

      if (
        e.url === "/" ||
        e.url.startsWith('/index') ||
        e.url.startsWith('/login')
      ) {
        options.show_user_menu = false;
        this.menu.emit(null);
      } else {
        options.show_user_menu = true;
        // this.side.emit(true);
        if (menu && menu.length > 0) {
          this.menu.emit(menu);
        }
      }
      options.subtitle = '';

      if (user) {
      }
      return options;
    })
  );
  isMobileScreen: boolean;

  constructor(
    private router: Router,
    private rs: RoleService,
    private ds: DataService,
    private breakpointObserver: BreakpointObserver
  ) {
    this.side.emit(false);
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isMobileScreen = result.matches;
        if(this.isMobileScreen) {
          this.isSideMenu = false;
          this.side.emit(false);
        }
      });
  }

  showMyProfile() {

  }

  showChangePassword() { }

  toggleMenu(event) {
    this.isSideMenu = event.detail.checked;
    this.side.emit(this.isSideMenu);
  }

  logout() {
    this.ds.Logout();
    this.router.navigate(['/login'])
  }

}
