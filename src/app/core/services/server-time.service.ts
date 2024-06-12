import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import * as moment from 'moment-timezone';

import { DataService } from './data.service';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ServerTimeService {
  serverTime = new Subject<Date>();

  constructor(
    private dataService: DataService
  ) {
    setTimeout(() => {
      this.serverTime.asObservable().pipe(take(1)).subscribe(d => {
        if (!d)
        {
          this.dataService.getServerTime().subscribe(res => {
            this.updateNewTime(moment.utc(res.a).tz('Asia/Kolkata').toDate());
          });
        }
      })
    }, 5000);
  }

  updateNewTime(dt: Date) {
      this.serverTime.next(dt);
  }
}
