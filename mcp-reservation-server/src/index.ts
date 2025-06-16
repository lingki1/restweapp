#!/usr/bin/env node

// 首先加载环境变量
import dotenv from 'dotenv';
dotenv.config();

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { WeChatAPI } from './wechat-api.js';
import {
  QueryReservationsArgs,
  QueryAllReservationsArgs,
  QueryByMobileArgs,
  QueryByNameArgs,
  UpdateReservationArgs,
  UpdateReservationTimeByMobileArgs,
  UpdateReservationTimeByNameArgs,
  DeleteReservationArgs,
  DeleteByMobileArgs,
  DeleteByNameArgs,
  CreateReservationArgs,
  getStatusText,
  ReservationStatus,
  ReservationRecord,
} from './types.js';

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
const server = new Server(
  {
    name: SERVER_NAME,
    version: SERVER_VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 格式化预约记录显示
function formatReservationRecord(record: ReservationRecord, index?: number): string {
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
  
  if (record.JOIN_SEATS && record.JOIN_SEATS.length > 0) {
    result += `   🪑 座位: ${record.JOIN_SEATS.join(', ')}\n`;
  }
  
  if (record.JOIN_REASON) {
    result += `   💬 备注: ${record.JOIN_REASON}\n`;
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
        name: 'get_available_meets',
        description: '获取所有可用的预约窗口',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_available_time_slots',
        description: '获取指定预约窗口在指定日期的可用时间段',
        inputSchema: {
          type: 'object',
          properties: {
            meet_id: {
              type: 'string',
              description: '预约窗口ID',
            },
            day: {
              type: 'string',
              description: '预约日期（YYYY-MM-DD格式）',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            },
          },
          required: ['meet_id', 'day'],
        },
      },
      {
        name: 'create_reservation',
        description: '创建新的预约记录（需要先查看可用的预约窗口和时间段）',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: '预约人姓名',
              minLength: 1,
            },
            mobile: {
              type: 'string',
              description: '手机号（11位数字）',
              pattern: '^[0-9]{11}$',
            },
            seat_number: {
              type: 'string',
              description: '座位号（可选）',
            },
            day: {
              type: 'string',
              description: '预约日期（YYYY-MM-DD格式）',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            },
            time_mark: {
              type: 'string',
              description: '时间段标识（从get_available_time_slots获取）',
            },
            meet_id: {
              type: 'string',
              description: '预约窗口ID（从get_available_meets获取）',
            },
          },
          required: ['name', 'mobile', 'day', 'time_mark', 'meet_id'],
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
        } else {
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
        } else {
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
        } else {
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
        const success = await wechatAPI.updateReservationTimeByMobile(
          params.mobile,
          params.new_day,
          params.new_time_start,
          params.new_time_end,
          params.new_time_mark
        );

        const result = success 
          ? `✅ 预约时间更新成功！\n\n📱 手机号: ${params.mobile}\n📅 新日期: ${params.new_day}\n⏰ 新时间: ${params.new_time_start} - ${params.new_time_end}`
          : `❌ 预约时间更新失败！\n\n可能原因：\n- 未找到该手机号的预约记录\n- 网络连接问题`;

        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'update_reservation_time_by_name': {
        const params = UpdateReservationTimeByNameArgs.parse(args);
        const success = await wechatAPI.updateReservationTimeByName(
          params.name,
          params.new_day,
          params.new_time_start,
          params.new_time_end,
          params.new_time_mark
        );

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

      case 'get_available_meets': {
        const meets = await wechatAPI.getAvailableMeets();
        
        if (meets.length === 0) {
          return {
            content: [{
              type: 'text',
              text: '❌ 当前没有可用的预约窗口，请联系管理员创建预约窗口。'
            }],
          };
        }

        let result = `📋 可用的预约窗口 (${meets.length} 个):\n\n`;
        meets.forEach((meet, index) => {
          result += `${index + 1}. **${meet.title}**\n`;
          result += `   - 窗口ID: \`${meet.id}\`\n`;
          result += `   - 座位数: ${meet.seatCount}\n`;
          result += `   - 可预约日期: ${meet.availableDays.length} 天\n`;
          if (meet.availableDays.length > 0) {
            const firstFewDays = meet.availableDays.slice(0, 3).map((d: any) => d.day).join(', ');
            result += `   - 示例日期: ${firstFewDays}${meet.availableDays.length > 3 ? '...' : ''}\n`;
          }
          result += '\n';
        });
        
        result += '💡 **使用提示:** 复制窗口ID，然后使用 get_available_time_slots 查看具体时间段';

        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'get_available_time_slots': {
        // 简单的参数验证
        if (!args || !args.meet_id || typeof args.meet_id !== 'string') {
          throw new Error('meet_id 参数是必需的');
        }
        if (!args.day || typeof args.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(args.day)) {
          throw new Error('day 参数必须是 YYYY-MM-DD 格式');
        }
        const params = { meet_id: args.meet_id as string, day: args.day as string };
        
        const timeSlots = await wechatAPI.getAvailableTimeSlots(params.meet_id, params.day);
        
        if (timeSlots.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `❌ ${params.day} 没有可用的时间段，请选择其他日期或联系管理员。`
            }],
          };
        }

        let result = `⏰ ${params.day} 可用时间段 (${timeSlots.length} 个):\n\n`;
        timeSlots.forEach((slot, index) => {
          result += `${index + 1}. **${slot.start} - ${slot.end}**\n`;
          result += `   - 时间段标识: \`${slot.mark}\`\n`;
          result += `   - 限制人数: ${slot.limit || '无限制'}\n`;
          result += `   - 已预约: ${slot.stat?.succCnt || 0} 人\n`;
          result += '\n';
        });
        
        result += '💡 **使用提示:** 复制时间段标识，然后使用 create_reservation 创建预约';

        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'create_reservation': {
        // 简单的参数验证
        if (!args || !args.name || typeof args.name !== 'string') {
          throw new Error('name 参数是必需的');
        }
        if (!args.mobile || typeof args.mobile !== 'string' || !/^[0-9]{11}$/.test(args.mobile)) {
          throw new Error('mobile 参数必须是11位数字');
        }
        if (!args.day || typeof args.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(args.day)) {
          throw new Error('day 参数必须是 YYYY-MM-DD 格式');
        }
        if (!args.time_mark || typeof args.time_mark !== 'string') {
          throw new Error('time_mark 参数是必需的');
        }
        if (!args.meet_id || typeof args.meet_id !== 'string') {
          throw new Error('meet_id 参数是必需的');
        }
        
        const params = {
          name: args.name as string,
          mobile: args.mobile as string,
          seat_number: args.seat_number as string | undefined,
          day: args.day as string,
          time_mark: args.time_mark as string,
          meet_id: args.meet_id as string,
        };
        
        // 我们需要获取时间信息来创建预约
        const timeSlots = await wechatAPI.getAvailableTimeSlots(params.meet_id, params.day);
        const timeSlot = timeSlots.find(slot => slot.mark === params.time_mark);
        
        if (!timeSlot) {
          return {
            content: [{
              type: 'text',
              text: `❌ 时间段无效！请先使用 get_available_time_slots 查看可用时间段。`
            }],
          };
        }
        
        const result = await wechatAPI.createReservation({
          name: params.name,
          mobile: params.mobile,
          seatNumber: params.seat_number,
          day: params.day,
          timeStart: timeSlot.start,
          timeEnd: timeSlot.end,
          timeMark: params.time_mark,
          meetId: params.meet_id,
          meetTitle: '', // 会在API中自动获取
        });

        if (result.success) {
          return {
            content: [{
              type: 'text',
              text: `✅ 预约创建成功！\n\n📋 **预约详情:**\n- 预约ID: ${result.joinId}\n- 姓名: ${params.name}\n- 手机: ${params.mobile}\n- 日期: ${params.day}\n- 时间: ${timeSlot.start}-${timeSlot.end}\n- 座位: ${params.seat_number || '未指定'}\n\n🎉 预约已生效，请按时参加！`
            }],
          };
        } else {
          return {
            content: [{
              type: 'text',
              text: `❌ 预约创建失败，请稍后重试`
            }],
          };
        }
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
        } else {
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
        const success = await wechatAPI.updateReservationStatus(
          params.record_id,
          params.new_status,
          params.reason
        );

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
  } catch (error) {
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
  } finally {
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