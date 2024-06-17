import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DataService } from '../../../../core/services/data.service';
import { Designation, User } from '../../../../shared/models';

@Component({
  selector: 'designation-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // materials
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './designation-edit-dialog.component.html',
  styleUrl: './designation-edit-dialog.component.css'
})
export class DesignationEditDialogComponent {

  fg: UntypedFormGroup;
  user: User;
  msg: string;
  isLoading: boolean;
  constructor(
    private ds: DataService,
    @Inject(MAT_DIALOG_DATA)
    public designation: Designation,
    private dialogRef: MatDialogRef<DesignationEditDialogComponent>
  ) { }

  ngOnInit() {
    this.user = this.ds.curr_user$.value;
    this.formInitialize();
    console.log(this.designation);

    if (this.designation) {
      this.formExisting();
    }
  }

  formInitialize() {
    this.fg = new UntypedFormGroup({
      code: new UntypedFormControl(null),
      name: new UntypedFormControl(null),
    })
  }

  formExisting() {
    this.fg = new UntypedFormGroup({
      code: new UntypedFormControl({ value: this.designation.code, disabled: true }),
      name: new UntypedFormControl(this.designation.name),
    })
  }

  save() {
    this.msg = null;
    this.fg.updateValueAndValidity({ onlySelf: false, emitEvent: true });

    if (this.fg.valid) {
      const sValue: Designation & { designation: Designation } = Object.assign({}, this.fg.value);
      sValue.code = this.fg.get('code').value;

      if (this.designation) {
        this.designation.name = sValue.name;
        this.designation.code = sValue.code;
        this.designation.up_by = this.user.email;
      } else {
        sValue.cre_by = this.user.email;
      }

      this.isLoading = true;
      this.ds.saveDesignation(this.designation ? this.designation : sValue).subscribe(data => {
        this.isLoading = false;
        if (data.message == "Designation saved successfully." || data.message == "Designation updated successfully.") {
          this.dialogRef.close(data);
        } else {
          this.msg = data?.message;
        }
      });
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
