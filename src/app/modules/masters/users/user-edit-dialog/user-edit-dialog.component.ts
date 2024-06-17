import { Component, Inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Designation, User } from '../../../../shared/models';
import { DataService } from '../../../../core/services/data.service';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PwdValidators } from '../../../../shared/validators/pwd.validator';
import { finalize, iif, map, of, switchMap, tap, timer } from 'rxjs';
import { EncryptionService } from '../../../../core/services/encryption.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-user-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // materials
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './user-edit-dialog.component.html',
  styleUrl: './user-edit-dialog.component.css'
})
export class UserEditDialogComponent implements OnInit {

  fg: UntypedFormGroup;
  user: User;
  msg: string;
  isLoading: boolean;

  designations: Designation[];
  view: boolean = false;

  constructor(
    private ds: DataService,
    private es: EncryptionService,
    @Inject(MAT_DIALOG_DATA)
    public data: User,
    private dialogRef: MatDialogRef<UserEditDialogComponent>
  ) { }

  ngOnInit() {
    this.user = this.ds.curr_user$.value;

    this.getDesignations();
    this.formInitialize();
    if (this.data) {
      this.formExisting();
    }
  }

  formInitialize() {
    this.fg = new UntypedFormGroup({
      designation_code: new UntypedFormControl(null, Validators.required),
      name: new UntypedFormControl(null, [Validators.required, Validators.maxLength(100)]),
      email: new UntypedFormControl(null, [Validators.required,Validators.email, Validators.maxLength(50)], [this.isUserEmailExist]),
      mobile_no: new UntypedFormControl(null, [Validators.required, Validators.minLength(10), Validators.maxLength(10)], [this.isUserMobileNoExist]),
      pwd: new UntypedFormControl(null, [Validators.minLength(8), Validators.maxLength(50)]),
      conPwd: new UntypedFormControl(null, [Validators.minLength(8), Validators.maxLength(50), PwdValidators.pwdEqual('pwd')]),
    })
  }

  formExisting() {
    this.fg = new UntypedFormGroup({
      designation_code: new UntypedFormControl(this.data.designation_code, Validators.required),
      name: new UntypedFormControl(this.data.name, [Validators.required, Validators.maxLength(100)]),
      email: new UntypedFormControl(this.data.email, [Validators.required,Validators.email, Validators.maxLength(50)], [this.isUserEmailExist]),
      mobile_no: new UntypedFormControl(this.data.mobile_no, [Validators.required, Validators.minLength(10), Validators.maxLength(10)], [this.isUserMobileNoExist]),
    })
  }

  save() {
    this.msg = null;
    this.fg.updateValueAndValidity({ onlySelf: false, emitEvent: true });

    if (this.fg.valid) {
      const sValue: User = Object.assign({}, this.fg.value);
      sValue.designation_code = (typeof this.fg.get('designation_code').value == 'object')? this.fg.get('designation_code').value?.CODE: this.fg.get('designation_code').value;

      if (this.data) {
        this.data.up_by = this.user.email;
      } else {
        this.data = Object.assign({});
        sValue.cre_by = this.user.email;
      }
      this.data.name = sValue.name;

      this.isLoading = true;
      this.ds.generateSecretKey().subscribe(secret_key => {
        this.data.designation_code = this.es.encrypt(sValue.designation_code, secret_key);
        this.data.mobile_no = this.es.encrypt(sValue.mobile_no, secret_key);
        this.data.email = this.es.encrypt(sValue.email, secret_key);
        this.data.pwd = this.es.encrypt(sValue.pwd, secret_key);
        this.ds.saveUser(this.data).subscribe(data => {
          this.isLoading = false;
          if (data.message == "User saved successfully." || data.message == "User updated successfully.") {
            this.dialogRef.close(data);
          } else {
            this.msg = data?.message;
          }
        });
      })
    }
  }

  getDesignations(){
    this.ds.getDesignations({}).subscribe(r => {
      this.designations = r.rows
    })
  }

  cancel() {
    this.dialogRef.close();
  }

  private readonly isUserEmailExist = (fc: UntypedFormControl) => {
    return timer(500).pipe(
      tap(_ => this.isLoading = true),
      switchMap(() => {
        return iif(
          () => !!fc.value,
          this.ds.generateSecretKey().pipe(
            switchMap(secret_key => {
              const email = fc.value;
              const encryptedemail = this.es.encrypt(email, secret_key);
              // const designation_code = fc.value;
              // const encryptedemail = this.encryptionService.encrypt(email, secret_key);

              return this.ds.isUserEmailExist({ email: encryptedemail , designation_code:'' }).pipe(
                map(v => v ? ({ isUserEmailExist: true } as ValidationErrors) : null),
                // of(null as ValidationErrors)
              );
            })
          ),

          of(null as ValidationErrors)
        )
      }),
      finalize(() => this.isLoading = false)
    );
  };

  private readonly isUserMobileNoExist = (fc: UntypedFormControl) => {
    return timer(500).pipe(
      tap(_ => this.isLoading = true),
      switchMap(() => {
        return iif(
          () => !!fc.value,
          this.ds.generateSecretKey().pipe(
            switchMap(secret_key => {
              const mobile_no = fc.value;
              const encryptedmobile_no= this.es.encrypt(mobile_no, secret_key);

              return this.ds.isUserMobileNoExist({ mobile_no: encryptedmobile_no , designation_code:'' }).pipe(
                map(v => v ? ({ isUserMobileNoExist: true } as ValidationErrors) : null),
                // of(null as ValidationErrors)
              );
            })
          ),

          of(null as ValidationErrors)
        )
      }),
      finalize(() => this.isLoading = false)
    );
  };
}

