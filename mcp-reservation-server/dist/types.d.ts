import { z } from 'zod';
export interface WeChatConfig {
    appId: string;
    appSecret: string;
    envId: string;
}
export declare const AccessTokenResponse: z.ZodObject<{
    access_token: z.ZodString;
    expires_in: z.ZodNumber;
    errcode: z.ZodOptional<z.ZodNumber>;
    errmsg: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    access_token: string;
    expires_in: number;
    errcode?: number | undefined;
    errmsg?: string | undefined;
}, {
    access_token: string;
    expires_in: number;
    errcode?: number | undefined;
    errmsg?: string | undefined;
}>;
export type AccessTokenResponse = z.infer<typeof AccessTokenResponse>;
export declare enum ReservationStatus {
    SUCCESS = 1,// 预约成功
    CANCELLED = 10,// 已取消
    ADMIN_CANCELLED = 99
}
export declare enum MeetStatus {
    DISABLED = 0,// 未启用
    ACTIVE = 1,// 使用中
    STOPPED = 9,// 停止预约(可见)
    CLOSED = 10
}
export interface FormField {
    title: string;
    mark: string;
    type: string;
    val: string;
}
export interface ReservationRecord {
    _id: string;
    JOIN_ID: string;
    JOIN_USER_ID: string;
    JOIN_MEET_ID: string;
    JOIN_MEET_TITLE: string;
    JOIN_MEET_DAY: string;
    JOIN_MEET_TIME_START: string;
    JOIN_MEET_TIME_END: string;
    JOIN_MEET_TIME_MARK: string;
    JOIN_STATUS: number;
    JOIN_REASON?: string;
    JOIN_ADD_TIME: number;
    JOIN_EDIT_TIME: number;
    JOIN_FORMS: FormField[];
    JOIN_SEATS: number[];
    JOIN_CODE: string;
    JOIN_IS_CHECKIN?: number;
}
export interface TimeSlot {
    mark: string;
    start: string;
    end: string;
    limit?: number;
    status: number;
}
export interface MeetDay {
    day: string;
    times: TimeSlot[];
}
export interface FormFieldSetting {
    title: string;
    mark: string;
    type: string;
    required: boolean;
    options?: string[];
}
export interface MeetRecord {
    _id: string;
    _pid: string;
    MEET_ID: string;
    MEET_ADMIN_ID: string;
    MEET_TITLE: string;
    MEET_CONTENT: any[];
    MEET_DAYS: MeetDay[];
    MEET_SEAT_COUNT: number;
    MEET_FORM_SET: FormFieldSetting[];
    MEET_STATUS: number;
    MEET_ORDER: number;
    MEET_ADD_TIME: number;
    MEET_EDIT_TIME: number;
    MEET_ADD_IP?: string;
    MEET_EDIT_IP?: string;
}
export declare const DatabaseQueryResponse: z.ZodObject<{
    errcode: z.ZodNumber;
    errmsg: z.ZodString;
    pager: z.ZodOptional<z.ZodObject<{
        Offset: z.ZodNumber;
        Limit: z.ZodNumber;
        Total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        Offset: number;
        Limit: number;
        Total: number;
    }, {
        Offset: number;
        Limit: number;
        Total: number;
    }>>;
    data: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    errcode: number;
    errmsg: string;
    pager?: {
        Offset: number;
        Limit: number;
        Total: number;
    } | undefined;
    data?: string[] | undefined;
}, {
    errcode: number;
    errmsg: string;
    pager?: {
        Offset: number;
        Limit: number;
        Total: number;
    } | undefined;
    data?: string[] | undefined;
}>;
export type DatabaseQueryResponse = z.infer<typeof DatabaseQueryResponse>;
export declare const DatabaseUpdateResponse: z.ZodObject<{
    errcode: z.ZodNumber;
    errmsg: z.ZodString;
    matched: z.ZodOptional<z.ZodNumber>;
    modified: z.ZodOptional<z.ZodNumber>;
    id: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    errcode: number;
    errmsg: string;
    matched?: number | undefined;
    modified?: number | undefined;
    id?: string | undefined;
}, {
    errcode: number;
    errmsg: string;
    matched?: number | undefined;
    modified?: number | undefined;
    id?: string | undefined;
}>;
export type DatabaseUpdateResponse = z.infer<typeof DatabaseUpdateResponse>;
export declare const DatabaseDeleteResponse: z.ZodObject<{
    errcode: z.ZodNumber;
    errmsg: z.ZodString;
    deleted: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    errcode: number;
    errmsg: string;
    deleted?: number | undefined;
}, {
    errcode: number;
    errmsg: string;
    deleted?: number | undefined;
}>;
export type DatabaseDeleteResponse = z.infer<typeof DatabaseDeleteResponse>;
export declare const DatabaseAddResponse: z.ZodObject<{
    errcode: z.ZodNumber;
    errmsg: z.ZodString;
    id_list: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    errcode: number;
    errmsg: string;
    id_list?: string[] | undefined;
}, {
    errcode: number;
    errmsg: string;
    id_list?: string[] | undefined;
}>;
export type DatabaseAddResponse = z.infer<typeof DatabaseAddResponse>;
export declare const QueryReservationsArgs: z.ZodObject<{
    user_id: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    meet_id: z.ZodOptional<z.ZodString>;
    mobile: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    status?: string | undefined;
    user_id?: string | undefined;
    meet_id?: string | undefined;
    mobile?: string | undefined;
    name?: string | undefined;
    limit?: number | undefined;
}, {
    status?: string | undefined;
    user_id?: string | undefined;
    meet_id?: string | undefined;
    mobile?: string | undefined;
    name?: string | undefined;
    limit?: number | undefined;
}>;
export declare const QueryAllReservationsArgs: z.ZodObject<{
    limit: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: string | undefined;
    limit?: number | undefined;
}, {
    status?: string | undefined;
    limit?: number | undefined;
}>;
export declare const QueryByMobileArgs: z.ZodObject<{
    mobile: z.ZodString;
}, "strip", z.ZodTypeAny, {
    mobile: string;
}, {
    mobile: string;
}>;
export declare const QueryByNameArgs: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export declare const UpdateReservationArgs: z.ZodObject<{
    record_id: z.ZodString;
    new_status: z.ZodString;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    record_id: string;
    new_status: string;
    reason?: string | undefined;
}, {
    record_id: string;
    new_status: string;
    reason?: string | undefined;
}>;
export declare const UpdateReservationTimeByMobileArgs: z.ZodObject<{
    mobile: z.ZodString;
    new_day: z.ZodString;
    new_time_start: z.ZodString;
    new_time_end: z.ZodString;
    new_time_mark: z.ZodString;
}, "strip", z.ZodTypeAny, {
    mobile: string;
    new_day: string;
    new_time_start: string;
    new_time_end: string;
    new_time_mark: string;
}, {
    mobile: string;
    new_day: string;
    new_time_start: string;
    new_time_end: string;
    new_time_mark: string;
}>;
export declare const UpdateReservationTimeByNameArgs: z.ZodObject<{
    name: z.ZodString;
    new_day: z.ZodString;
    new_time_start: z.ZodString;
    new_time_end: z.ZodString;
    new_time_mark: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    new_day: string;
    new_time_start: string;
    new_time_end: string;
    new_time_mark: string;
}, {
    name: string;
    new_day: string;
    new_time_start: string;
    new_time_end: string;
    new_time_mark: string;
}>;
export declare const DeleteReservationArgs: z.ZodObject<{
    record_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    record_id: string;
}, {
    record_id: string;
}>;
export declare const DeleteByMobileArgs: z.ZodObject<{
    mobile: z.ZodString;
}, "strip", z.ZodTypeAny, {
    mobile: string;
}, {
    mobile: string;
}>;
export declare const DeleteByNameArgs: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export declare const CreateMeetWindowArgs: z.ZodObject<{
    title: z.ZodString;
    seat_count: z.ZodNumber;
    order: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    content: z.ZodOptional<z.ZodString>;
    admin_id: z.ZodOptional<z.ZodString>;
    meet_days: z.ZodArray<z.ZodObject<{
        day: z.ZodString;
        times: z.ZodArray<z.ZodObject<{
            start: z.ZodString;
            end: z.ZodString;
            limit: z.ZodOptional<z.ZodNumber>;
            mark: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            start: string;
            end: string;
            limit?: number | undefined;
            mark?: string | undefined;
        }, {
            start: string;
            end: string;
            limit?: number | undefined;
            mark?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        day: string;
        times: {
            start: string;
            end: string;
            limit?: number | undefined;
            mark?: string | undefined;
        }[];
    }, {
        day: string;
        times: {
            start: string;
            end: string;
            limit?: number | undefined;
            mark?: string | undefined;
        }[];
    }>, "many">;
    form_fields: z.ZodOptional<z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        type: z.ZodEnum<["line", "mobile", "select", "textarea"]>;
        required: z.ZodDefault<z.ZodBoolean>;
        options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        type: "mobile" | "line" | "select" | "textarea";
        title: string;
        required: boolean;
        options?: string[] | undefined;
    }, {
        type: "mobile" | "line" | "select" | "textarea";
        title: string;
        options?: string[] | undefined;
        required?: boolean | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    seat_count: number;
    meet_days: {
        day: string;
        times: {
            start: string;
            end: string;
            limit?: number | undefined;
            mark?: string | undefined;
        }[];
    }[];
    order?: number | undefined;
    content?: string | undefined;
    admin_id?: string | undefined;
    form_fields?: {
        type: "mobile" | "line" | "select" | "textarea";
        title: string;
        required: boolean;
        options?: string[] | undefined;
    }[] | undefined;
}, {
    title: string;
    seat_count: number;
    meet_days: {
        day: string;
        times: {
            start: string;
            end: string;
            limit?: number | undefined;
            mark?: string | undefined;
        }[];
    }[];
    order?: number | undefined;
    content?: string | undefined;
    admin_id?: string | undefined;
    form_fields?: {
        type: "mobile" | "line" | "select" | "textarea";
        title: string;
        options?: string[] | undefined;
        required?: boolean | undefined;
    }[] | undefined;
}>;
export declare const UpdateMeetWindowArgs: z.ZodObject<{
    meet_id: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    seat_count: z.ZodOptional<z.ZodNumber>;
    content: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    meet_id: string;
    status?: string | undefined;
    title?: string | undefined;
    seat_count?: number | undefined;
    content?: string | undefined;
}, {
    meet_id: string;
    status?: string | undefined;
    title?: string | undefined;
    seat_count?: number | undefined;
    content?: string | undefined;
}>;
export declare const DeleteMeetWindowArgs: z.ZodObject<{
    meet_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    meet_id: string;
}, {
    meet_id: string;
}>;
export declare const QueryMeetWindowsArgs: z.ZodObject<{
    status: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    status?: string | undefined;
    limit?: number | undefined;
}, {
    status?: string | undefined;
    limit?: number | undefined;
}>;
export type QueryReservationsArgs = z.infer<typeof QueryReservationsArgs>;
export type QueryAllReservationsArgs = z.infer<typeof QueryAllReservationsArgs>;
export type QueryByMobileArgs = z.infer<typeof QueryByMobileArgs>;
export type QueryByNameArgs = z.infer<typeof QueryByNameArgs>;
export type UpdateReservationArgs = z.infer<typeof UpdateReservationArgs>;
export type UpdateReservationTimeByMobileArgs = z.infer<typeof UpdateReservationTimeByMobileArgs>;
export type UpdateReservationTimeByNameArgs = z.infer<typeof UpdateReservationTimeByNameArgs>;
export type DeleteReservationArgs = z.infer<typeof DeleteReservationArgs>;
export type DeleteByMobileArgs = z.infer<typeof DeleteByMobileArgs>;
export type DeleteByNameArgs = z.infer<typeof DeleteByNameArgs>;
export type CreateMeetWindowArgs = z.infer<typeof CreateMeetWindowArgs>;
export type UpdateMeetWindowArgs = z.infer<typeof UpdateMeetWindowArgs>;
export type DeleteMeetWindowArgs = z.infer<typeof DeleteMeetWindowArgs>;
export type QueryMeetWindowsArgs = z.infer<typeof QueryMeetWindowsArgs>;
export declare function getStatusText(status: string | number): string;
export declare function getMeetStatusText(status: string | number): string;
export declare function formatSeatNumbers(seats: number[]): string;
export declare function parseSeatNumbers(seatInput: string): number[];
//# sourceMappingURL=types.d.ts.map