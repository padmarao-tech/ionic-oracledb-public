import { CommonModule } from '@angular/common';
import { AfterViewChecked, AfterViewInit, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { Designation, User } from '../../../shared/models';
import { DataService } from '../../../core/services/data.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { UserEditDialogComponent } from './user-edit-dialog/user-edit-dialog.component';
import { BehaviorSubject, Observable, combineLatest, debounceTime, distinctUntilChanged, map, startWith, switchMap, tap } from 'rxjs';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    // materials
    MatCheckboxModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator)
  paginator: MatPaginator;

  pageSize = 10;
  pageSizeOptions: number[] = this.ds.PageSizeOptions;
  isLoading: boolean = false;
  user: User;

  filter_include_inactive = new UntypedFormControl(false);
  filter_search_text = new UntypedFormControl('');

  users$ = new Observable<User[]>;
  private page$: Observable<PageEvent>;
  private readonly refreshToken$ = new BehaviorSubject(undefined);
  constructor(
    private ds: DataService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.user = this.ds.curr_user$.value;
  }

  ngAfterViewInit() {
    this.page$ = this.paginator.page.asObservable().pipe(
      startWith({
        previousPageIndex: 0,
        pageIndex: this.paginator.pageIndex,
        pageSize: this.paginator.pageSize,
        length: this.paginator.length
      }),
    );

    const filter_search_text$ = this.filter_search_text.valueChanges.pipe(
      startWith(this.filter_search_text.value),
      map(v => v as string),
      distinctUntilChanged(),
      tap(() => {
        if (this.paginator) this.paginator.pageIndex = 0;
      })
    );

    const filter_include_inactive$ = this.filter_include_inactive.valueChanges.pipe(
      startWith(this.filter_include_inactive.value),
      map(v => v as boolean),
      distinctUntilChanged(),
      tap(() => {
        if (this.paginator) this.paginator.pageIndex = 0;
      })
    );

    this.users$ = combineLatest([
      filter_search_text$,
      filter_include_inactive$,
      this.page$,
      this.refreshToken$
    ]).pipe(
      debounceTime(200),
      tap(() => this.isLoading = true),
      switchMap(([search, include_inactive, page]) => {
        const filters: {
          search_text?: string;
          limit: number;
          offset: number;
          include_inactive: boolean
        } = {
          search_text: search,
          limit: page.pageSize,
          offset: page.pageIndex,
          include_inactive: include_inactive
        };
        return this.ds.getUsers(filters);
      }),
      map(x => {
        this.isLoading = false;
        this.paginator.length = x.tot_rows;
        return x.rows;
      })
    )
  }

  toggleStatus(a?: User) {
    if (confirm("Are you sure to change status ?")) {
      this.ds.toggleUserStatus({ id: a.id, is_active: !a.is_active, user_id: this.user.id }).subscribe(r => {
        if (r.message == 'User status changed successfully.') {
          this.refreshToken$.next(undefined);
        }
      })
    }
  }

  add(data?: User) {
    if (!data) {
      data = null;
    }

    let config: MatDialogConfig = {
      // width: '600px',
      disableClose: true,
      hasBackdrop: true,
      data: data
    };
    let dialogRef = this.dialog.open(UserEditDialogComponent, config);

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshToken$.next(undefined);
      }
    });
  }

  delete(sch: User) {
    if (!confirm('Are you sure to delete User?')) return;
    this.isLoading = true;
    this.ds.deleteUser({ id: sch.id }).subscribe((data: any) => {
      this.isLoading = false;
      if (data.message == "User deleted successfully.") {
        this.refreshToken$.next(undefined);
      }
    });
  }

}
