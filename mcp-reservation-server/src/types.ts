import { z } from 'zod';

// 微信API配置
export interface WeChatConfig {
  appId: string;
  appSecret: string;
  envId: string;
}

// Access Token响应
export const AccessTokenResponse = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  errcode: z.number().optional(),
  errmsg: z.string().optional(),
});

export type AccessTokenResponse = z.infer<typeof AccessTokenResponse>;

// 预约状态枚举
export enum ReservationStatus {
  SUCCESS = 1,    // 预约成功
  CANCELLED = 10, // 已取消
  ADMIN_CANCELLED = 99, // 系统取消
}

// 表单字段接口
export interface FormField {
  title: string;
  mark: string;
  type: string;
  val: string;
}

// 预约记录接口
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
  JOIN_SEATS: string[];
  JOIN_CODE: string;
  JOIN_IS_CHECKIN?: number;
}

// 数据库查询响应（根据官方文档修正）
export const DatabaseQueryResponse = z.object({
  errcode: z.number(),
  errmsg: z.string(),
  pager: z.object({
    Offset: z.number(),
    Limit: z.number(),
    Total: z.number(),
  }).optional(),
  data: z.array(z.string()).optional(),
});

export type DatabaseQueryResponse = z.infer<typeof DatabaseQueryResponse>;

// 数据库更新响应（根据官方文档修正字段名）
export const DatabaseUpdateResponse = z.object({
  errcode: z.number(),
  errmsg: z.string(),
  matched: z.number().optional(),
  modified: z.number().optional(), // 修正：官方文档使用的是 modified 而不是 updated
  id: z.string().optional(),
});

export type DatabaseUpdateResponse = z.infer<typeof DatabaseUpdateResponse>;

// 数据库删除响应
export const DatabaseDeleteResponse = z.object({
  errcode: z.number(),
  errmsg: z.string(),
  deleted: z.number().optional(),
});

export type DatabaseDeleteResponse = z.infer<typeof DatabaseDeleteResponse>;

// 数据库添加响应（根据官方文档新增）
export const DatabaseAddResponse = z.object({
  errcode: z.number(),
  errmsg: z.string(),
  id_list: z.array(z.string()).optional(),
});

export type DatabaseAddResponse = z.infer<typeof DatabaseAddResponse>;

// 工具参数 schemas
export const QueryReservationsArgs = z.object({
  user_id: z.string().optional(),
  status: z.string().optional(),
  meet_id: z.string().optional(),
  mobile: z.string().optional(),
  name: z.string().optional(),
  limit: z.number().default(20).optional(),
});

export const QueryAllReservationsArgs = z.object({
  limit: z.number().default(50).optional(),
  status: z.string().optional(),
});

export const QueryByMobileArgs = z.object({
  mobile: z.string().min(11).max(11),
});

export const QueryByNameArgs = z.object({
  name: z.string().min(1),
});

export const UpdateReservationArgs = z.object({
  record_id: z.string(),
  new_status: z.string(),
  reason: z.string().optional(),
});

export const UpdateReservationTimeByMobileArgs = z.object({
  mobile: z.string().min(11).max(11),
  new_day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  new_time_start: z.string().regex(/^\d{2}:\d{2}$/),
  new_time_end: z.string().regex(/^\d{2}:\d{2}$/),
  new_time_mark: z.string(),
});

export const UpdateReservationTimeByNameArgs = z.object({
  name: z.string().min(1),
  new_day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  new_time_start: z.string().regex(/^\d{2}:\d{2}$/),
  new_time_end: z.string().regex(/^\d{2}:\d{2}$/),
  new_time_mark: z.string(),
});

export const DeleteReservationArgs = z.object({
  record_id: z.string(),
});

export const DeleteByMobileArgs = z.object({
  mobile: z.string().min(11).max(11),
});

export const DeleteByNameArgs = z.object({
  name: z.string().min(1),
});

export const CreateReservationArgs = z.object({
  name: z.string().min(1),
  mobile: z.string().min(11).max(11),
  seat_number: z.string().optional(),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time_start: z.string().regex(/^\d{2}:\d{2}$/),
  time_end: z.string().regex(/^\d{2}:\d{2}$/),
  time_mark: z.string(),
  meet_id: z.string(),
  meet_title: z.string(),
});

// 类型推断
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
export type CreateReservationArgs = z.infer<typeof CreateReservationArgs>;

// 状态文本映射
export function getStatusText(status: string | number): string {
  const statusNum = typeof status === 'string' ? parseInt(status) : status;
  switch (statusNum) {
    case ReservationStatus.SUCCESS:
      return '✅ 预约成功';
    case ReservationStatus.CANCELLED:
      return '❌ 已取消';
    case ReservationStatus.ADMIN_CANCELLED:
      return '⚠️ 系统取消';
    default:
      return '❓ 未知状态';
  }
} 