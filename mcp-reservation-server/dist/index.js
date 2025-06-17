#!/usr/bin/env node
// 首先加载环境变量
import dotenv from 'dotenv';
dotenv.config();
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { WeChatAPI } from './wechat-api.js';
import { QueryReservationsArgs, QueryAllReservationsArgs, QueryByMobileArgs, QueryByNameArgs, UpdateReservationArgs, UpdateReservationTimeByMobileArgs, UpdateReservationTimeByNameArgs, DeleteReservationArgs, DeleteByMobileArgs, DeleteByNameArgs, CreateMeetWindowArgs, UpdateMeetWindowArgs, DeleteMeetWindowArgs, QueryMeetWindowsArgs, getStatusText, getMeetStatusText, formatSeatNumbers, } from './types.js';
// 服务器配置
const SERVER_NAME = 'mcp-reservation-server';
const SERVER_VERSION = '1.0.0';
// 微信配置（从环境变量读取）
const WECHAT_CONFIG = {
    appId: process.env.WECHAT_APP_ID || 'wxf76ea9bf5982dd05',
    appSecret: process.env.WECHAT_APP_SECRET || '4af9e95c1d4394f0b48d33b9e90d22a8',
    envId: process.env.WECHAT_ENV_ID || 'cloud1-3ggfodggf223466a',
};
// 创建微信API实例
const wechatAPI = new WeChatAPI(WECHAT_CONFIG);
// 创建MCP服务器
const server = new Server({
    name: SERVER_NAME,
    version: SERVER_VERSION,
}, {
    capabilities: {
        tools: {},
    },
});
// 格式化预约记录显示（更新座位号显示逻辑）
function formatReservationRecord(record, index) {
    const statusText = getStatusText(record.JOIN_STATUS);
    // 微信API返回的时间戳已经是毫秒格式，不需要乘以1000
    const addTime = new Date(record.JOIN_ADD_TIME).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    // 提取姓名和手机号 - 更智能的解析
    let name = '未知';
    let mobile = '未知';
    if (record.JOIN_FORMS) {
        for (const form of record.JOIN_FORMS) {
            // 根据实际日志数据，手机字段的title是"手机"，type是"line"
            if (form.title === '姓名' || form.mark?.includes('name') || form.mark === 'VPFCGOHJFV') {
                name = form.val;
            }
            if (form.title === '手机' || form.title === '手机号' || form.mark?.includes('mobile') || form.mark === 'XAWSQRZWGK') {
                mobile = form.val;
            }
        }
    }
    let result = '';
    if (index !== undefined) {
        result += `${index + 1}. `;
    }
    result += `${record.JOIN_MEET_TITLE}\n`;
    result += `   🆔 预约ID: ${record.JOIN_ID}\n`;
    result += `   🔑 数据库ID: ${record._id}\n`;
    result += `   👤 姓名: ${name}\n`;
    result += `   📱 手机号: ${mobile}\n`;
    result += `   📅 预约日期: ${record.JOIN_MEET_DAY}\n`;
    result += `   ⏰ 时间: ${record.JOIN_MEET_TIME_START} - ${record.JOIN_MEET_TIME_END}\n`;
    result += `   📊 状态: ${statusText}\n`;
    result += `   📝 创建时间: ${addTime}\n`;
    // 使用新的座位号格式化函数：数据库中0代表座位1
    if (record.JOIN_SEATS && record.JOIN_SEATS.length > 0) {
        result += `   🪑 座位: ${formatSeatNumbers(record.JOIN_SEATS)}\n`;
    }
    if (record.JOIN_REASON) {
        result += `   💬 备注: ${record.JOIN_REASON}\n`;
    }
    return result;
}
// 格式化预约窗口显示
function formatMeetWindowRecord(record, index) {
    const statusText = getMeetStatusText(record.MEET_STATUS);
    const addTime = new Date(record.MEET_ADD_TIME).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    let result = '';
    if (index !== undefined) {
        result += `${index + 1}. `;
    }
    result += `${record.MEET_TITLE}\n`;
    result += `   🆔 窗口ID: ${record.MEET_ID}\n`;
    result += `   🔑 数据库ID: ${record._id}\n`;
    result += `   👤 管理员ID: ${record.MEET_ADMIN_ID}\n`;
    result += `   🪑 座位数: ${record.MEET_SEAT_COUNT}\n`;
    result += `   📊 状态: ${statusText}\n`;
    result += `   📅 可用日期: ${record.MEET_DAYS?.length || 0} 天\n`;
    result += `   📝 创建时间: ${addTime}\n`;
    if (record.MEET_CONTENT && record.MEET_CONTENT.length > 0) {
        const content = record.MEET_CONTENT.map((c) => c.content || c.text).join(', ');
        result += `   📄 描述: ${content}\n`;
    }
    return result;
}
// 注册工具列表处理器
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'query_all_reservations',
                description: '查询所有预约记录',
                inputSchema: {
                    type: 'object',
                    properties: {
                        limit: {
                            type: 'number',
                            description: '返回记录数限制（默认50）',
                            default: 50,
                            minimum: 1,
                            maximum: 100,
                        },
                        status: {
                            type: 'string',
                            description: '预约状态：1=成功，10=已取消，99=系统取消（可选）',
                            enum: ["1", "10", "99"],
                        },
                    },
                },
            },
            {
                name: 'query_reservations_by_mobile',
                description: '根据手机号查询预约记录',
                inputSchema: {
                    type: 'object',
                    properties: {
                        mobile: {
                            type: 'string',
                            description: '手机号（11位数字）',
                            pattern: '^[0-9]{11}$',
                        },
                    },
                    required: ['mobile'],
                },
            },
            {
                name: 'query_reservations_by_name',
                description: '根据预约人姓名查询预约记录',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: '预约人姓名',
                            minLength: 1,
                        },
                    },
                    required: ['name'],
                },
            },
            {
                name: 'update_reservation_time_by_mobile',
                description: '根据手机号更改预约时间',
                inputSchema: {
                    type: 'object',
                    properties: {
                        mobile: {
                            type: 'string',
                            description: '手机号（11位数字）',
                            pattern: '^[0-9]{11}$',
                        },
                        new_day: {
                            type: 'string',
                            description: '新的预约日期（YYYY-MM-DD格式）',
                            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
                        },
                        new_time_start: {
                            type: 'string',
                            description: '新的开始时间（HH:MM格式）',
                            pattern: '^\\d{2}:\\d{2}$',
                        },
                        new_time_end: {
                            type: 'string',
                            description: '新的结束时间（HH:MM格式）',
                            pattern: '^\\d{2}:\\d{2}$',
                        },
                        new_time_mark: {
                            type: 'string',
                            description: '新的时间段标识',
                        },
                    },
                    required: ['mobile', 'new_day', 'new_time_start', 'new_time_end', 'new_time_mark'],
                },
            },
            {
                name: 'update_reservation_time_by_name',
                description: '根据预约人姓名修改预约时间',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: '预约人姓名',
                            minLength: 1,
                        },
                        new_day: {
                            type: 'string',
                            description: '新的预约日期（YYYY-MM-DD格式）',
                            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
                        },
                        new_time_start: {
                            type: 'string',
                            description: '新的开始时间（HH:MM格式）',
                            pattern: '^\\d{2}:\\d{2}$',
                        },
                        new_time_end: {
                            type: 'string',
                            description: '新的结束时间（HH:MM格式）',
                            pattern: '^\\d{2}:\\d{2}$',
                        },
                        new_time_mark: {
                            type: 'string',
                            description: '新的时间段标识',
                        },
                    },
                    required: ['name', 'new_day', 'new_time_start', 'new_time_end', 'new_time_mark'],
                },
            },
            {
                name: 'delete_reservation_by_mobile',
                description: '根据手机号删除预约记录',
                inputSchema: {
                    type: 'object',
                    properties: {
                        mobile: {
                            type: 'string',
                            description: '手机号（11位数字）',
                            pattern: '^[0-9]{11}$',
                        },
                    },
                    required: ['mobile'],
                },
            },
            {
                name: 'delete_reservation_by_name',
                description: '根据预约人姓名删除预约记录',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: '预约人姓名',
                            minLength: 1,
                        },
                    },
                    required: ['name'],
                },
            },
            {
                name: 'create_meet_window',
                description: '创建新的预约窗口，包含时间段设置和用户填写资料设置',
                inputSchema: {
                    type: 'object',
                    properties: {
                        title: {
                            type: 'string',
                            description: '预约窗口标题',
                            minLength: 1,
                        },
                        seat_count: {
                            type: 'number',
                            description: '座位数量',
                            minimum: 1,
                        },
                        order: {
                            type: 'number',
                            description: '排序号（默认9999）',
                            default: 9999,
                        },
                        content: {
                            type: 'string',
                            description: '预约窗口描述（可选）',
                        },
                        admin_id: {
                            type: 'string',
                            description: '管理员ID（可选）',
                        },
                        meet_days: {
                            type: 'array',
                            description: '预约日期和时间段设置',
                            items: {
                                type: 'object',
                                properties: {
                                    day: {
                                        type: 'string',
                                        description: '预约日期（YYYY-MM-DD格式）',
                                        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
                                    },
                                    times: {
                                        type: 'array',
                                        description: '该日期的时间段',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                start: {
                                                    type: 'string',
                                                    description: '开始时间（HH:MM格式）',
                                                    pattern: '^\\d{2}:\\d{2}$',
                                                },
                                                end: {
                                                    type: 'string',
                                                    description: '结束时间（HH:MM格式）',
                                                    pattern: '^\\d{2}:\\d{2}$',
                                                },
                                                limit: {
                                                    type: 'number',
                                                    description: '该时间段人数限制（可选，默认等于座位数）',
                                                    minimum: 1,
                                                },
                                            },
                                            required: ['start', 'end'],
                                        },
                                        minItems: 1,
                                    },
                                },
                                required: ['day', 'times'],
                            },
                            minItems: 1,
                        },
                        form_fields: {
                            type: 'array',
                            description: '用户填写资料设置（可选，默认为姓名和手机）',
                            items: {
                                type: 'object',
                                properties: {
                                    title: {
                                        type: 'string',
                                        description: '字段标题',
                                        minLength: 1,
                                    },
                                    type: {
                                        type: 'string',
                                        description: '字段类型',
                                        enum: ['line', 'mobile', 'select', 'textarea'],
                                    },
                                    required: {
                                        type: 'boolean',
                                        description: '是否必填',
                                        default: true,
                                    },
                                    options: {
                                        type: 'array',
                                        description: '选项（适用于select类型）',
                                        items: {
                                            type: 'string',
                                        },
                                    },
                                },
                                required: ['title', 'type'],
                            },
                        },
                    },
                    required: ['title', 'seat_count', 'meet_days'],
                },
            },
            {
                name: 'query_meet_windows',
                description: '查询预约窗口',
                inputSchema: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            description: '窗口状态：0=未启用，1=使用中，9=停止预约，10=已关闭（可选）',
                            enum: ["0", "1", "9", "10"],
                        },
                        limit: {
                            type: 'number',
                            description: '返回记录数限制（默认20）',
                            default: 20,
                            minimum: 1,
                            maximum: 100,
                        },
                    },
                },
            },
            {
                name: 'update_meet_window',
                description: '更新预约窗口',
                inputSchema: {
                    type: 'object',
                    properties: {
                        meet_id: {
                            type: 'string',
                            description: '预约窗口的数据库ID（_id字段）',
                        },
                        title: {
                            type: 'string',
                            description: '新的标题（可选）',
                        },
                        seat_count: {
                            type: 'number',
                            description: '新的座位数量（可选）',
                            minimum: 1,
                        },
                        content: {
                            type: 'string',
                            description: '新的描述（可选）',
                        },
                        status: {
                            type: 'string',
                            description: '新的状态：0=未启用，1=使用中，9=停止预约，10=已关闭（可选）',
                            enum: ["0", "1", "9", "10"],
                        },
                    },
                    required: ['meet_id'],
                },
            },
            {
                name: 'delete_meet_window',
                description: '删除预约窗口（谨慎操作）',
                inputSchema: {
                    type: 'object',
                    properties: {
                        meet_id: {
                            type: 'string',
                            description: '预约窗口的数据库ID（_id字段）',
                        },
                    },
                    required: ['meet_id'],
                },
            },
            // 保留原有的工具
            {
                name: 'query_reservations',
                description: '查询预约记录，支持按用户ID、状态、预约项目ID等条件筛选',
                inputSchema: {
                    type: 'object',
                    properties: {
                        user_id: {
                            type: 'string',
                            description: '用户ID（可选）',
                        },
                        status: {
                            type: 'string',
                            description: '预约状态：1=成功，10=已取消，99=系统取消（可选）',
                            enum: ["1", "10", "99"],
                        },
                        meet_id: {
                            type: 'string',
                            description: '预约项目ID（可选）',
                        },
                        limit: {
                            type: 'number',
                            description: '返回记录数限制（默认20）',
                            default: 20,
                            minimum: 1,
                            maximum: 100,
                        },
                    },
                },
            },
            {
                name: 'update_reservation_status',
                description: '更新预约状态（取消预约、恢复预约等）',
                inputSchema: {
                    type: 'object',
                    properties: {
                        record_id: {
                            type: 'string',
                            description: '数据库记录ID（_id字段，不是JOIN_ID）',
                        },
                        new_status: {
                            type: 'string',
                            description: '新状态：1=成功，10=已取消，99=系统取消',
                            enum: ["1", "10", "99"],
                        },
                        reason: {
                            type: 'string',
                            description: '取消理由（可选）',
                        },
                    },
                    required: ['record_id', 'new_status'],
                },
            },
            {
                name: 'delete_reservation',
                description: '永久删除预约记录（谨慎操作）',
                inputSchema: {
                    type: 'object',
                    properties: {
                        record_id: {
                            type: 'string',
                            description: '数据库记录ID（_id字段，不是JOIN_ID）',
                        },
                    },
                    required: ['record_id'],
                },
            },
        ],
    };
});
// 注册工具调用处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    console.log(`\n🔧 ===== 工具调用开始 =====`);
    console.log(`📋 工具名称: ${name}`);
    console.log(`📝 参数:`, JSON.stringify(args, null, 2));
    try {
        switch (name) {
            case 'query_all_reservations': {
                const params = QueryAllReservationsArgs.parse(args);
                const records = await wechatAPI.queryAllReservations({
                    limit: params.limit,
                    status: params.status,
                });
                let result = `📋 查询到 ${records.length} 条预约记录\n\n`;
                if (records.length === 0) {
                    result += '暂无符合条件的预约记录';
                }
                else {
                    records.forEach((record, index) => {
                        result += formatReservationRecord(record, index) + '\n';
                    });
                }
                return {
                    content: [{ type: 'text', text: result }],
                };
            }
            case 'query_reservations_by_mobile': {
                const params = QueryByMobileArgs.parse(args);
                const records = await wechatAPI.queryReservationsByMobile(params.mobile);
                let result = `📱 手机号 ${params.mobile} 的预约记录（${records.length} 条）\n\n`;
                if (records.length === 0) {
                    result += '未找到该手机号的预约记录';
                }
                else {
                    records.forEach((record, index) => {
                        result += formatReservationRecord(record, index) + '\n';
                    });
                }
                return {
                    content: [{ type: 'text', text: result }],
                };
            }
            case 'query_reservations_by_name': {
                const params = QueryByNameArgs.parse(args);
                const records = await wechatAPI.queryReservationsByName(params.name);
                let result = `👤 姓名 ${params.name} 的预约记录（${records.length} 条）\n\n`;
                if (records.length === 0) {
                    result += '未找到该姓名的预约记录';
                }
                else {
                    records.forEach((record, index) => {
                        result += formatReservationRecord(record, index) + '\n';
                    });
                }
                return {
                    content: [{ type: 'text', text: result }],
                };
            }
            case 'update_reservation_time_by_mobile': {
                const params = UpdateReservationTimeByMobileArgs.parse(args);
                const success = await wechatAPI.updateReservationTimeByMobile(params.mobile, params.new_day, params.new_time_start, params.new_time_end, params.new_time_mark);
                const result = success
                    ? `✅ 预约时间更新成功！\n\n📱 手机号: ${params.mobile}\n📅 新日期: ${params.new_day}\n⏰ 新时间: ${params.new_time_start} - ${params.new_time_end}`
                    : `❌ 预约时间更新失败！\n\n可能原因：\n- 未找到该手机号的预约记录\n- 网络连接问题`;
                return {
                    content: [{ type: 'text', text: result }],
                };
            }
            case 'update_reservation_time_by_name': {
                const params = UpdateReservationTimeByNameArgs.parse(args);
                const success = await wechatAPI.updateReservationTimeByName(params.name, params.new_day, params.new_time_start, params.new_time_end, params.new_time_mark);
                const result = success
                    ? `✅ 预约时间更新成功！\n\n👤 姓名: ${params.name}\n📅 新日期: ${params.new_day}\n⏰ 新时间: ${params.new_time_start} - ${params.new_time_end}`
                    : `❌ 预约时间更新失败！\n\n可能原因：\n- 未找到该姓名的预约记录\n- 网络连接问题`;
                return {
                    content: [{ type: 'text', text: result }],
                };
            }
            case 'delete_reservation_by_mobile': {
                const params = DeleteByMobileArgs.parse(args);
                const success = await wechatAPI.deleteReservationByMobile(params.mobile);
                const result = success
                    ? `✅ 预约记录删除成功！\n\n📱 已删除手机号 ${params.mobile} 的所有预约记录\n⚠️ 此操作不可撤销`
                    : `❌ 预约记录删除失败！\n\n可能原因：\n- 未找到该手机号的预约记录\n- 网络连接问题`;
                return {
                    content: [{ type: 'text', text: result }],
                };
            }
            case 'delete_reservation_by_name': {
                const params = DeleteByNameArgs.parse(args);
                const success = await wechatAPI.deleteReservationByName(params.name);
                const result = success
                    ? `✅ 预约记录删除成功！\n\n👤 已删除姓名 ${params.name} 的所有预约记录\n⚠️ 此操作不可撤销`
                    : `❌ 预约记录删除失败！\n\n可能原因：\n- 未找到该姓名的预约记录\n- 网络连接问题`;
                return {
                    content: [{ type: 'text', text: result }],
                };
            }
            case 'create_meet_window': {
                const params = CreateMeetWindowArgs.parse(args);
                const result = await wechatAPI.createMeetWindow({
                    title: params.title,
                    seatCount: params.seat_count,
                    order: params.order,
                    content: params.content,
                    adminId: params.admin_id,
                    meetDays: params.meet_days,
                    formFields: params.form_fields,
                });
                let resultText = '';
                if (result.success) {
                    resultText = `✅ 预约窗口创建成功！\n\n🆔 窗口ID: ${result.meetId}\n📝 标题: ${params.title}\n🪑 座位数: ${params.seat_count}\n🔢 排序号: ${params.order || 9999}\n📄 描述: ${params.content || '无描述'}\n👤 管理员ID: ${params.admin_id || '未指定'}`;
                    // 显示预约日期和时间段信息
                    resultText += `\n\n📅 可预约日期 (${params.meet_days.length} 天):`;
                    params.meet_days.forEach((day, dayIndex) => {
                        resultText += `\n  ${dayIndex + 1}. ${day.day} (${day.times.length} 个时间段)`;
                        day.times.forEach((time, timeIndex) => {
                            resultText += `\n     ${timeIndex + 1}) ${time.start}-${time.end}${time.limit ? ` (限${time.limit}人)` : ''}`;
                        });
                    });
                    // 显示表单字段信息
                    const formCount = params.form_fields?.length || 2;
                    resultText += `\n\n📋 用户填写字段 (${formCount} 个):`;
                    if (params.form_fields && params.form_fields.length > 0) {
                        params.form_fields.forEach((field, index) => {
                            resultText += `\n  ${index + 1}. ${field.title} (${field.type}${field.required ? ', 必填' : ', 可选'})`;
                            if (field.options && field.options.length > 0) {
                                resultText += ` - 选项: ${field.options.join(', ')}`;
                            }
                        });
                    }
                    else {
                        resultText += `\n  1. 姓名 (line, 必填)\n  2. 手机 (mobile, 必填)`;
                    }
                }
                else {
                    resultText = `❌ 预约窗口创建失败！\n\n可能原因：\n- 网络连接问题\n- 参数验证失败`;
                }
                return {
                    content: [{ type: 'text', text: resultText }],
                };
            }
            case 'query_meet_windows': {
                const params = QueryMeetWindowsArgs.parse(args);
                const records = await wechatAPI.queryMeetWindows({
                    status: params.status,
                    limit: params.limit,
                });
                let result = `📋 查询到 ${records.length} 个预约窗口\n\n`;
                if (records.length === 0) {
                    result += '暂无符合条件的预约窗口';
                }
                else {
                    records.forEach((record, index) => {
                        result += formatMeetWindowRecord(record, index) + '\n';
                    });
                }
                return {
                    content: [{ type: 'text', text: result }],
                };
            }
            case 'update_meet_window': {
                const params = UpdateMeetWindowArgs.parse(args);
                const success = await wechatAPI.updateMeetWindow({
                    meetId: params.meet_id,
                    title: params.title,
                    seatCount: params.seat_count,
                    content: params.content,
                    status: params.status,
                });
                const result = success
                    ? `✅ 预约窗口更新成功！\n\n🆔 窗口ID: ${params.meet_id}${params.title ? `\n📝 新标题: ${params.title}` : ''}${params.seat_count ? `\n🪑 新座位数: ${params.seat_count}` : ''}${params.content ? `\n📄 新描述: ${params.content}` : ''}${params.status ? `\n📊 新状态: ${getMeetStatusText(params.status)}` : ''}`
                    : `❌ 预约窗口更新失败！\n\n可能原因：\n- 预约窗口不存在\n- 网络连接问题`;
                return {
                    content: [{ type: 'text', text: result }],
                };
            }
            case 'delete_meet_window': {
                const params = DeleteMeetWindowArgs.parse(args);
                const success = await wechatAPI.deleteMeetWindow(params.meet_id);
                const result = success
                    ? `✅ 预约窗口删除成功！\n\n🆔 已删除窗口ID: ${params.meet_id}\n⚠️ 此操作不可撤销`
                    : `❌ 预约窗口删除失败！\n\n可能原因：\n- 预约窗口不存在\n- 网络连接问题`;
                return {
                    content: [{ type: 'text', text: result }],
                };
            }
            // 保留原有的工具处理逻辑
            case 'query_reservations': {
                const params = QueryReservationsArgs.parse(args);
                const records = await wechatAPI.queryReservations({
                    userId: params.user_id,
                    status: params.status,
                    meetId: params.meet_id,
                    mobile: params.mobile,
                    name: params.name,
                    limit: params.limit,
                });
                let result = `📋 查询到 ${records.length} 条预约记录\n\n`;
                if (records.length === 0) {
                    result += '暂无符合条件的预约记录';
                }
                else {
                    records.forEach((record, index) => {
                        result += formatReservationRecord(record, index) + '\n';
                    });
                }
                return {
                    content: [{ type: 'text', text: result }],
                };
            }
            case 'update_reservation_status': {
                const params = UpdateReservationArgs.parse(args);
                const success = await wechatAPI.updateReservationStatus(params.record_id, params.new_status, params.reason);
                const statusText = getStatusText(params.new_status);
                const result = success
                    ? `✅ 预约状态更新成功！\n\n🆔 记录ID: ${params.record_id}\n📊 新状态: ${statusText}${params.reason ? `\n💬 理由: ${params.reason}` : ''}`
                    : `❌ 预约状态更新失败！\n\n可能原因：\n- 预约记录不存在\n- 记录ID错误\n- 网络连接问题`;
                return {
                    content: [{ type: 'text', text: result }],
                };
            }
            case 'delete_reservation': {
                const params = DeleteReservationArgs.parse(args);
                const success = await wechatAPI.deleteReservation(params.record_id);
                const result = success
                    ? `✅ 预约记录删除成功！\n\n🆔 已删除记录ID: ${params.record_id}\n⚠️ 此操作不可撤销`
                    : `❌ 预约记录删除失败！\n\n可能原因：\n- 预约记录不存在\n- 记录ID错误\n- 网络连接问题`;
                return {
                    content: [{ type: 'text', text: result }],
                };
            }
            default:
                throw new Error(`未知的工具: ${name}`);
        }
    }
    catch (error) {
        console.error(`\n❌ ===== 工具调用失败 =====`);
        console.error(`🔧 工具名称: ${name}`);
        console.error(`📝 错误详情:`, error);
        console.error(`💡 错误堆栈:`, error instanceof Error ? error.stack : '无堆栈信息');
        return {
            content: [
                {
                    type: 'text',
                    text: `❌ 操作失败: ${error instanceof Error ? error.message : '未知错误'}`,
                },
            ],
        };
    }
    finally {
        console.log(`🏁 ===== 工具调用结束 =====\n`);
    }
});
// 启动服务器
async function main() {
    console.log(`\n🚀 ===== MCP预约服务器启动 =====`);
    console.log(`📋 配置检查:`);
    console.log(`   - AppID: ${process.env.WECHAT_APP_ID || '❌ 未设置'}`);
    console.log(`   - Secret: ${process.env.WECHAT_APP_SECRET ? '✅ 已设置' : '❌ 未设置'}`);
    console.log(`   - EnvID: ${process.env.WECHAT_ENV_ID || '❌ 未设置'}`);
    if (!process.env.WECHAT_APP_ID || !process.env.WECHAT_APP_SECRET || !process.env.WECHAT_ENV_ID) {
        console.error(`❌ 错误: 环境变量未正确设置！`);
        console.error(`请确保设置了以下环境变量:`);
        console.error(`- WECHAT_APP_ID`);
        console.error(`- WECHAT_APP_SECRET`);
        console.error(`- WECHAT_ENV_ID`);
        process.exit(1);
    }
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('✅ MCP预约服务器已启动并连接成功');
    console.error('⏳ 等待工具调用...\n');
}
main().catch((error) => {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map