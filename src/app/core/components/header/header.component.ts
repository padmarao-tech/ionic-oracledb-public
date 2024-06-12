import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { combineLatest, filter, map } from 'rxjs';
import { Menu, User } from 'src/app/shared/models';
import { RoleService } from '../../services/role.service';
import { DataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class HeaderComponent {
  @Output()
  side = new EventEmitter<boolean>();

  showMenu: boolean;
  @Output()
  menu = new EventEmitter<Menu[]>;
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

      if (
        e.url === "/" ||
        e.url.startsWith('/index') ||
        e.url.startsWith('/login')
      ) {
        options.show_user_menu = false;
      } else {
        options.show_user_menu = true;
        // this.side.emit(true);
      }

      options.subtitle = '';

      if (user) {
      }
      return options;
    })
  );

  constructor(
    private router: Router,
    private rs: RoleService,
    private ds: DataService
  ) { }

  showMyProfile() {

  }

  showChangePassword() { }
}
