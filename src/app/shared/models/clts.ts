import * as moment from "moment";
import { Attachment } from "./doc";

export interface ClientContact {
  id?: number;
  client_id?: number;
  name?: string;
  dept?: string;
  desig?: string;
  email?: string;
  mobile?: string;
  landline?: string;
  is_active?: boolean;
  contact_type?: string;
  cre_ts?: string
  cre_by?: string;
  up_dt?: string
  up_by?: string;
}

export interface ClientLicence {
  id?: number;
  client_id?: any;
  start_dt?: string;
  end_dt?: string
  lock_in?: string
  floor_id?: number;
  shop_id?: number;
  area_occupied?: number;
  deed_no?: string;
  deed_location?: string;
  advance_amount?: number;
  is_active?: boolean;
  notice_period?: number;
  rent_free?: boolean;
  rental_frequency?: string;
  pay_by?: number;
  special_condition?: string;
  rental_details?: string;
  registration_details?: string;
  rent_free_till?: string
  belated_interest?: number;
  access_provision?: string;
  is_terminated?: boolean;
  termination_date?: string
  cre_ts?: string
  cre_by?: string;
  up_dt?: string
  up_by?: string;
  attachment_id?: number;
  amt_per_sqft?: number;
  is_per_sqft?: boolean;
  tot_amt?: number;
  tax_per?: number;
  status?: string;
  app_flag?: string;
  designation_name?: string;
  remarks?: string;
  o_designation_code?: string;
  level?: number;

  // Extended Properties
  attachment?: Attachment;
  file?: File;
  file_name?: string;
  storage_name?: string;
  file_type?: string;
  shop_code?: string;
  shop_ref_no?: string;
  day_remain?: number;
  client_name?: string;
  district_id?: number;
  tot_amt_word?: string;
  advance_amount_word?: string;
  amt_per_sqft_word?: string;
  color?: string;
  escalation_matrix_id?: number;
  is_expired?: boolean;
}

export interface Invoice {
name: any;
  invoice_id?: number;
  invoice_no?: string;
  licence_id?: number;
  client_id?: number;
  rent_id?: number;
  date?: string
  start_date?: string
  end_date?: string
  line_total?: number;
  pay_by_date?: string
  current_status?: string;
  shop_id?: number;
  shop_area?: number;
  shop_rate?: any;
  tax_percent?: number;
  tax_amount?: number;
  type?: string;
  fin_year?: string;
  cre_ts?: string
  cre_by?: string;
  up_dt?: string
  up_by?: string;
  is_adv?: boolean;

  // Extended Properties
  client_name?: string;
  address?: string;
  address_2?: string;
  pincode?: string;
  gst?: string;
  gst_state_tin?: string;
  amount_in_word?: string;
  tax_in_word?: string;
  email?: string;
  mobile_no?: string;
  receipt_no?: string;
  receipt_dt?: string;
  shop_code?: string;
  shop_name?: string;
  paid_amt?: number;
  tax_sub_amt?: number;
  total?: any
  pending_amt?: any;
  penalty?: any;
  no?: string;
  licence_no?: string;
  tot_amt?: any;
  tax_amount_str?: string;
  tax_sub_amt_str?: string;
  line_total_str?: string;
  shop_rate_str?: string;
  total_str?: string;
  penalty_str?: string;
  paid_amt_str?: string;
  amt_str?: string;
  is_terminated?: boolean
}

export interface Payment {
  // no: string,
  // bdt: moment.Moment | string,
  // c_code: string,
  // ls: number,
  // mos: string,
  // amount: number,
  // trnx_no_own: string,
  // status: string,
  // d_status: string
  // is_legecy: boolean,

  // sbr: number,
  // lb_nod: number, //no_of_days_since_last_booking
  no?:any;
  id?: number;
  firm_id?: string;
  trnx_no_own?: string;
  application_id?: string;
  trnx_dt_own?: string;
  trnx_amt?: number;
  gw_code?: string;
  rzp_order_id?: string;
  rzp_order_tsp?: string;
  rzp_signature?: string;
  hdfc_reference_no?: number;
  trnx_no_gw?: string;
  trnx_dt_gw?: string;
  status?: string;
  failure_reason?: string;
  is_manually_cancelled?: string;
  cancelled_dt?: string;
  remarks?: string;
  receipt_no?: string;
  //payment count
  year?: number;
  tt_rec_pay?: number;
  tt_pend_pay?: number;
  issued?: number;
  pend_clr?: number;
  tt_rec_upa_pay?: number;

  //payment list
  name?: string;
  contact_mobile?: string;
  contact_phone?: string;
  paid_amt?: number;
  tot_employees?: number;
  locality?: string;
  trnx_amt_in_word?: string;
  client_name?: string;
  shop_code?: string;
  is_adv?: boolean;
  start_date?: string;
  to_json?: Invoice[];
  trnx_amt_str?: string;
}

export interface Notice {
  id?: number;
  reminder_type?: number;
  invoice_id?: number;
  invoice_no?: string;
  licence_id?: number;
  client_id?: number;
  rent_id?: number;
  date?: string
  start_date?: string
  end_date?: string
  line_total?: number;
  pay_by_date?: string
  current_status?: string;
  shop_id?: number;
  shop_area?: number;
  shop_rate?: number;
  tax_percent?: number;
  tax_amount?: number;
  type?: string;
  fin_year?: string;
  cre_ts?: string
  cre_by?: string;
  up_dt?: string
  up_by?: string;
  is_adv?: boolean;

  // Extended Properties
  client_name?: string;
  address?: string;
  address_2?: string;
  pincode?: string;
  gst?: string;
  gst_state_tin?: string;
  amount_in_word?: string;
  tax_in_word?: string;
  email?: string;
  mobile_no?: string;
  receipt_no?: string;
  receipt_dt?: string;
  shop_code?: string;
  shop_name?: string;
  not_dt?: string;
  dist_code?: string;
  ref_id?: number;
}

export interface Suggestion {
  id?: string;
  licence_id?: number;
  status?: string;
  designation_code?: string;
  user_id?: number;
  to_designation_code?: string;
  cre_ts?: string;
  application_id?: string;
  remarks?: string;
  designation_name?: string;
  escalation_matrix_id?: number;
  level?: number;
  level_to?: number;
  no?: number;
  stadia_id?: number;
  type_of_applicant:string;
  membership_start_date?: string;
  membership_end_date?: string;
  // Extended Properties
}


export interface Receipt {
  no?: any;
  gst?: string;
  sgst?: string;
  sgsts?: number;
  tax_amount?: number;
  tax_amount_str?: string;
  application_id?: string;
  current_status?: string;
  total?: number;
  is_terminated?: string;
  playfiled?: string;
  type_of_applicant?: string;
  stadia_name?: string;
  district?: string;
  event_date?: string;
  type_of_category?: string;
  // bdt: moment.Moment | string,
  // c_code: string,
  // ls: number,
  // mos: string,
  // amount: number,
  // trnx_no_own: string,
  // status: string,
  // d_status: string
  // is_legecy: boolean,

  // sbr: number,
  // lb_nod: number, //no_of_days_since_last_booking

  id?: number;
  firm_id?: string;
  trnx_no_own?: string;
  trnx_dt_own?: string;
  trnx_amt?: any;
  gw_code?: string;
  rzp_order_id?: string;
  rzp_order_tsp?: string;
  rzp_signature?: string;
  hdfc_reference_no?: number;
  trnx_no_gw?: string;
  trnx_dt_gw?: string;
  status?: string;
  failure_reason?: string;
  is_manually_cancelled?: string;
  cancelled_dt?: string;
  remarks?: string;
  receipt_no?: string;
  receipt_dt?: string;
  //payment count
  year?: number;
  tt_rec_pay?: number;
  tt_pend_pay?: number;
  issued?: number;
  pend_clr?: number;
  tt_rec_upa_pay?: number;

  //payment list
  name?: string;
  contact_mobile?: string;
  contact_phone?: string;
  paid_amt?: number;
  tot_employees?: number;
  locality?: string;
  trnx_amt_in_word?: string;
  client_name?: string;
  shop_code?: string;
  is_adv?: boolean;
  start_date?: string;
  to_json?: Invoice[];
  receipt_amt?: any;
  receipt_amt_in_word?: string;
  pincode?: string;
  address?: string;
  applied_on?:string;
  trnx_amt_str?:string;

}
