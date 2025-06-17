import { WeChatConfig, ReservationRecord, MeetRecord } from './types.js';
export declare class WeChatAPI {
    private config;
    private accessToken?;
    private tokenExpiry?;
    private tokenRefreshing?;
    constructor(config: WeChatConfig);
    /**
     * 检查是否是Token相关错误
     */
    private isTokenError;
    /**
     * 获取Access Token - 支持并发安全和智能缓存
     */
    private getAccessToken;
    /**
     * 实际的Token刷新逻辑
     */
    private refreshAccessToken;
    /**
     * HTTP请求封装
     */
    private makeRequest;
    /**
     * 执行数据库查询 - 支持Token失效自动重试 (公开方法供测试使用)
     */
    dbQuery(query: string, retryCount?: number): Promise<any[]>;
    /**
     * 执行数据库更新 - 支持Token失效自动重试
     */
    private dbUpdate;
    /**
     * 执行数据库删除 - 支持Token失效自动重试
     */
    private dbDelete;
    /**
     * 查询预约记录
     */
    queryReservations(options: {
        userId?: string;
        status?: string;
        meetId?: string;
        mobile?: string;
        name?: string;
        limit?: number;
    }): Promise<ReservationRecord[]>;
    /**
     * 更新预约状态 - 支持Token失效自动重试
     */
    updateReservationStatus(recordId: string, newStatus: string, reason?: string, retryCount?: number): Promise<boolean>;
    /**
     * 删除预约记录 - 支持Token失效自动重试
     */
    deleteReservation(recordId: string, retryCount?: number): Promise<boolean>;
    /**
     * 从表单数据中提取字段值
     */
    private getFormFieldValue;
    /**
     * 查询所有预约记录
     */
    queryAllReservations(params: {
        limit?: number;
        status?: string;
    }): Promise<ReservationRecord[]>;
    /**
     * 根据手机号查询预约记录
     */
    queryReservationsByMobile(mobile: string): Promise<ReservationRecord[]>;
    /**
     * 根据姓名查询预约记录
     */
    queryReservationsByName(name: string): Promise<ReservationRecord[]>;
    /**
     * 根据手机号更新预约时间
     */
    updateReservationTimeByMobile(mobile: string, newDay: string, newTimeStart: string, newTimeEnd: string, newTimeMark: string): Promise<boolean>;
    /**
     * 根据姓名更新预约时间
     */
    updateReservationTimeByName(name: string, newDay: string, newTimeStart: string, newTimeEnd: string, newTimeMark: string): Promise<boolean>;
    /**
     * 更新预约时间的通用方法 - 支持Token失效自动重试
     */
    private updateReservationTime;
    /**
     * 根据手机号删除预约记录
     */
    deleteReservationByMobile(mobile: string): Promise<{
        deleted: number;
        ids: string[];
    }>;
    /**
     * 根据姓名删除预约记录
     */
    deleteReservationByName(name: string): Promise<{
        deleted: number;
        ids: string[];
    }>;
    /**
     * 获取可用的预约窗口列表
     */
    getAvailableMeets(): Promise<any[]>;
    /**
     * 获取指定预约窗口在指定日期的可用时间段
     */
    getAvailableTimeSlots(meetId: string, day: string): Promise<any[]>;
    /**
     * 验证预约窗口和时间段是否存在
     */
    private validateMeetAndTime;
    /**
     * 生成唯一的时间段标识
     */
    private generateTimeMark;
    /**
     * 生成唯一的表单字段标识
     */
    private generateFieldMark;
    /**
     * 创建预约窗口（完善版）
     */
    createMeetWindow(params: {
        title: string;
        seatCount: number;
        order?: number;
        content?: string;
        adminId?: string;
        meetDays: {
            day: string;
            times: {
                start: string;
                end: string;
                limit?: number;
                mark?: string;
            }[];
        }[];
        formFields?: {
            title: string;
            type: string;
            required: boolean;
            options?: string[];
        }[];
    }, retryCount?: number): Promise<{
        success: boolean;
        meetId?: string;
    }>;
    /**
     * 查询预约窗口
     */
    queryMeetWindows(params: {
        status?: string;
        limit?: number;
    }): Promise<MeetRecord[]>;
    /**
     * 更新预约窗口
     */
    updateMeetWindow(params: {
        meetId: string;
        title?: string;
        seatCount?: number;
        content?: string;
        status?: string;
    }, retryCount?: number): Promise<boolean>;
    /**
     * 删除预约窗口
     */
    deleteMeetWindow(meetId: string, retryCount?: number): Promise<boolean>;
}
//# sourceMappingURL=wechat-api.d.ts.map