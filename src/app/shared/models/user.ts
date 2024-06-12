import { Attachment } from "./doc";

export interface User {
  id?: any;
  scheme_id?: number;
  client_id?: number;
  name?: string;
  designation_code?: string;
  cre_ts?: string
  up_dt?: string
  mobile_no: string;
  email?: string;
  is_active?: boolean;
  pwd?: string;
  c_psw?: string;
  is_show_payment?: boolean;
  is_show_occupancy?: boolean;
  is_show_licence?: boolean;

  // Extended Properties
  module_code?: string;
  designation_name?: string;
  district_id?: any;
  up_by?: string;
  cre_by?: string;
  ref_designation_code?: string;
  module?: string;
  //Changes

  sdo_id?: any;
  discipline_id?: number;
}

export interface UserDetails {
  id?: number;
  type?: string;
  discipline_id?: number;
  name?: string;
  designation_code?: string;
  gender?: string;
  father_name?: string;
  mother_name?: string;
  f_occupation?: string;
  m_occupation?: string;
  dob?: string;
  blood_group?: string;
  address?: string;
  district_id?: number;
  pincode?: string;
  state?: string;
  nationality?: string;
  phone_no?: string;
  mobile_no?: string;
  email?: string;
  password?: string;
  aadhar_no?: string;
  last_four_digits?: string;
  ver_flag?: string;
  p_address?: string;
  p_district_id?: number;
  p_pincode?: string;
  remark?: string;
  is_active?: string;
  last_login?: string;
  session_token?: string;
  failure_attempt?: string;
  lockout_on?: string;
  cre_ts?: string;
  up_dt?: string;
  aadhar_last_four: any;

  // Extended Properties
  discipline_name?: string;
  district_name?: string;

  //stadium booking extra user
  type_of_applicant?: string;
  cont_person_name?: string;
  org_name?: string;
  choose_id_proof?: string;
  id_proof_number?: string;
}


// stadium booking form
export interface Stadiumbooking {
  [x: string]: any;
  is_active: any;
  id?: number;
  application_id?: string;
  user_id?: string;
  date?: string;
  type_of_applicant?: string;
  district?: string;
  others?: string;
  stadia_name?: string;
  event_date?: string;
  play_filed_name?: string;
  play_filed_type?: string;
  date_pre?: string;
  pre_event_start_date?: string;
  pre_event_end_date?: string;
  date_dis?: string;
  dis_event_start_date?: string;
  dis_event_end_date?: string;
  event_description?: string;
  org_name?: string;
  org_address?: string;
  nodal_name?: string;
  nodal_designation?: string;
  nodal_mobilnumber?: string;
  gst_number?: string;
  pancard?: string;
  description?: string;
  admin_status?: string;
  last_login?: string;
  session_token?: string;
  failure_attempt?: string;
  lockout_on?: string;
  cre_ts?: string;
  up_dt?: string;
  USER_PHOTO?: string;
  CHQ_PB?: string;
  BOOK_LT?: string;
  // Extended Properties
  district_name?: string;
}

export interface BookingView {

  application_id?: string;
  user_id?: any;
  code?: string;
  date?: string;
  type_of_applicant?: string;
  receipt_amt?: number;
  trnx_no_own?: string;
  district?: any;
  others?: string;
  stadia_name?: string;
  type_of_category?: any;
  category_sub_type?: any;
  play_filed_name?: string;
  play_filed_type?: string;
  date_pre?: string;
  pre_event_start_date?: string;
  pre_event_end_date?: string;
  date_dis?: string;
  dis_event_start_date?: string;
  dis_event_end_date?: string;
  event_description: string;
  org_name?: string;
  org_address?: string;
  organ_name?: string;
  organ_address?: string;
  nodal_name?: string;
  nodal_designation?: string;
  nodal_mobilnumber?: string;
  nodal_alter_mobilnumber?: string;
  gst_number?: string;
  pan_no?: string;
  bl_filename?: string;
  cl_filename?: string;
  attachment_id_bl?: string;
  attachment_id_cl?: string;
  displayname?: string;
  file_name?: string;
  description?: string;
  acc_name: string;
  bank_name?: string;
  acc_holder?: number;
  branch_name?: string;
  ifsc_fc?: string;
  acc_no?: string;
  bank_type?: string;
  admin_status?: string;
  last_login?: string;
  session_token?: string;
  failure_attempt?: string;
  lockout_on?: string;
  cre_ts?: string;
  up_dt?: string;
  [x: string]: any;
  address_2?: any;
  is_active: any;
  // Extended Properties
  district_name?: string;
  stadia_id?: number;
  centralized_ac?: string;
  food_stall?: string;
  additional_park_b?: string;
  additional_park_jn?: string;
  unfurnished?: string;
  furnished?: string;
  unfurnished_room?: string;
  furnished_room?: string;
  banner_inner?: string;
  banner_outer?: string;
  // user
  
  current_status: any;
  event_date: any;
  trnx_dt_own?: any;
  event_date_count?: any;
  length: any;
  rows: any;
  tot_rows: any;
  id?: any;
  type?: string;
  no?: string;
  name?: string;
  designation_code?: string;
  vip?: string;
  address?: string;
  district_id?: any;
  pincode?: string;
  state?: string;
  nationality?: string;
  phone_no?: string;
  mobile_no?: string;
  email?: string;
  password?: string;
  aadhar_no?: string;
  ver_flag?: string;
  p_address?: string;
  p_district_id?: number;
  p_pincode?: string;
  remarks?: string;
  vip_name?: string;
  vip_designation?: string;
  tariff_details?: string;
  cre_by?: string;
  paid_amt?: number;
  total_amount?: number;
  cgst?: number;
  sgst?: number;
  sgst_str?: string;
  cgst_str?: string;
  line_total?: number;
  line_total_str?: string;
  paid_amt_str?: string;
  total_str?: string;
  total?: number;
  tariff_amount?: number;
  all_facilities_amount?: number;

  up_by?: string;
  tax_amount?: number;
  // admin
  stadium_id?: string;
  designation_name: string;
  color: string;
  status: string;
  pay_status: string;
  app_flag?: string;
  //stadium booking extra user
  tax_amount_str?: any;
  tariff_amount_str?: string;
  all_facilities_amount_str?: string;
  pre_days_count_amount? :number;
  dis_days_count_amount? :number;
  pre_days_count_amount_str?: string;
  dis_days_count_amount_str?: string;

  cont_person_name?: string;

  choose_id_proof?: string;
  id_proof_number?: string;
  storage_name?: string;
  attachment?: Attachment;
  attachment_id?: number;
  applied_on?: string;
  level?: number;
  type_of_duration?: string;
  type_of_applicant_id?: string;
  duration_id?: string;
  escalation_matrix_id?: number;
  o_designation_code?: string;
  dis_code?: string;
  district_code?: string;
  // Extended Properties
  client_name?: string;
  gst?: string;
  gst_state_tin?: string;
  amount_in_word?: string;
  tax_in_word?: string;
  receipt_no?: string;
  receipt_dt?: string;
  shop_code?: string;
  shop_name?: string;
  tax_sub_amt?: number;
  pending_amt?: any;
  penalty?: any;
  licence_no?: string;
  tot_amt?: any;
  tax_sub_amt_str?: string;
  shop_rate_str?: string;
  penalty_str?: string;
  amt_str?: string;
  is_terminated?: boolean;
  is_adv?: string;
  advance_amount?: any;
  total_amont?: number;
}

export interface Viewdocuments {
  id?: number;
  user_id?: any;
  scheme_id?: number;
  client_id?: number;
  designation_code?: string;
  USER_PHOTO?: string;
  CHQ_PB?: string;
  BOOK_LT?: string;
  mobile_no: string;
  email?: string;
  is_active?: boolean;
  pwd?: string;
  storage_name?: string;
  // Extended Properties
  module?: string;
  designation_name?: string;
  district_id?: number;
  up_by?: string;
  cre_by?: string;
}

// coaches view profile 
export interface Viewprofile {
  id?: number;
  type?: string;
  discipline_id?: number;
  name?: string;
  designation_code?: string;
  gender?: string;
  father_name?: string;
  mother_name?: string;
  f_occupation?: string;
  m_occupation?: string;
  dob?: string;
  blood_group?: string;
  address?: string;
  district_id?: number;
  pincode?: string;
  state?: string;
  nationality?: string;
  phone_no?: string;
  mobile_no?: string;
  email?: string;
  password?: string;
  aadhar_no?: string;
  ver_flag?: string;
  p_address?: string;
  p_district_id?: number;
  p_pincode?: string;
  remark?: string;
  is_active?: string;
  last_login?: string;
  session_token?: string;
  failure_attempt?: string;
  lockout_on?: string;
  cre_ts?: string;
  up_dt?: string;


  // Extended Properties
  discipline_name?: string;
  district_name?: string;

  // bank details 

  user_id?: number;
  attachment_id?: number;
  acc_holder?: number;
  ifsc?: string;
  acc_no?: string;
  acc_type?: string;
  pan_no?: string;
  remarks?: string;

  // Extended Properties
  branch_name?: string;
  bank_name?: string;

  // stadium booking 
  ifsc_fc?: string;
  code?: string;
  attachment?: Attachment;

  client_id?: number;
  type_code?: string;
  file_name?: string;
  file_type?: any;
  file_size?: number;
  storage_name?: string;

  // Extended Properties
  type_name?: string;
  type_desc?: string;
  form_data?: FormData;
  file?: any;
}

//Ashif Develop user ts

export interface MembershipBooking {
  family: any;
  student_employed?:string;
  name_of_event?:string;
  position?:string;
  rows: any;
  cells: any;
  paid_amt_str?:string;
  pen_count?:string;
  paid_amount?:string;
  approval_count?:string;
  over_all_count?:string;
  sgst: any;
  advance_amount: any;
  days_count: number;
  membership_end_date: string;
  membership_start_date: string;
  cgst: any;
  tax_in_word: any;
  total_amount: any;
  total_amont: any;

  total_in_word: any;
  application_id: any;
  trnx_amt_str: any;
  trnx_dt_own: string | number | Date;
  receipt_amt_in_word: any;
  length: number;
  playfield: any;
  day_remain: any;
  storage_name?: string;
  pincode?: string;
  address?: string;
  user_id: number;
  id?: number;
  current_status: string;
  code?: string;
  no?: any;
  name?: string;
  type_of_applicant?: string;
  applied_on?: number;
  stadia_name?: string;
  
  district?: string;
  district_id?: number;
  cre_ts?: string;
  up_dt?: string;
  stadium_id?: string;
  type_of_applicant_id?: string;
  color: string;
  designation_name: string;
  status: string;
  remarks: string;
  district_name: string;
  duration_id: string;
  attachment?: Attachment;
  attachment_id?: number;
  phone_no?: string;
  mobile_no?: string;
  email?: string;
  level?: number;
  escalation_matrix_id?: number;
  app_flag?: string;
  tariff_amount?: string;
  total?: string;
  dob?: string;
  blood_group?: string;
  paid_amt?: number;
  pay_by_date?: string;
  is_terminated?: string;
  line_total?: string;
  tax_amount?: any;
  penalty?: string;
  total_str?: string;
  tax_amount_str?: string;
  tax_sub_amt?: string;
  trnx_ref_no?: string;

}


export interface SchemeApplication {
  sgst: any;
  advance_amount: string;
  days_count: number;
  membership_end_date: string;
  membership_start_date: string;
  cgst: any;
  tax_in_word: any;
  total_amount: any;
  total_amont: any;

  total_in_word: any;
  application_id: any;
  full_name: any;
  mother_name?:string;
  category_type?:string;
  father_name?:string;
  trnx_amt_str: any;
  trnx_dt_own: string | number | Date;
  receipt_amt_in_word: any;
  length: number;
  playfield: any;
  day_remain: any;
  storage_name?: string;
  pincode?: string;
  p_pincode?: string;
  address?: string;
  p_address?: string;
  user_id: number;
  id?: number;
  current_status: string;
  code?: string;
  no?: any;
  scheme_name?: string
  name?: string;
  discipline_name?: string;
  type_of_applicant?: string;
  applied_on?: any;
  stadia_name?: string;
  district?: string;
  district_id?: number;
  p_district_id?: number;
  cre_ts?: string;
  up_dt?: string;
  stadium_id?: string;
  type_of_applicant_id?: string;
  color: string;
  designation_name: string;
  status: string;
  remarks: string;
  district_name: string;
  duration_id: string;
  attachment?: Attachment;
  attachment_id?: number;
  phone_no?: string;
  mobile_no?: string;
  email?: string;
  level?: number;
  escalation_matrix_id?: number;
  app_flag?: string;
  tariff_amount?: string;
  total?: string;
  dob?: any;
  gender?: string;
  blood_group?: string;
  paid_amt?: string;
  pay_by_date?: string;
  is_terminated?: string;
  line_total?: string;
  tax_amount?: any;
  penalty?: string;
  total_str?: string;
  tax_amount_str?: string;
  tax_sub_amt?: string;
  trnx_ref_no?: string;

  discipline_id?: string;
  acc_holder?: string;
  bank_name?: any;
  ifsc?: any;
  branch_name?: any;
  bank_type?: any;
  acc_no?: any;
  pan_no?: any;

  cnt_eps?: any;
  cnt_eps_pen?: any;
  cnt_eps_app?: any;
  cnt_eps_rej?: any;
  cnt_mims?: any;
  cnt_mims_pen?: any;
  cnt_mims_app?: any;
  cnt_mims_rej?: any;
  cnt_cds?: any;
  cnt_cds_pen?: any;
  cnt_cds_app?: any;
  cnt_cds_rej?: any;
  cnt_sq?: any;
  cnt_sq_pen?: any;
  cnt_sq_app?: any;
  cnt_sq_rej?: any;
  cnt_total?: any;
  cnt_total_pen?: any;
  cnt_total_app?: any;
  cnt_total_rej?: any;
  cnt_hci?: any;
  cnt_hci_pen?: any;
  cnt_hci_app?: any;
  cnt_hci_rej?: any;
  dis_cnt?: any;
}



