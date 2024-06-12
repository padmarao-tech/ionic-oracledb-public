import * as moment from "moment";

export interface BankDetail {
  application_id: any;
  id?: number;
  user_id?: number;
  attachment_id?: number;
  acc_holder?: string;
  ifsc?: string;
  acc_no?: string;
  acc_type?: string;
  pan_no?: string;
  cre_ts?: string
  up_dt?: string;

  // Extended Properties
  branch_name?: string;
  bank_name?: string;
  bank_type?: string;
  // stadium booking 
  ifsc_fc?: string;
  code?: string;
}

export interface Acheivement {

  user_id?: number;
  attachment_id?:string;
  id?: number;
  application_id?: number;
  event_id?: number;
  discipline_id?: number;
  event_dt?: string
  position_id?: number;
  sub_discipline?: string;
  event_year?: string;
  cre_ts?: string;
  up_dt?: string;

  // Extended Properties
  type_code?: string;

  education_school?: string;
  education_year_of_passing?: string;
  education_percentage?: string;
  education_course?: string;

  // vip details 
  vip_name?: string;
  vip_designation?: string;

  // educational qualification 
  course?: string;
  year_of_passing?: string;
  clg_name?: string;
  remarks?: string;

  // sports Achievement
  sporting_event?: string;
  event_level?: string;
  role_position?: string;
  // venue_date?:string;

  // coaching experience 
  period?: string;
  designation?: string;
  type_of_institute?: string;
  salary_drawn?: string;

  // coaching achievement 
  sp_name?: string;
  institute_name: string;
  medal: string;
  venue_date: string;
  storage_name: string;

}
