import { z } from 'zod';
// Access Token响应
export const AccessTokenResponse = z.object({
    access_token: z.string(),
    expires_in: z.number(),
    errcode: z.number().optional(),
    errmsg: z.string().optional(),
});
// 预约状态枚举
export var ReservationStatus;
(function (ReservationStatus) {
    ReservationStatus[ReservationStatus["SUCCESS"] = 1] = "SUCCESS";
    ReservationStatus[ReservationStatus["CANCELLED"] = 10] = "CANCELLED";
    ReservationStatus[ReservationStatus["ADMIN_CANCELLED"] = 99] = "ADMIN_CANCELLED";
})(ReservationStatus || (ReservationStatus = {}));
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
// 数据库更新响应（根据官方文档修正字段名）
export const DatabaseUpdateResponse = z.object({
    errcode: z.number(),
    errmsg: z.string(),
    matched: z.number().optional(),
    modified: z.number().optional(), // 修正：官方文档使用的是 modified 而不是 updated
    id: z.string().optional(),
});
// 数据库删除响应
export const DatabaseDeleteResponse = z.object({
    errcode: z.number(),
    errmsg: z.string(),
    deleted: z.number().optional(),
});
// 数据库添加响应（根据官方文档新增）
export const DatabaseAddResponse = z.object({
    errcode: z.number(),
    errmsg: z.string(),
    id_list: z.array(z.string()).optional(),
});
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
// 状态文本映射
export function getStatusText(status) {
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
//# sourceMappingURL=types.js.map