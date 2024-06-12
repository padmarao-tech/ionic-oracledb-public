import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS, HttpHandler, HttpRequest, HttpInterceptorFn, HttpHandlerFn } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: "root"
})
export class AppRequestInterceptor {
  intercept (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
    let authReq = req;
    let authorizationData = localStorage.getItem('authorizationData');

    if (authorizationData)
    {
      authorizationData = 'Bearer ' + JSON.parse(authorizationData);
      authReq = req.clone({
        headers: req.headers.set('Authorization', authorizationData)
      });
    }
    return next(authReq);
  }
}

export const appRequestInterceptorProvider: HttpInterceptorFn = (req, next) => {
  let http = inject(AppRequestInterceptor);
  return http.intercept(req, next);
}
