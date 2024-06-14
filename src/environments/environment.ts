// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // node
  // apiUrl: 'http://localhost:3001/',
  // php
  // apiUrl: 'http://localhost:3001/',
  // Java Springboot
  apiUrl: 'http://localhost:8080/',
  // apiUrl: 'http://data.angular.oracledb.in/php/',
  loginAs(type: number) {
    let data: { mobile_no_email?: string, email?: string, pwd?: string } = { mobile_no_email: '', pwd: '' };

    switch (type) {
      case 1:
        data = { mobile_no_email: 'admin@gmail.com', pwd: 'Bcs@12345' };
        break;

      case 11:
        data = { mobile_no_email: 'testing1@gmail.com', pwd: 'oot@12345' };
        break;

      case 21:
        data = { mobile_no_email: 'c1brc1md@gmail.com', pwd: '12345678' };
        break;

      case 22:
        data = { mobile_no_email: 'c1brc2md@gmail.com', pwd: '12345678' };
        break;

      case 31:
        data = { mobile_no_email: 'c1wh1md@gmail.com', pwd: '12345678' };
        break;

      case 32:
        data = { mobile_no_email: 'drvr2@gmail.com', pwd: '12345678' };
        break;

      default:
        data = { mobile_no_email: '', pwd: '' };
        break;
    }
    return data;
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
