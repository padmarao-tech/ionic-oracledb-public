import { Validators, UntypedFormGroup, UntypedFormControl, ValidatorFn, AbstractControl } from '@angular/forms';

import { Util, ValidationResult } from './utils';

export class PwdValidators {

  static pwdEqual(fieldName: string): ValidatorFn {
    let subscribe: boolean = false;
    return (control: UntypedFormControl):ValidationResult => {
      if (control.root instanceof UntypedFormGroup && control.root.controls[fieldName] instanceof UntypedFormControl)
      {
        let pwdEqual: AbstractControl = (control.root as UntypedFormGroup).controls[fieldName];
        if (!subscribe) {
          subscribe = true;
          pwdEqual.valueChanges.subscribe(() => {
            control.updateValueAndValidity();
          });
        }
        
        if (Util.isPresent(Validators.required(control))) return null;

        return pwdEqual.value == control.value ? null : {pwdEqual: true};
      }
      else
        return null;
    };
  }
}
