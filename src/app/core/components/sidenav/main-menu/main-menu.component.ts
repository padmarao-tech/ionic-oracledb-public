import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { Menu } from '../../../../shared/models';
import { MatTreeModule } from '@angular/material/tree';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
interface ExampleFlatNode {
  expandable: boolean;
  name: string;
  level: number;
}

@Component({
  selector: 'app-main-menu',
  standalone: true,
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    // materials
    MatTreeModule,
    MatIconModule,
    MatButtonModule,

  ]
})
export class MainMenuComponent implements OnChanges {

  @Input()
  menuArray: Menu[];

  @Output()
  side = new EventEmitter<boolean>();

  private _transformer = (node: Menu, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      name: node.name,
      router_link: node.router_link,
      icon_name: node.icon_name,
      level: level,
    };
  };

  treeControl = new FlatTreeControl<ExampleFlatNode>(
    node => node.level,
    node => node.expandable,
  );

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    node => node.level,
    node => node.expandable,
    node => node.children,
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  hasChild = (_: number, node: ExampleFlatNode) => node.expandable;

  constructor(private router: Router) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.menuArray) {
      this.dataSource.data = this.menuArray;
    }
  }

  isParentActive(node): boolean {
    const treeUrl = this.router.url;
    let urls = this.menuArray.find(a => a.name == node.name).children.map(b => b.router_link)

    return (urls && urls.includes(treeUrl));
  }


}
