export const environment = {
  production: true,
  apiUrl: 'http://localhost:8080/',
  loginAs(type: number) {
    let data: { mobile_no_email?: string, email?: string, pwd?: string } = { mobile_no_email: '', pwd: '' };

    switch (type) {
      case 1:
        data = { mobile_no_email: 'admin@gmail.com', pwd: 'Bcs@12345' };
        break;

      case 11:
        data = { mobile_no_email: 'c1md@gmail.com', pwd: '12345678' };
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
