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
// 预约窗口状态枚举
export var MeetStatus;
(function (MeetStatus) {
    MeetStatus[MeetStatus["DISABLED"] = 0] = "DISABLED";
    MeetStatus[MeetStatus["ACTIVE"] = 1] = "ACTIVE";
    MeetStatus[MeetStatus["STOPPED"] = 9] = "STOPPED";
    MeetStatus[MeetStatus["CLOSED"] = 10] = "CLOSED";
})(MeetStatus || (MeetStatus = {}));
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
// 创建预约窗口参数（完善版）
export const CreateMeetWindowArgs = z.object({
    title: z.string().min(1, "预约窗口标题不能为空"),
    seat_count: z.number().min(1, "座位数必须大于0"),
    order: z.number().default(9999).optional(),
    content: z.string().optional(),
    admin_id: z.string().optional(),
    // 预约时间段设置
    meet_days: z.array(z.object({
        day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须为YYYY-MM-DD"),
        times: z.array(z.object({
            start: z.string().regex(/^\d{2}:\d{2}$/, "开始时间格式必须为HH:MM"),
            end: z.string().regex(/^\d{2}:\d{2}$/, "结束时间格式必须为HH:MM"),
            limit: z.number().min(1).optional(),
            mark: z.string().optional(), // 可选，如果不提供会自动生成
        }))
    })).min(1, "至少需要设置一个预约日期"),
    // 用户填写资料设置（可选，默认为姓名和手机）
    form_fields: z.array(z.object({
        title: z.string().min(1),
        type: z.enum(["line", "mobile", "select", "textarea"]),
        required: z.boolean().default(true),
        options: z.array(z.string()).optional(), // 适用于select类型
    })).optional(),
});
// 更新预约窗口参数
export const UpdateMeetWindowArgs = z.object({
    meet_id: z.string(),
    title: z.string().optional(),
    seat_count: z.number().min(1).optional(),
    content: z.string().optional(),
    status: z.string().optional(),
});
// 删除预约窗口参数
export const DeleteMeetWindowArgs = z.object({
    meet_id: z.string(),
});
// 查询预约窗口参数
export const QueryMeetWindowsArgs = z.object({
    status: z.string().optional(),
    limit: z.number().default(20).optional(),
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
// 预约窗口状态文本映射
export function getMeetStatusText(status) {
    const statusNum = typeof status === 'string' ? parseInt(status) : status;
    switch (statusNum) {
        case MeetStatus.DISABLED:
            return '⏸️ 未启用';
        case MeetStatus.ACTIVE:
            return '✅ 使用中';
        case MeetStatus.STOPPED:
            return '⏹️ 停止预约';
        case MeetStatus.CLOSED:
            return '🔒 已关闭';
        default:
            return '❓ 未知状态';
    }
}
// 座位号显示函数：数据库中0代表座位1
export function formatSeatNumbers(seats) {
    return seats.map(seat => seat + 1).join(', ');
}
// 座位号转换函数：UI座位号转数据库座位号
export function parseSeatNumbers(seatInput) {
    return seatInput.split(',')
        .map(s => s.trim())
        .filter(s => s)
        .map(s => parseInt(s) - 1)
        .filter(s => s >= 0);
}
//# sourceMappingURL=types.js.map