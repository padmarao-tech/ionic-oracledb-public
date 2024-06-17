import { Component, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { BehaviorSubject, Observable, combineLatest, debounceTime, distinctUntilChanged, map, startWith, switchMap, take, tap } from 'rxjs';
import { Designation, User } from '../../../shared/models';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DataService } from '../../../core/services/data.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DesignationEditDialogComponent } from './designation-edit/designation-edit-dialog.component';

@Component({
  selector: 'designations',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // materials
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './designations.component.html',
  styleUrl: './designations.component.css'
})
export class DesignationsComponent {
  @ViewChild(MatPaginator)
  paginator: MatPaginator;

  pageSize = 10;
  pageSizeOptions: number[] = this.ds.PageSizeOptions;
  isLoading: boolean = false;
  user: User;

  filter_include_inactive = new UntypedFormControl(false);
  filter_search_text = new UntypedFormControl('');

  designations$ = new Observable<Designation[]>;
  private page$: Observable<PageEvent>;
  private readonly refreshToken$ = new BehaviorSubject(undefined);
  constructor(
    private ds: DataService,
    private dialog: MatDialog
  ) { }

  ngOnInit(){
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

    this.designations$ = combineLatest([
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
        return this.ds.getDesignations(filters);
      }),
      map(x => {
        this.isLoading = false;
        this.paginator.length = x.tot_rows;
        return x.rows;
      })
    )
  }

  toggleStatus(a?: Designation){
    if(confirm("Are you sure to change status ?")){
      this.ds.toggleDesignationStatus({ code: a.code, is_active: !a.is_active, user_id: this.user.id }).subscribe( r =>{
        if(r.message == 'Designation status changed successfully.'){
          this.refreshToken$.next(undefined);
        }
      })
    }
  }

  add(data?: Designation) {
    if (!data) {
      data = null;
    }

    let config: MatDialogConfig = {
      // width: '600px',
      disableClose: true,
      hasBackdrop: true,
      data: data
    };
    let dialogRef = this.dialog.open(DesignationEditDialogComponent, config);

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshToken$.next(undefined);
      }
    });
  }

  delete(sch: Designation) {
    if (!confirm('Are you sure to delete Designation?')) return;
    this.isLoading = true;
    this.ds.deleteDesignation({code: sch.code}).subscribe((data: any) => {
      this.isLoading = false;
      if (data.message == "Designation deleted successfully.") {
        this.refreshToken$.next(undefined);
      }
    });
  }

}
