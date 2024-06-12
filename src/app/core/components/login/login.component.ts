import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { distinctUntilChanged, filter, map, startWith } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DataService } from '../../services/data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { EncryptionService } from '../../services/encryption.service';
import { HttpResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,

    // Materials
    MatButtonModule
  ]
})
export class LoginComponent implements OnInit {

  is_under_development = !environment.production;
  // is_under_production = environment.production;
  is_under_production = false;
  isLoading = false;
  is_locked = false;
  submitted = false;
  returnUrl: string;
  // sub: Subscription;
  // sub1: Subscription;
  panelOpenState = false;
  msg: string;
  fg: UntypedFormGroup;
  mobile_no_email_fc = new UntypedFormControl(null, []);
  pwd_fc = new UntypedFormControl(null, [Validators.required]);
  view: boolean = false;
  check_mno_email$ = this.mobile_no_email_fc.valueChanges.pipe(
    startWith(''),
    filter((v: string) => v.length === 0 || v.length === 1),
    distinctUntilChanged(),
    map(v => {
      const r: { label: string, type: 'email' | 'text', minlength: 10 | 0, maxlength: 10 | 50, is_number: boolean } = { label: '', type: 'text', minlength: 0, maxlength: 50, is_number: false };
      switch (true) {
        case (v.length === 0):
          r.label = 'Registered Mobile No. / eMail ID';
          r.type = 'text';
          r.minlength = 0;
          r.maxlength = 50;
          r.is_number = false;
          this.mobile_no_email_fc.setValidators([Validators.required]);
          break;
        case (this.isNumber(v)):
          r.label = 'Registered Mobile No.';
          r.type = 'text';
          r.minlength = 10;
          r.maxlength = 10;
          r.is_number = true;
          this.mobile_no_email_fc.setValidators([Validators.required, Validators.minLength(r.minlength), Validators.maxLength(r.maxlength)]);
          break;
        default:
          r.label = 'Registered eMail ID';
          r.type = 'email';
          r.minlength = 0;
          r.maxlength = 50;
          r.is_number = false;
          this.mobile_no_email_fc.setValidators([Validators.required, Validators.maxLength(r.maxlength), Validators.email]);
          break;
      }
      return r;
    })
  );

  constructor(
    private ds: DataService,
    private route: ActivatedRoute,
    private router: Router,
    private encryptionService: EncryptionService,
    // private dialog: MatDialog,
  ) { }

  ngOnInit() {
    console.log("logout");

    this.ds.Logout();

    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home/dashboard';

    this.fg = new UntypedFormGroup({
      mobile_no_email: this.mobile_no_email_fc,
      pwd: this.pwd_fc,
      module_code: new UntypedFormControl('LPMS')
    });

    this.ds.login_err_message$.subscribe(msg => this.msg = msg);

    // Check lockout
    this.ds.shouldLockout$.subscribe(l => {
      if (l.time_left > 0) {
        this.lockLoginFields(l.time_left);
        this.msg = l.message;
      }
    });
  }

  ngOnDestroy() {
    this.ds.login_err_message$.next(null);
  }

  private isNumber(char: string) {
    return ([1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(d => d.toString()).findIndex(d => d === char) >= 0);
  }

  number_chars_only(e: KeyboardEvent, is_number: boolean = false) {
    return is_number ? this.isNumber(e.key) : true;
  }

  Login() {
    this.submitted = true;
    this.ds.login_err_message$.next(null);
    this.fg.updateValueAndValidity({ onlySelf: false, emitEvent: true });

    setTimeout(() => {
      if (this.fg.valid) {
        let sValue = Object.assign({}, this.fg.value);
        this.isLoading = true;
        this.ds.generateSecretKey().subscribe(key => {
          console.log(key);

          sValue.mobile_no_email = this.encryptionService.encrypt(sValue.mobile_no_email, key);
          sValue.pwd = this.encryptionService.encrypt(sValue.pwd, key);
          this.ds.login(sValue).subscribe(data => {
            this.isLoading = false;
            if (data && data.message) {
              if (data.message == "User authenticated") {
                // data.designation_code = this.encryptionService.decrypt(data.designation_code, key);
                // data.id = this.encryptionService.decrypt(data.id, key);
                this.ds.setUser(data); // , 'PUBLIC'
                this.router.navigate([this.returnUrl]);
              } else if (data.message === 'Lockout') {
                const js = JSON.stringify({ lon: new Date(), lfor: (1 + data.lockout_time) });
                localStorage.setItem('lockout', js);
                this.ds.lockout$.next(js);
              } else {
                this.ds.login_err_message$.next(data.message);
              }
            }
          });
        },
          (res: HttpResponse<any>) => {
            console.log(res.headers);

          });
      }
    }, 100);
  }

  lockLoginFields(lockout_time: number) {
    this.fg.disable();
    this.is_locked = true;
    setTimeout(() => {
      this.fg.enable();
      this.is_locked = false;
      this.ds.login_err_message$.next(null);
    }, lockout_time);
  }

  loginAs(type: number) {
    this.ds.login_err_message$.next(null);
    const data = environment.loginAs(type);
    this.fg.patchValue(data);
    this.Login();
  }

  gotoForgotPassword() {
    this.router.navigate(['/public/forgot-password']);
  }

  gotoNewConnectionApplicant() {
    this.router.navigate(['/nc/login']);
  }

  gotoRegisterCustomer() {
    this.router.navigate(['/public/cus-reg']);
  }

  // gotoQuickPay() {
  //   this.router.navigate(['/public/quick-pay']);
  // }

  gotoIndex() {
    this.router.navigate(['/index']);
  }

  showChangePassword() {
    // const user = { id: this.user.id };

    // const config: MatDialogConfig = {
    //   width: '550px',
    //   disableClose: true,
    //   hasBackdrop: true,
    //   // data: user
    // };
    // const dialogRef = this.dialog.open(ForgotPasswordComponent, config);

    // dialogRef.afterClosed().subscribe((result?: any) => {
    //   if (result) {
    //     this.router.navigate(['/login'], { skipLocationChange: true });
    //   }
    // });
  }
}
