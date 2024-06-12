import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { combineLatest, filter, map } from 'rxjs';
import { Menu, User } from '../../../shared/models';
import { DataService } from '../../services/data.service';
import { RoleService } from '../../services/role.service';
import { MainMenuComponent } from './main-menu/main-menu.component';
import { CommonModule } from '@angular/common';

interface ExampleFlatNode {
  expandable: boolean;
  name: string;
  level: number;
}

@Component({
  selector: 'app-sidenav',
  standalone: true,
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
  imports: [
    CommonModule,
    // materials
    MainMenuComponent
  ]
})
export class SidenavComponent implements OnInit {

  user: User;

  @Input()
  menuArray: Menu[];

  @Output()
  side = new EventEmitter<boolean>();

  treeControl = new FlatTreeControl<Menu>(
    node => node.order_num,
    node => node.is_active,
  );
  constructor(
    private router: Router,
    private ds: DataService,
    private roleService: RoleService
  ) { }

  ngOnInit(): void {
    this.user = this.ds.curr_user$.value;

    const previousUrl = history.state.prevPage? history.state.prevPage: null;

    if(!this.user){

    }
  }

}
