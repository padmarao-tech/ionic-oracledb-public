import { HttpClient, HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import moment from 'moment';
import { BehaviorSubject, map, Observable, of } from 'rxjs';
import {
  Acheivement, Attachment, BankBranch, BankDetail, Block, ClientContact, ClientLicence, Discipline, Event, Invoice, Notice, Payment, Position, Scheme, Type, UserDetails, ViewCharge,
  // Master
  Bank, BankBranchByAPI, Client, ClientCategory, ClientType, Designation, Floor, RateCard, Rent, RentCalc, Screen, Shop, ShopComplex, State, TaxSlab, Suggestion
} from '../../shared/models';
// import { BookingCategory, Duration, Module, Playfield, Playfield_name, Playfield_type, Stadiumdetails, TariffDetails, TarrifOthersDetails, UserType } from '../../shared/models';
import { environment } from '../../../environments/environment';
import { District, Menu, User } from '../../shared/models';
import { EncryptionService } from './encryption.service';
// import {  BookingView, MembershipBooking, SchemeApplication, Viewdocuments, Viewprofile } from 'src/app/shared/models/user';

class tmpCache {
  storage_name: string;
  blob: Blob
}

@Injectable({
  providedIn: 'root'
})
export class DataService {


  login_err_message$ = new BehaviorSubject<string>(null);
  curr_user$ = new BehaviorSubject<User>(this.check_localstorage_user());
  curr_client$ = new BehaviorSubject<Client>(this.check_localstorage_client());
  curr_invoice$ = new BehaviorSubject<Invoice>(this.check_localstorage_invoice());
  curr_payment$ = new BehaviorSubject<Payment>(this.check_localstorage_payment());
  curr_notice$ = new BehaviorSubject<Notice>(this.check_localstorage_notice());
  curr_licence$ = new BehaviorSubject<ClientLicence>(this.check_localstorage_licence());
  curr_scheme$ = new BehaviorSubject<Scheme>(this.check_localstorage_scheme());
  lockout$ = new BehaviorSubject(localStorage.getItem('lockout'));

  shouldLockout$ = this.lockout$.asObservable().pipe(
    map(js => {
      let time_left = 0;

      if (js) {
        const lockout = JSON.parse(js);
        const lon = (lockout.lon) ? moment(lockout.lon) : moment();
        const lfor = (lockout.lfor) ? lockout.lfor : 0;
        lon.add(lfor, 'minutes');
        time_left = lon.clone().diff(moment(), 'ms', false);

        if (time_left <= 0) {
          localStorage.removeItem('lockout');
        }
      }

      return {
        time_left: time_left,
        message: 'Due to suspicious activity detected by our server from your system (device), you have been locked out (minimum: 10 mins).'
      };
    })
  );

  private headers = new HttpHeaders().set('Content-Type', 'application/json').set('Accept', 'application/json');

  // private currentUser : User;

  get PageSizeOptions() {
    return this._pageSizeOptions.slice();
  }
  private _pageSizeOptions: number[] = [25, 50, 100, 500, 1000];
  private currentPayment: Payment;
  blob_cache: tmpCache[] = [];

  constructor(
    private router: Router,
    private http: HttpClient,
    // public dialog: MatDialog,
    private encryptionService: EncryptionService,
  ) { }

  //#region set localStorage

  setUser(data: { message: string } & User) {
    delete data.message;
    const secret_key = this.generateClientSecretKey(32);
    const userData = secret_key + '.' + this.encryptionService.encrypt(JSON.stringify(data), secret_key);
    localStorage.setItem('user', JSON.stringify(userData));
    this.curr_user$.next(data);
  }

  setCurrentClient(data: Client) {
    localStorage.setItem('client', JSON.stringify(data));
    this.curr_client$.next(data);
  }

  setCurrentInvoice(data: Invoice) {
    localStorage.setItem('invoice', JSON.stringify(data));
    this.curr_invoice$.next(data);
  }

  setCurrentPayment(data: Payment) {
    localStorage.setItem('payment', JSON.stringify(data));
    this.curr_payment$.next(data);
  }

  setCurrentNotice(data: Notice) {
    localStorage.setItem('notice', JSON.stringify(data));
    this.curr_notice$.next(data);
  }

  setCurrentLicence(data: ClientLicence) {
    localStorage.setItem('licence', JSON.stringify(data));
    this.curr_licence$.next(data);
  }

  // schemes

  setCurrentScheme(data: Scheme) {
    const secret_key = this.generateClientSecretKey(32);
    const schemeData = secret_key + '.' + this.encryptionService.encrypt(JSON.stringify(data), secret_key);
    localStorage.setItem('scheme', JSON.stringify(schemeData));
    this.curr_scheme$.next(data);
  }
  //#endregion set localStorage

  //#region set ChecklocalStorage
  private check_localstorage_user() {
    let user: User = null;

    if (localStorage.getItem('user')) {
      const encData = JSON.parse(localStorage.getItem('user'));
      const [secret_key] = encData.split(".");
      const encUserData = encData.substring(secret_key.length + 1);
      user = JSON.parse(this.encryptionService.decrypt(encUserData, secret_key));
    }
    return user;
  }

  private check_localstorage_client() {
    let client: Client = null;

    if (localStorage.getItem('client')) {
      // const encData = JSON.parse(localStorage.getItem('client'));
      // const [secret_key] = encData.split(".");
      // const encUserData = encData.substring(secret_key.length + 1);
      // client = JSON.parse(this.encryptionService.decrypt(encUserData, secret_key));
      client = JSON.parse(localStorage.getItem('client'));
    }
    return client;
  }

  private check_localstorage_invoice() {
    let invoice: Invoice = null;

    if (localStorage.getItem('invoice')) {
      invoice = JSON.parse(localStorage.getItem('invoice'));
    }
    return invoice;
  }

  private check_localstorage_payment() {
    let payment: Payment = null;

    if (localStorage.getItem('payment')) {
      payment = JSON.parse(localStorage.getItem('payment'));
    }
    return payment;
  }

  private check_localstorage_notice() {
    let notice: Notice = null;

    if (localStorage.getItem('notice')) {
      notice = JSON.parse(localStorage.getItem('notice'));
    }
    return notice;
  }

  private check_localstorage_licence() {
    let licence: ClientLicence = null;

    if (localStorage.getItem('licence')) {
      licence = JSON.parse(localStorage.getItem('licence'));
    }
    return licence;
  }

  private check_localstorage_scheme() {
    let scheme: Scheme = null;

    if (localStorage.getItem('scheme')) {
      const encData = JSON.parse(localStorage.getItem('scheme'));
      const [secret_key] = encData.split(".");
      const encSchemeData = encData.substring(secret_key.length + 1);
      scheme = JSON.parse(this.encryptionService.decrypt(encSchemeData, secret_key));
    }
    return scheme;
  }

  //#endregion set ChecklocalStorage
  //Ashif

  //#endregion set ChecklocalStorage

  //#endregion set ChecklocalStorage

  //#region (Server Side) General Functions
  generateSecretKey() {
    return this.http.post<string>(
      environment.apiUrl + 'data-service.php',
      {},
      { headers: this.headers, params: new HttpParams().set('generateSecretKey', 'true') }
    );
  }

  generateClientSecretKey(length: number = 32) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  getServerTime() {
    return this.http.get<{ a: string }>(
      environment.apiUrl + 'data-service.php',
      { headers: this.headers, params: new HttpParams().set('getServerTime', 'true') }
    );
  }
  //#endregion (Server Side) General Functions

//End Region
  Logout() {
    const currentUser = this.check_localstorage_user();
    if (currentUser) {
      this.generateSecretKey().subscribe(secret_key => {
        let reqData = { session_id: this.encryptionService.encrypt(currentUser.id.toString(), secret_key) };
        this.http.post(
          environment.apiUrl + 'data-service.php',
          reqData,
          { headers: this.headers, params: new HttpParams().set('logout', 'true') }
        ).subscribe((data: any) => {
          if (data && data.message === 'Logout successful.')
            null;
        });
      });
    }
    this.clearDataServiceData();
  }

  private clearDataServiceData() {
    setTimeout(() => {
      // remove user, customer from local storage to log user out
      localStorage.removeItem('user');
      localStorage.removeItem('authorizationData');
      localStorage.removeItem('scheme');
      localStorage.removeItem('module');
      localStorage.removeItem('invoice');
      localStorage.removeItem('payment');
      localStorage.removeItem('notice');
      localStorage.removeItem('licence');
      localStorage.removeItem('stadiumbooking');
      localStorage.removeItem('schemeapp');
      this.curr_user$.next(null);
      this.curr_client$.next(null);
      this.curr_scheme$.next(null);
      this.curr_invoice$.next(null);
      this.curr_licence$.next(null);
      this.curr_notice$.next(null);
      this.curr_payment$.next(null);
    }, 0);
  }

  //#region Registered Customer
  login(data: { mobile_no_email: string, pwd: string, module: string }) {
    return this.http.post<User & { message: string, lockout_time?: number }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('login', 'true') }
    );
  }

  officerLogin(data: { mobile_no_email: string, pwd: string, module: string }) {
    return this.http.post<User & { message: string, lockout_time?: number }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('officerLogin', 'true') }
    );
  }

  // #region Master Disciplines
  getDisciplines() {
    return this.http.post<{ tot_rows: number, rows: Discipline[] }>(
      environment.apiUrl + 'data-service.php',
      undefined,
      { headers: this.headers, params: new HttpParams().set('getDisciplines', 'true') }
    );
  }
  //#endregion Master Disciplines

  // #region Master Districts
  getDistricts(data: any) {
    return this.http.post<{ tot_rows: number, rows: District[] }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('getDistricts', 'true') }
    );
  }

  get_upload_pdf(data: any) {
    return this.http.post<{ tot_rows: number, rows: District[] }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('get_upload_pdf', 'true') }
    );
  }

  saveDistrict(data: District) {
    return this.http.post<{ message: string, id?: number }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('saveDistrict', 'true') }
    );
  }

  isMasterDistrictExist(data: any) {
    return this.http.post<boolean>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('isMasterDistrictExist', 'true') }
    );
  }

  deleteDistrict(data: any) {
    return this.http.post(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('deleteDistrict', 'true') }
    );
  }

  toggleIsHavingShop(data: any) {
    return this.http.post<{ message: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('toggleIsHavingShop', 'true') }
    );
  }

  //#endregion Master Districts

  //#region scheme Master
  deleteScheme(data: Scheme) {
    return this.http.post<{ message: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('deleteScheme', 'true') }
    );
  }

  saveScheme(data: Scheme) {
    return this.http.post<{ message: string, code: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('saveScheme', 'true') }
    );
  }

  isMasterSchemeExist(data: Scheme) {
    return this.http.post<{ message: string, code: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('isMasterSchemeExist', 'true') }
    );
  }

  getSchemes(filter: any) {
    return this.http.post<{ rows: Scheme[], tot_rows: number }>(
      environment.apiUrl + 'data-service.php',
      filter,
      { headers: this.headers, params: new HttpParams().set('getSchemes', 'true') }
    );
  }

  toggleSchemeStatus(data: Scheme) {
    return this.http.post<{ message: string, code: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('toggleSchemeStatus', 'true') }
    );
  }

  //#endregion scheme Master

  // #region Master Events
  getEvents() {
    return this.http.post<{ tot_rows: number, rows: Event[] }>(
      environment.apiUrl + 'data-service.php',
      undefined,
      { headers: this.headers, params: new HttpParams().set('getEvents', 'true') }
    );
  }

  //#endregion Master Events

  // #region Master Positions
  getPositions() {
    return this.http.post<{ tot_rows: number, rows: Position[] }>(
      environment.apiUrl + 'data-service.php',
      undefined,
      { headers: this.headers, params: new HttpParams().set('getPositions', 'true') }
    );
  }

  //#endregion Master Positions

  getEventYears() {
    return this.http.post<{ rows: any[] }>(
      environment.apiUrl + 'data-service.php',
      undefined,
      { headers: this.headers, params: new HttpParams().set('getEventYears', 'true') }
    );
  }

  Upload(data: any) {
    const req = new HttpRequest<{ }>(
      'POST',
      environment.apiUrl + 'data-service.php',
      data, {
      params: new HttpParams().set('Upload', 'true'),
      reportProgress: true,
      responseType: 'json',
    });
    return this.http.request<{ file_name: string, message: string, storage_name: string, file_type: string, type_code: string, file_size: number ,id:number}>(req);
  }

  Upload_image(data: any): Observable<any> {
  const req = new HttpRequest<{}>(
    'POST',
    `${environment.apiUrl}data-service.php`,
    data, {
      params: new HttpParams().set('Upload_image', 'true'),
      reportProgress: true,
      responseType: 'json',
    });
  return this.http.request(req);
}

Upload_pdf(data: any): Observable<any> {
  const req = new HttpRequest<{}>(
    'POST',
    `${environment.apiUrl}data-service.php`,
    data, {
      params: new HttpParams().set('Upload_pdf', 'true'),
      reportProgress: true,
      responseType: 'json',
    });
  return this.http.request(req);
}
  getUploadedPdf(storage_name: string): Observable<Blob> {
    let blobCached: tmpCache;
    this.blob_cache.forEach(a => {
      if (a.storage_name === storage_name)
        blobCached = a;
    });

    if (blobCached) {
      return of(blobCached.blob);
    } else {
      let cusHeaders = this.headers.append('Accept', 'application/pdf');
      return this.http.post(
        environment.apiUrl + 'data-service.php',
        { storage_name: storage_name }, // environment.apiUrl +
        { headers: cusHeaders, params: new HttpParams().set('getUploadedPdf', 'true'), responseType: 'blob' }
      ).pipe(
        map((value, index) => {
          this.blob_cache.push({ storage_name: storage_name, blob: value });
          return value;
        })
      );
    }
  }



    getUploadedImage(storage_name: any) {
    // let blobCached: tmpCache;
    // this.blob_cache.forEach(a => {
    //   if (a.storage_name === storage_name)
    //     blobCached = a;
    // });

    // if (blobCached) {
    //   return of(blobCached.blob);
    // } else {
      // let cusHeaders = this.headers.set('Accept', 'text/plain');
      return this.http.post<{ img_data_base_64: string }>(
        environment.apiUrl + 'data-service.php',
        {storage_name: storage_name}, // environment.apiUrl +
        { headers: this.headers, params: new HttpParams().set('getUploadedImage', 'true') }
      );
      // .pipe(
      //   map((value, index) => {
      //     // this.blob_cache.push({storage_name: storage_name, blob: value});
      //     return value;
      //   })
      // );
    // }
  }


  register(data) {
    return this.http.post<{ message: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('register', 'true') }
    );
  }


  getUsers(filter: any) {
    return this.http.post<{ rows: User[], tot_rows: number }>(
      environment.apiUrl + 'data-service.php',
      filter,
      { headers: this.headers, params: new HttpParams().set('getUsers', 'true') }
    ).pipe(
      map(p => {
        p.rows = p.rows.map(s => {
          // s.group_name = UserGroups.filter(ug => ug.code === s.group_cd)[0].name;
          return s;
        });
        return p;
      })
    );
  }

  getUsers_Audit(filter: any) {
    return this.http.post<{ rows: User[], tot_rows: number }>(
      environment.apiUrl + 'data-service.php',
      filter,
      { headers: this.headers, params: new HttpParams().set('getUsers_Audit', 'true') }
    ).pipe(
      map(p => {
        p.rows = p.rows.map(s => {
          // s.group_name = UserGroups.filter(ug => ug.code === s.group_cd)[0].name;
          return s;
        });
        return p;
      })
    );
  }
  getOfficialUsers(filter: any) {
    return this.http.post<{ rows: User[], tot_rows: number }>(
      environment.apiUrl + 'data-service.php',
      filter,
      { headers: this.headers, params: new HttpParams().set('getOfficialUsers', 'true') }
    ).pipe(
      map(p => {
        p.rows = p.rows.map(s => {
          // s.group_name = UserGroups.filter(ug => ug.code === s.group_cd)[0].name;
          return s;
        });
        return p;
      })
    );
  }

  saveOfficialUSer(data: User) {
    return this.http.post<{ message: string, id?: number }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('saveOfficialUSer', 'true') }
    );
  }

  saveUser(data: User) {
    return this.http.post<{ message: string, id?: number }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('saveUser', 'true') }
    );
  }

  toggleUserStatus(data: any) {
    return this.http.post<{message: string}>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('toggleUserStatus', 'true') }
    );
  }

  deleteUser(data: any) {
    return this.http.post<{ message: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('deleteUser', 'true') }
    );
  }

  // changePassword(data: { oldPwd: any, pwd: any }) {
  //   return this.http.post<{ message: string }>(
  //     environment.apiUrl + 'data-service.php',
  //     data,
  //     { headers: this.headers, params: new HttpParams().set('changePassword', 'true') }
  //   );
  // }
  changePassword(data:any) {
    return this.http.post<{ message: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('changePassword', 'true') }
    );
  }
  forgetPassword(data:any) {
    return this.http.post<{ message: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('forgetPassword', 'true') }
    );
  }


  generateOTPChangePassword(data) {
    return this.http.post<{ message: string, id: number }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('generateOTPChangePassword', 'true') }
    );
  }

  validateUserOTP(data) {
    return this.http.post<{ message: string, id: number }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('validateUserOTP', 'true') }
    );
  }

  generateOTPForgotPassword(data) {
    return this.http.post<{ message: string, id: number, lockout_time: any }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('generateOTPForgotPassword', 'true') }
    );
  }

  resendOTPForgotPassword(data) {
    return this.http.post<{ message: string, lockout_time: any }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('resendOTPForgotPassword', 'true') }
    );
  }

  isUserMobileNoExist(data: { mobile_no: string, id?: number ,designation_code?:string }) {
    return this.http.post<boolean>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('isUserMobileNoExist', 'true') }
    );
  }

  isUserEmailExist(data: { email: string, id?: number,designation_code?:string }) {
    return this.http.post<boolean>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('isUserEmailExist', 'true') }
    );
  }

  isAadharExistUser(data: { aadhar_no: string, id?: number}) {
    return this.http.post<boolean>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('isAadharExistUser', 'true') }
    );
  }

  isPANExistUser(data: { pan_no: string, id?: number }) {
    return this.http.post<boolean>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('isPANExistUser', 'true') }
    );
  }

  isAcc_NoExistUser(data: { acc_no: string, id?: number }) {
    return this.http.post<boolean>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('isAcc_NoExistUser', 'true') }
    );
  }

  // id: number
  getUserMenus(filter: {}) {
    return this.http.post<Menu[]>(
      environment.apiUrl + 'data-service.php',
      filter,
      { headers: this.headers, params: new HttpParams().set('getUserMenus', 'true') }
    );
  }

  getUserDetail(filter: {}) {
    return this.http.post<UserDetails[]>(
      environment.apiUrl + 'data-service.php',
      filter,
      { headers: this.headers, params: new HttpParams().set('getUserDetails', 'true') }
    );
  }


  getUserDetails(params: any, options: { headers?: HttpHeaders } = {}) {
    return this.http.post<UserDetails>(
      environment.apiUrl + 'data-service.php',
      params,
      { ...options, params: new HttpParams().set('getUserDetails', 'true') }
    );
  }

  getBankDetails(data: any) {
    return this.http.post<BankDetail>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('getBankDetails', 'true') }
    );
  }

  getTypesDoc(filter: any) {
    return this.http.post<{ rows: Type[], tot_rows: number }>(
      environment.apiUrl + 'data-service.php',
      filter,
      { headers: this.headers, params: new HttpParams().set('getTypesDoc', 'true') }
    );
  }

  saveTypeDoc(data: Type) {
    return this.http.post<{ id: number, message: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('saveTypeDoc', 'true') }
    );
  }

  isMasterDocTypeExist(data: Type) {
    return this.http.post<{ message: string, code: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('isMasterDocTypeExist', 'true') }
    );
  }

  getTypesAttachments(data: any) {
    return this.http.post<{ rows: Attachment[], message: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('getTypesAttachments', 'true') }
    );
  }

  deleteType(data: Type) {
    return this.http.post<{ message: string, code: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('deleteType', 'true') }
    );
  }

  toggleDocTypeStatus(data: Type) {
    return this.http.post<{ message: string, code: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('toggleDocTypeStatus', 'true') }
    );
  }

  saveAttachment(data: any) {
    return this.http.post<{ message: string, id: number }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('saveAttachment', 'true') }
    );
  }

  SaveAchievement(data: Acheivement) {
    return this.http.post<{ message: string, rows: any[] }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('SaveAchievement', 'true') }
    );
  }

  getAchievements(data: any) {
    return this.http.post<{ message: string, rows: any[] }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('getAchievements', 'true') }
    );
  }

  saveApplication(data: any) {
    return this.http.post<{ message: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('saveApplication', 'true') }
    );
  }

  saveApplication_eps(data: any) {
    return this.http.post<{ message: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('saveApplication_eps', 'true') }
    );
  }
  saveApplication_mims(data: any) {
    return this.http.post<{ message: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('saveApplication_mims', 'true') }
    );
  }
  saveApplication_cds(data: any) {
    return this.http.post<{ message: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('saveApplication_cds', 'true') }
    );
  }
  saveApplication_hci(data: any) {
    return this.http.post<{ message: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('saveApplication_hci', 'true') }
    );
  }
  saveApplication_sq(data: any) {
    return this.http.post<{ message: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('saveApplication_sq', 'true') }
    );
  }
  GetIfscAndInsert(data: { ifsc: string }) {
    return this.http.post<{ rows: BankBranch, message: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('GetIfscAndInsert', 'true') }
    );
  }

  saveBankDetail(data: BankDetail) {
    return this.http.post<{ message: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('saveBankDetail', 'true') }
    );
  }


  //#region BankBranch Master
  getBankBranches(filter: {}) {
    return this.http.post<{ rows: BankBranch[], tot_rows: number }>(
      environment.apiUrl + 'data-service.php',
      filter,
      { headers: this.headers, params: new HttpParams().set('getBankBranches', 'true') }
    );
  }

  getBankBranchUsingAPI(data: { code: string }) {
    return this.http.post<{ message: string } & BankBranchByAPI>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('getBankBranchUsingAPI', 'true') }
    );
  }

  saveBank(data: Bank) {
    return this.http.post<{ message: string, id?: number }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('saveBank', 'true') }
    );
  }

  saveBankBranch(data: BankBranch) {
    //todo:Change @padma's Bank Branch data
    return this.http.post<{ message: string, ifsc?: string, bank_code?: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('saveBankBranch', 'true') }
    );
  }

  deleteBankBranch(data: { id: number }) {
    return this.http.post<{ message: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('deleteBankBranch', 'true') }
    );
  }

  isBankCodeExist(data: { id?: number, code: string }) {
    return this.http.post<boolean>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('isBankCodeExist', 'true') }
    );
  }

  isBankNameExist(data: { id?: number, name: string }) {
    return this.http.post<boolean>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('isBankNameExist', 'true') }
    );
  }

  // isBankBranchCodeExist(data: { ifsc?: string, code: string }) {
  isBankBranchCodeExist(data: { ifsc: string }) {
    return this.http.post<boolean>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('isBankBranchCodeExist', 'true') }
    );
  }

  searchBank(filter: { name: string }) {
    return this.http.post<Bank[]>(
      environment.apiUrl + 'data-service.php',
      filter,
      { headers: this.headers, params: new HttpParams().set('searchBank', 'true') }
    );
  }

  searchBankBranch(filter: { code: string }) {
    return this.http.post<BankBranch[]>(
      environment.apiUrl + 'data-service.php',
      filter,
      { headers: this.headers, params: new HttpParams().set('searchBankBranch', 'true') }
    );
  }

  toggleBankBranchStatus(data: { ifsc: number, is_active: boolean, user_id: number }) {
    return this.http.post<{ message: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('toggleBankBranchStatus', 'true') }
    );
  }
  //#endregion BankBranch Master


  //#region Designation Master
  getDesignations(filter: {}) {
    return this.http.post<{ tot_rows: number, rows: Designation[] }>(
      environment.apiUrl + 'data-service.php',
      filter,
      { headers: this.headers, params: new HttpParams().set('getDesignations', 'true') }
    );
  }

  saveDesignation(data: Designation) {
    return this.http.post<{ message: string, code: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('saveDesignation', 'true') }
    );
  }

  deleteDesignation(data: { code: string }) {
    return this.http.post<{ message: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('deleteDesignation', 'true') }
    );
  }

  toggleDesignationStatus(data: { code: string, is_active: boolean, user_id: number }) {
    return this.http.post<{ message: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('toggleDesignationStatus', 'true') }
    );
  }

  toggleIsShowPayment(data: { code: string, is_show_payment: boolean, user_id: number }) {
    return this.http.post<{ message: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('toggleIsShowPayment', 'true') }
    );
  }

  toggleIsShowOccupancy(data: { code: string, is_show_occupancy: boolean, user_id: number }) {
    return this.http.post<{ message: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('toggleIsShowOccupancy', 'true') }
    );
  }

  toggleIsShowLicence(data: { code: string, is_show_licence: boolean, user_id: number }) {
    return this.http.post<{ message: string }>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('toggleIsShowLicence', 'true') }
    );
  }

  isDesignationCodeExist(data: { designation_code: string }) {
    return this.http.post<boolean>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('isDesignationCodeExist', 'true') }
    );
  }

  isDesignationNameExist(data: { designation_name: string }) {
    return this.http.post<boolean>(
      environment.apiUrl + 'data-service.php',
      data,
      { headers: this.headers, params: new HttpParams().set('isDesignationNameExist', 'true') }
    );
  }

  getDesignationsRootWise(filter: { ref_designation_code?: string }) {
    return this.http.post<Designation[]>(
      environment.apiUrl + 'data-service.php',
      filter,
      { headers: this.headers, params: new HttpParams().set('getDesignationsRootWise', 'true') }
    );
  }
  //# endregion Designation Master

}

