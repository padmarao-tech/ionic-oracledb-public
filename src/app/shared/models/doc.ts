import * as moment from "moment";

export type DocMode = 'Edit'|'View'|'Verf';
export interface Type {
    code?: string,
    name?: string,
    description?: string,
    applicable_to?: string[],
    scheme_codes?: string[],
    is_mandatory?: boolean,
    remarks?: string,

    // Extended Properties
    is_del?: boolean,
    type_name?: string,
    type_description?: string,
    user_id?: number,
    type_code?: string,
    req_det?: string,
    file_name?: string
}

export interface Attachment {
    id?: number;
    user_id?: number;
    stadia_id?:number;
    application_id?: any;
    client_id?: number;
    type_code?: string;
    file_name?: string;
    file_type?: string;
    file_size?: number;
    storage_name?: string;
    remarks?: string;

    // Extended Properties
    type_name?: string;
    type_desc?: string;
    form_data?: FormData;
    file?: any;
}
