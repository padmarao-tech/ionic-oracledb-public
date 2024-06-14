import { ChangeDetectorRef, Component } from '@angular/core';
import { IonApp, IonRouterOutlet, IonHeader, IonToolbar, IonContent, IonTitle, IonMenu, IonButton, IonButtons, IonMenuButton, IonRow, IonCol } from '@ionic/angular/standalone';
import { HeaderComponent } from './core/components/header/header.component';
import { Menu } from './shared/models';
import { CommonModule } from '@angular/common';
import { SidenavComponent } from './core/components/sidenav/sidenav.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonCol, IonRow,
    IonTitle, IonContent, IonToolbar,
    IonHeader, IonApp, IonRouterOutlet,
    IonMenu, CommonModule, IonButton,IonButtons,
    IonMenuButton,
    // components
    HeaderComponent,
    SidenavComponent
  ],
})
export class AppComponent {
  title = 'payroll';
  menu: Menu[];

  isSideMenu: boolean = false;
  constructor(){ }

  triggerSide(event) {
    this.isSideMenu = event;
  }

  getMenu(event){
    this.menu = event;
    console.log(this.menu);

  }
}
