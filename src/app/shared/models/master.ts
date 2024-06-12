import * as moment from "moment";
import { ClientLicence } from "./clts";
import { Attachment } from "./doc";

export interface Discipline {
  id?: number;
  scheme_id?: number;
  name?: string;
  cre_ts?: string
  up_dt?: string
}

export interface Designation {
  code: string;
  name: string;
  ref_designation_code?: string;
  fields_required?: string[];
  cre_ts?: String;
  cre_by?: String;
  up_dt?: String;
  up_by?: String;
  remarks?: string;
  is_show_payment?: boolean;
  is_show_occupancy?: boolean;
  is_show_licence?: boolean;

  // Extended Properties
  // current_designation_code?: string;
  subordinates?: Designation[];
  is_active?: boolean;
  is_del?: boolean;
  designation_name?: string;
  designation_code?: string;
}

export interface District {
  id?: number;
  code?: string;
  name: string;
  is_having_shop?: string;
  // Extended Properties
  is_del?: boolean;
  district_code: string;
  district_name: string,
}

export interface Block {
  id?: number;
  code?: string;
  name?: string;
  is_active?: boolean;
  cre_ts?: string
  cre_by?: string;
  up_dt?: string
  up_by?: string;

  // Extended Properties
  block_name?: string;
  block_code?: string;
  is_del?: boolean;
}

export interface Menu {
  code: string;
  name: string;
  description?: string;
  ref_screen_code?: string;
  children?: Menu[];
  router_link?: string;
  related_router_links?: string[];
  order_num?: number;
  remarks?: string;
  icon_name?: string;

  is_active?: boolean;
}


export interface Bank {
  id?: number;
  code: string;
  name: string;

  // Extended Properties
  ac_name: string;
  ifsc: string;
  ac_no: string
}

export interface BankBranch {
  id?: number;
  bank_code: string;
  ifsc: string; // IFSC
  name: string;
  address?: string;
  is_active: boolean;
  remarks?: string;

  // Extended Properties
  bank_name?: string;
  is_del?: boolean;
}

export interface BankBranchByAPI {
  bank_code: string;
  bank: string;
  ifsc: string;
  branch: string;
  address: string;
  centre: string;
  city: string;
  district: string;
  state: string;
  contact: string;
  imps: string;
  neft: string;
  rtgs: string;
  upi: string;
  mirc: string;

  // Extended Properties
}

export interface Scheme {
  id?: number;
  code?: string;
  name?: string;
  description?: string;
  eff_sd?: moment.Moment | string,
  eff_ed?: moment.Moment | string,
  eligilibility?: string;
  is_active?: boolean;

  // Extended Properties
  scheme_name?: string,
  is_del?: boolean,
  scheme_code?: string,
  user_id?: number,
}
export interface Event {
  id?: number;
  name?: string;
  description?: string;
  is_active?: boolean;
  scheme_id?: number;
  cre_ts?: string
  up_dt?: string
}
export interface Position {
  id?: number;
  name?: string;
  description?: string;
  is_active?: boolean;
  cre_ts?: string;
  up_dt?: string;
}

export interface RateCard {
  id: number;
  code: string;
  name: string;
  cre_ts?: String;
  cre_by?: String;
  up_dt?: String;
  up_by?: String;
  is_active?: boolean;
  remarks?: string;

  // Extended Properties
  is_del?: boolean;
  is_rent?: boolean;
  rate_card_code: string;
  rate_card_name: string;
}

export interface Rent {
  id?: number;
  rate_card_id?: number;
  code?: string;
  name?: string;
  amount?: number;
  rent_calc_id?: number;
  is_monthly?: boolean;
  valid_from?: string
  valid_till?: string
  is_active?: boolean;
  cre_ts?: string
  cre_by?: string;
  up_dt?: string
  up_by?: string;

  // Extended Properties
  rent_code?: string;
  rent_name?: string;
  is_del?: boolean;
}

export interface RentCalc {
  id?: number;
  code?: string;
  name?: string;
  is_active?: boolean;
  cre_ts?: string
  cre_by?: string;
  up_dt?: string
  up_by?: string;

  // Extended Properties
  rent_calc_code?: string;
  rent_calc_name?: string;
  is_del?: boolean;
}

export interface Floor {
  id?: number;
  code?: string;
  name?: string;
  is_active?: boolean;
  cre_ts?: string
  cre_by?: string;
  up_dt?: string
  up_by?: string;

  // Extended Properties
  floor_code?: string;
  floor_name?: string;
  is_del?: boolean;
}

export interface Shop {
  id?: number;
  code?: string;
  name?: string;
  area?: number;
  floor_id?: number;
  shop_complex_id?: number;
  rate_card_id?: number;
  block_id?: number;
  district_id?: any;
  service_no?: string;
  address?: string;
  description?: string;
  is_active?: boolean;
  cre_ts?: string
  cre_by?: string;
  up_dt?: string
  up_by?: string;
  shop_ref_no?:string;

  // Extended Properties
  shop_code?: string;
  shop_name?: string;
  rate_card_name?: string;
  floor_name?: string;
  shop_complex_name?: string;
  block_name?: string;
  is_del?: boolean;
  shop_id?: number;
  attachment_id?: number;
  attachment?: Attachment;
  is_occupied?: boolean;
  storage_name?: string;
  file_name?: string;
  file_type?: string;
}

export interface ShopComplex {
  id?: number;
  district_id?: number;
  code?: string;
  name?: string;
  cre_ts?: string
  cre_by?: string;
  up_dt?: string
  up_by?: string;
  remarks?: string;

  // Extended Properties
  shop_complex_code?: string;
  shop_complex_name?: string;
  is_del?: boolean;
}

export interface Client {
  id?: any;
  code?: string;
  name?: string;
  address?: string;
  email?: string;
  mobile_no?: string;
  gst?: string;
  cin?: string;
  pan?: string;
  tan?: string;
  client_type_id?: number;
  client_category_id?: number;
  attachment_id?: number;
  tax_slab_id?: number;
  state_id?: number;
  address_2?: string;
  pincode?: string;
  location?: string;
  logo?: string;
  sign?: string;
  is_active?: string;
  cre_ts?: string
  cre_by?: string;
  up_dt?: string
  up_by?: string;

  // Extended Properties
  is_del?: boolean;
  client_type_name?: string;
  shop_id?: number;
  client_category_name?: string;
  attachment?: Attachment;
  storage_name?: string;
  shops?: ClientLicence[];
}

export interface ClientType {
  id?: number;
  code?: string;
  name?: string;
  is_active?: boolean;
  cre_ts?: string
  cre_by?: string;
  up_dt?: string
  up_by?: string;
}

export interface ClientCategory {
  id?: number;
  code?: string;
  name?: string;
  is_active?: boolean;
  cre_ts?: string
  cre_by?: string;
  up_dt?: string
  up_by?: string;
}

export interface TaxSlab {
  id?: number;
  tax_name?: string;
  hsn_code?: string;
  display_text?: string;
  tax_percent?: number;
  is_active?: boolean;
  cre_ts?: string
  cre_by?: string;
  up_dt?: string
  up_by?: string;
}

export interface State {
  id?: number;
  code?: string;
  tin?: string;
  name?: string;
  is_active?: boolean;
  cre_ts?: string
  cre_by?: string;
  up_dt?: string
  up_by?: string;
}

export interface Screen {
  code?: string;
  is_active?: boolean;
  name?: string;
  description?: string;
  ref_screen_code?: string;
  children?: Screen[];
  router_link?: string;
  related_router_links?: string;
  icon_name?: string;
  order_num?: number;
  remarks?: string;
  completed?: boolean;
  allComplete?: boolean
}

export interface Module {
  code?: string;
  name?: string;
}


// stadium booking 

//  Playfield_name
export interface Playfield_name {
  id?: number;
  code?: string;
  name: string;
  // Extended Properties
  is_del?: boolean;
  district_code: string;
}
// Playfield_type 
export interface Playfield_type {
  id?: number;
  code?: string;
  name: string;
  // Extended Properties
  is_del?: boolean;
  district_code: string;
}
// Stadiumdetails 
export interface Stadiumdetails {
  id?: number;
  dis_code?: number;
  code?: string;
  name: string;
  stadia_name: string;
  dia_code: string;
  // Extended Properties
  is_del?: boolean;
  district_code: string;
}

export interface BookingCategory {
  id?: number;
  dis_code?: number;

  code?: string;
  name: string;
  is_having_shop?: string;
  // Extended Properties
  is_del?: boolean;
  district_code: string;
  district_name: string,
}

export interface TarrifOthersDetails {
  id?: number;
  code?: string;
  name: string;
  traiff: string;
  details: string;
  traiff_details: string;
  is_having_shop?: string;
  // Extended Properties
  is_del?: boolean;
  district_code: string;
  district_name: string;
  days?: string;
  facilities_name?: string;
}
export interface TariffDetails {
  id?: number;
  code?: string;
  name?: string;
  stadium_id?: string;
  facilitie_id?: number;
  application_id?: string;
  stadium_name?: string;
  facilities_name?: string;
  facilities_amount?: number;
  facilities_id?: number;
  facilities_description?: string;
  floor_id?: number;
  shop_complex_id?: number;
  rate_card_id?: number;
  block_id?: number;
  district_id?: string;
  district_name?: string;
  facilite_name?: string;
  user_id?:number;
  days?: string;
  type_of_applicant_id?: number;
  type_of_applicant_name?: string;
  stadia_id?: any;
  user_type_id?: string;
  type_of_category_id?: number;
  category_sub_type_id?: number;
  duration_id?: string;
  type_of_category?: string;
  category_sub_type_name?: string;
  description?: string;
  playfield?: number;
  playfield_name?: string;
  user_type_name?: string;
  duration_name?: string;
  is_active?: boolean;
  cre_ts?: string
  cre_by?: string;
  up_dt?: string
  up_by?: string;
  total_str?: number;

  // Extended Properties
  tariff_amount?: number;
  shop_name?: string;
  rate_card_name?: string;
  amount?: string;
  shop_complex_name?: string;
  block_name?: string;
  is_del?: boolean;
  shop_id?: number;
  attachment_id?: number;
  attachment?: Attachment;
  is_occupied?: boolean;
  storage_name?: string;
  file_name?: string;
  file_type?: string;
}
export interface UserType {
  // playfield: any;
  id: number;
  code?: string;
  name: string;
  dis_code: string;
  // Extended Properties
  is_del?: boolean;
  district_code: string;
  district_name: string,
}
export interface Duration {
  stadia_name: any;
  id: number;
  code?: string;
  name: string;
  dis_code: string;
  // code:string;
  // Extended Properties
  is_del?: boolean;
  district_code: string;
  district_name: string,
}

//Membership Booking

export interface Playfield {
  playfield: any;
  id: number;
  code?: string;
  name: string;
  dis_code: string;
  // Extended Properties
  is_del?: boolean;
  district_code: string;
  district_name: string,
}

export interface UserType {
  // playfield: any;
  id: number;
  code?: string;
  name: string;
  dis_code: string;
  // Extended Properties
  is_del?: boolean;
  district_code: string;
  district_name: string,
}

export interface Duration {
  stadia_name: any;
  id: number;
  code?: string;
  name: string;
  dis_code: string;
  // code:string;
  // Extended Properties
  is_del?: boolean;
  district_code: string;
  district_name: string,
}


//Membership Booking master ts

export interface Playfield {
  playfield: any;
  id: number;
  code?: string;
  name: string;
  dis_code: string;
  // Extended Properties
  is_del?: boolean;
  district_code: string;
  district_name: string,
}

export interface UserType {
  // playfield: any;
  id: number;
  code?: string;
  name: string;
  dis_code: string;
  // Extended Properties
  is_del?: boolean;
  district_code: string;
  district_name: string,
}

export interface Duration {
  stadia_name: any;
  id: number;
  code?: string;
  name: string;
  dis_code: string;
  // code:string;
  // Extended Properties
  is_del?: boolean;
  district_code: string;
  district_name: string,
}