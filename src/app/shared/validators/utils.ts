import { AbstractControl } from '@angular/forms';

export interface ValidationResult {
  [key:string]:boolean;
}

export class Util {
  static isNotPresent(control: AbstractControl): boolean {
    let value = control.value;
    if (value === undefined || value === null) {
      return true;
    }
    return value !== '' ? false : true;
  };

  static isPresent(obj: any):boolean {
    return obj !== undefined && obj !== null;
  }

}
