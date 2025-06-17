import * as https from 'https';
import {
  WeChatConfig,
  AccessTokenResponse,
  DatabaseQueryResponse,
  DatabaseUpdateResponse,
  DatabaseDeleteResponse,
  ReservationRecord,
  FormField,
  DatabaseAddResponse,
  MeetRecord,
  formatSeatNumbers
} from './types.js';

export class WeChatAPI {
  private config: WeChatConfig;
  private accessToken?: string;
  private tokenExpiry?: number;
  private tokenRefreshing?: Promise<string>; // 防止并发刷新Token

  constructor(config: WeChatConfig) {
    this.config = config;
  }

  /**
   * 检查是否是Token相关错误
   */
  private isTokenError(errcode: number): boolean {
    // 微信常见的Token错误码
    const tokenErrorCodes = [
      40001, // access_token 无效
      40002, // access_token 过期
      40014, // access_token 不合法
      42001, // access_token 超时
      42007, // access_token 过期
    ];
    return tokenErrorCodes.includes(errcode);
  }

  /**
   * 获取Access Token - 支持并发安全和智能缓存
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    
    // 如果token有效且未过期（提前10分钟刷新，给更多缓冲时间）
    if (this.accessToken && this.tokenExpiry && now < this.tokenExpiry - 10 * 60 * 1000) {
      console.log(`🔄 使用缓存的Access Token，剩余有效期: ${Math.round((this.tokenExpiry - now) / 1000 / 60)}分钟`);
      return this.accessToken;
    }

    // 如果已经在刷新中，等待刷新完成，避免并发刷新导致Token失效
    if (this.tokenRefreshing) {
      console.log(`⏳ 等待正在进行的Token刷新...`);
      return await this.tokenRefreshing;
    }

    // 开始刷新Token
    console.log(`🔑 开始刷新Access Token...`);
    console.log(`📋 配置信息: AppID=${this.config.appId}, EnvID=${this.config.envId}`);
    
    this.tokenRefreshing = this.refreshAccessToken();
    
    try {
      const token = await this.tokenRefreshing;
      this.tokenRefreshing = undefined; // 清除刷新状态
      return token;
    } catch (error) {
      this.tokenRefreshing = undefined; // 清除刷新状态
      throw error;
    }
  }

  /**
   * 实际的Token刷新逻辑
   */
  private async refreshAccessToken(): Promise<string> {
    const now = Date.now();
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.config.appId}&secret=${this.config.appSecret}`;
    console.log(`🌐 请求URL: ${url.replace(this.config.appSecret, '***SECRET***')}`);
    
    const options: https.RequestOptions = {
      hostname: 'api.weixin.qq.com',
      path: `/cgi-bin/token?grant_type=client_credential&appid=${this.config.appId}&secret=${this.config.appSecret}`,
      method: 'GET',
    };

    try {
      console.log(`📤 发送获取Token请求...`);
      const response = await this.makeRequest(options);
      console.log(`📥 Token API响应: ${response}`);
      
      const result = AccessTokenResponse.parse(JSON.parse(response));
      
      if (result.errcode && result.errcode !== 0) {
        console.error(`❌ Token获取失败 - 错误码: ${result.errcode}, 错误信息: ${result.errmsg}`);
        // 如果Token获取失败，清除旧Token，避免使用无效Token
        this.accessToken = undefined;
        this.tokenExpiry = undefined;
        throw new Error(`获取access_token失败: ${result.errmsg || '未知错误'} (错误码: ${result.errcode})`);
      }
      
      // 成功获取新Token，更新缓存
      this.accessToken = result.access_token;
      this.tokenExpiry = now + result.expires_in * 1000;
    
      console.log(`✅ Access Token刷新成功!`);
      console.log(`🕒 新Token: ${this.accessToken?.substring(0, 20)}...`);
      console.log(`⏰ 有效期至: ${new Date(this.tokenExpiry).toLocaleString()}`);
      console.log(`🔄 实际有效期: ${result.expires_in}秒 (${Math.round(result.expires_in/60)}分钟)`);
      
      return this.accessToken;
    } catch (error) {
      console.error('❌ 刷新Access Token失败:', error);
      // 出错时清除Token缓存
      this.accessToken = undefined;
      this.tokenExpiry = undefined;
      throw error;
    }
  }

  /**
   * HTTP请求封装
   */
  private async makeRequest(options: https.RequestOptions, data?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log(`🌐 发起HTTP请求: ${options.method} https://${options.hostname}${options.path?.substring(0, 80)}...`);
      
      const req = https.request(options, (res) => {
        console.log(`📡 HTTP响应状态: ${res.statusCode} ${res.statusMessage}`);
        console.log(`📋 响应头:`, res.headers);
        
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          console.log(`📥 HTTP响应体长度: ${body.length} 字符`);
          if (res.statusCode && res.statusCode >= 400) {
            console.error(`❌ HTTP错误 ${res.statusCode}: ${body}`);
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          } else {
            resolve(body);
          }
        });
      });

      req.on('error', (error) => {
        console.error(`❌ HTTP请求错误:`, error);
        reject(error);
      });

      req.on('timeout', () => {
        console.error(`❌ HTTP请求超时`);
        req.destroy();
        reject(new Error('HTTP请求超时'));
      });

      if (data) {
        console.log(`📤 发送数据长度: ${data.length} 字符`);
        req.write(data);
      }
      req.end();
    });
  }

  /**
   * 执行数据库查询 - 支持Token失效自动重试 (公开方法供测试使用)
   */
  async dbQuery(query: string, retryCount: number = 0): Promise<any[]> {
    console.log(`🔍 执行数据库查询...`);
    console.log(`📝 查询语句: ${query}`);
    if (retryCount > 0) {
      console.log(`🔄 重试次数: ${retryCount}`);
    }
    
    const token = await this.getAccessToken();
    
    const postData = JSON.stringify({
      env: this.config.envId,
      query: query,
    });

    console.log(`📤 数据库查询请求数据: ${postData}`);

    const options: https.RequestOptions = {
      hostname: 'api.weixin.qq.com',
      path: `/tcb/databasequery?access_token=${token}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    console.log(`🌐 数据库查询URL: https://${options.hostname}${options.path?.substring(0, 50)}...`);

    try {
      const response = await this.makeRequest(options, postData);
      console.log(`📥 数据库查询响应: ${response}`);
      
      const result = DatabaseQueryResponse.parse(JSON.parse(response));
      
      if (result.errcode !== 0) {
        // 检查是否是Token相关错误
        if (this.isTokenError(result.errcode) && retryCount < 2) {
          console.warn(`⚠️ 检测到Token错误 (错误码: ${result.errcode})，清除缓存并重试...`);
          // 清除Token缓存，强制刷新
          this.accessToken = undefined;
          this.tokenExpiry = undefined;
          this.tokenRefreshing = undefined;
          // 递归重试
          return this.dbQuery(query, retryCount + 1);
        }
        
        console.error(`❌ 数据库查询失败 - 错误码: ${result.errcode}, 错误信息: ${result.errmsg}`);
        throw new Error(`数据库查询失败: ${result.errmsg} (错误码: ${result.errcode})`);
      }

      const records = result.data ? result.data.map(item => JSON.parse(item)) : [];
      console.log(`✅ 数据库查询成功，返回 ${records.length} 条记录`);
      return records;
    } catch (error) {
      console.error(`❌ 数据库查询异常:`, error);
      throw error;
    }
  }

  /**
   * 执行数据库更新 - 支持Token失效自动重试
   */
  private async dbUpdate(query: string, retryCount: number = 0): Promise<number> {
    console.log(`✏️ 执行数据库更新...`);
    console.log(`📝 更新语句: ${query}`);
    if (retryCount > 0) {
      console.log(`🔄 重试次数: ${retryCount}`);
    }
    
    const token = await this.getAccessToken();
    
    const postData = JSON.stringify({
      env: this.config.envId,
      query: query,
    });

    console.log(`📤 数据库更新请求数据: ${postData}`);

    const options: https.RequestOptions = {
      hostname: 'api.weixin.qq.com',
      path: `/tcb/databaseupdate?access_token=${token}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    console.log(`🌐 数据库更新URL: https://${options.hostname}${options.path?.substring(0, 50)}...`);

    try {
      const response = await this.makeRequest(options, postData);
      console.log(`📥 数据库更新响应: ${response}`);
      
      const result = DatabaseUpdateResponse.parse(JSON.parse(response));
      
      if (result.errcode !== 0) {
        // 检查是否是Token相关错误
        if (this.isTokenError(result.errcode) && retryCount < 2) {
          console.warn(`⚠️ 检测到Token错误 (错误码: ${result.errcode})，清除缓存并重试...`);
          // 清除Token缓存，强制刷新
          this.accessToken = undefined;
          this.tokenExpiry = undefined;
          this.tokenRefreshing = undefined;
          // 递归重试
          return this.dbUpdate(query, retryCount + 1);
        }
        
        console.error(`❌ 数据库更新失败 - 错误码: ${result.errcode}, 错误信息: ${result.errmsg}`);
        throw new Error(`数据库更新失败: ${result.errmsg} (错误码: ${result.errcode})`);
      }

      // 根据官方文档，使用 modified 字段而不是 updated
      const modifiedCount = result.modified || 0;
      console.log(`✅ 数据库更新成功，影响 ${modifiedCount} 条记录`);
      return modifiedCount;
    } catch (error) {
      console.error(`❌ 数据库更新异常:`, error);
      throw error;
    }
  }

  /**
   * 执行数据库删除 - 支持Token失效自动重试
   */
  private async dbDelete(query: string, retryCount: number = 0): Promise<number> {
    console.log(`🗑️ 执行数据库删除...`);
    console.log(`📝 删除语句: ${query}`);
    if (retryCount > 0) {
      console.log(`🔄 重试次数: ${retryCount}`);
    }
    
    const token = await this.getAccessToken();
    
    const postData = JSON.stringify({
      env: this.config.envId,
      query: query,
    });

    console.log(`📤 数据库删除请求数据: ${postData}`);

    const options: https.RequestOptions = {
      hostname: 'api.weixin.qq.com',
      path: `/tcb/databasedelete?access_token=${token}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    console.log(`🌐 数据库删除URL: https://${options.hostname}${options.path?.substring(0, 50)}...`);

    try {
      const response = await this.makeRequest(options, postData);
      console.log(`📥 数据库删除响应: ${response}`);
      
      const result = DatabaseDeleteResponse.parse(JSON.parse(response));
      
      if (result.errcode !== 0) {
        // 检查是否是Token相关错误
        if (this.isTokenError(result.errcode) && retryCount < 2) {
          console.warn(`⚠️ 检测到Token错误 (错误码: ${result.errcode})，清除缓存并重试...`);
          // 清除Token缓存，强制刷新
          this.accessToken = undefined;
          this.tokenExpiry = undefined;
          this.tokenRefreshing = undefined;
          // 递归重试
          return this.dbDelete(query, retryCount + 1);
        }
        
        console.error(`❌ 数据库删除失败 - 错误码: ${result.errcode}, 错误信息: ${result.errmsg}`);
        throw new Error(`数据库删除失败: ${result.errmsg} (错误码: ${result.errcode})`);
      }

      const deletedCount = result.deleted || 0;
      console.log(`✅ 数据库删除成功，删除 ${deletedCount} 条记录`);
      return deletedCount;
    } catch (error) {
      console.error(`❌ 数据库删除异常:`, error);
      throw error;
    }
  }

  /**
   * 查询预约记录
   */
  async queryReservations(options: {
    userId?: string;
    status?: string;
    meetId?: string;
    mobile?: string;
    name?: string;
    limit?: number;
  }): Promise<ReservationRecord[]> {
    let query = `db.collection("ax_join")`;
    const conditions: string[] = [];

    if (options.userId) {
      conditions.push(`JOIN_USER_ID: "${options.userId}"`);
    }
    if (options.status !== undefined) {
      const statusNum = parseInt(options.status);
      conditions.push(`JOIN_STATUS: ${statusNum}`);
    }
    if (options.meetId) {
      conditions.push(`JOIN_MEET_ID: "${options.meetId}"`);
    }

    // 对于复杂查询，需要单独处理
    if (options.mobile || options.name) {
    if (options.mobile) {
        query += `.where({
          JOIN_FORMS: _.elemMatch({
            title: "手机",
            val: "${options.mobile}"
          })
        })`;
      } else if (options.name) {
        query += `.where({
          JOIN_FORMS: _.elemMatch({
            title: "姓名",
            val: "${options.name}"
          })
        })`;
      }
    } else if (conditions.length > 0) {
      query += `.where({${conditions.join(', ')}})`;
    }

    const limit = options.limit || 20;
    query += `.orderBy("JOIN_ADD_TIME", "desc").limit(${limit}).get()`;

    const response = await this.dbQuery(query);
    
    if (!response) {
      return [];
    }

    return response;
  }

  /**
   * 更新预约状态 - 支持Token失效自动重试
   */
  async updateReservationStatus(recordId: string, newStatus: string, reason?: string, retryCount: number = 0): Promise<boolean> {
    console.log(`✏️ 更新预约状态...`);
    console.log(`📝 数据库记录ID: ${recordId}`);
    console.log(`📊 新状态: ${newStatus}`);
    console.log(`💬 原因: ${reason || '无'}`);
    if (retryCount > 0) {
      console.log(`🔄 重试次数: ${retryCount}`);
    }
    
    const token = await this.getAccessToken();
    
    const updateData: any = {
      JOIN_STATUS: parseInt(newStatus),
      JOIN_EDIT_TIME: Date.now()
    };

    if (reason) {
      updateData.JOIN_REASON = reason;
    }

    const query = `db.collection("ax_join").doc("${recordId}").update({data: ${JSON.stringify(updateData)}})`;
    console.log(`📝 更新语句: ${query}`);
    
    const requestData = {
      env: this.config.envId,
      query: query
    };

    const options: https.RequestOptions = {
      hostname: 'api.weixin.qq.com',
      path: `/tcb/databaseupdate?access_token=${token}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(requestData)),
      },
    };

    try {
      const response = await this.makeRequest(options, JSON.stringify(requestData));
      console.log(`📥 更新状态响应: ${response}`);
      
      const result = DatabaseUpdateResponse.parse(JSON.parse(response));
      
      if (result.errcode !== 0) {
        // 检查是否是Token相关错误
        if (this.isTokenError(result.errcode) && retryCount < 2) {
          console.warn(`⚠️ 检测到Token错误 (错误码: ${result.errcode})，清除缓存并重试...`);
          // 清除Token缓存，强制刷新
          this.accessToken = undefined;
          this.tokenExpiry = undefined;
          this.tokenRefreshing = undefined;
          // 递归重试
          return this.updateReservationStatus(recordId, newStatus, reason, retryCount + 1);
        }
        
        console.error(`❌ 更新预约状态失败 - 错误码: ${result.errcode}, 错误信息: ${result.errmsg}`);
        throw new Error(`更新失败: ${result.errmsg} (错误码: ${result.errcode})`);
      }

      // 根据官方文档，检查 modified 字段
      const success = (result.modified && result.modified > 0) || false;
      console.log(`✅ 预约状态更新${success ? '成功' : '失败'}，影响记录数: ${result.modified || 0}`);
      return success;
    } catch (error) {
      console.error(`❌ 更新预约状态异常:`, error);
      throw new Error(`更新预约状态失败: ${error}`);
    }
  }

  /**
   * 删除预约记录 - 支持Token失效自动重试
   */
  async deleteReservation(recordId: string, retryCount: number = 0): Promise<boolean> {
    console.log(`🗑️ 删除预约记录...`);
    console.log(`📝 数据库记录ID: ${recordId}`);
    if (retryCount > 0) {
      console.log(`🔄 重试次数: ${retryCount}`);
    }
    
    const token = await this.getAccessToken();
    
    const query = `db.collection("ax_join").doc("${recordId}").remove()`;
    console.log(`📝 删除语句: ${query}`);
    
    const requestData = {
      env: this.config.envId,
      query: query
    };

    const options: https.RequestOptions = {
      hostname: 'api.weixin.qq.com',
      path: `/tcb/databasedelete?access_token=${token}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(requestData)),
      },
    };

    try {
      const response = await this.makeRequest(options, JSON.stringify(requestData));
      console.log(`📥 删除记录响应: ${response}`);
      
      const result = DatabaseDeleteResponse.parse(JSON.parse(response));
      
      if (result.errcode !== 0) {
        // 检查是否是Token相关错误
        if (this.isTokenError(result.errcode) && retryCount < 2) {
          console.warn(`⚠️ 检测到Token错误 (错误码: ${result.errcode})，清除缓存并重试...`);
          // 清除Token缓存，强制刷新
          this.accessToken = undefined;
          this.tokenExpiry = undefined;
          this.tokenRefreshing = undefined;
          // 递归重试
          return this.deleteReservation(recordId, retryCount + 1);
        }
        
        console.error(`❌ 删除预约记录失败 - 错误码: ${result.errcode}, 错误信息: ${result.errmsg}`);
        throw new Error(`删除失败: ${result.errmsg} (错误码: ${result.errcode})`);
      }

      const success = (result.deleted && result.deleted > 0) || false;
      console.log(`✅ 预约记录删除${success ? '成功' : '失败'}，删除记录数: ${result.deleted || 0}`);
      return success;
    } catch (error) {
      console.error(`❌ 删除预约记录异常:`, error);
      throw new Error(`删除预约记录失败: ${error}`);
    }
  }

  /**
   * 从表单数据中提取字段值
   */
  private getFormFieldValue(forms: FormField[], fieldName: string, fieldType?: string): string | null {
    for (const form of forms) {
      if (form.title === fieldName || (fieldType && form.type === fieldType)) {
        return form.val;
      }
    }
    return null;
  }

  /**
   * 查询所有预约记录
   */
  async queryAllReservations(params: { limit?: number; status?: string }): Promise<ReservationRecord[]> {
    let whereClause = '';
    
    if (params.status !== undefined) {
      const statusNum = parseInt(params.status);
      whereClause = `.where({JOIN_STATUS: ${statusNum}})`;
    }
    
    const limit = params.limit || 50;
    const query = `db.collection("ax_join")${whereClause}.orderBy("JOIN_ADD_TIME", "desc").limit(${limit}).get()`;
    
    return await this.dbQuery(query);
  }

  /**
   * 根据手机号查询预约记录
   */
  async queryReservationsByMobile(mobile: string): Promise<ReservationRecord[]> {
    // 修正：根据实际数据结构，手机字段的title是"手机"，type是"line"
    const query = `db.collection("ax_join").where({
      JOIN_FORMS: _.elemMatch({
        title: "手机",
        val: "${mobile}"
      })
    }).orderBy("JOIN_ADD_TIME", "desc").get()`;
    return await this.dbQuery(query);
  }

  /**
   * 根据姓名查询预约记录
   */
  async queryReservationsByName(name: string): Promise<ReservationRecord[]> {
    const query = `db.collection("ax_join").where({
      JOIN_FORMS: _.elemMatch({
        title: "姓名",
        val: "${name}"
      })
    }).orderBy("JOIN_ADD_TIME", "desc").get()`;
    return await this.dbQuery(query);
  }

  /**
   * 根据手机号更新预约时间
   */
  async updateReservationTimeByMobile(
    mobile: string,
    newDay: string,
    newTimeStart: string,
    newTimeEnd: string,
    newTimeMark: string
  ): Promise<boolean> {
    const records = await this.queryReservationsByMobile(mobile);
    
    if (records.length === 0) {
      throw new Error('未找到该手机号的预约记录');
    }

    // 如果有多条记录，更新最新的一条
    const latestRecord = records.reduce((latest, current) => 
      current.JOIN_ADD_TIME > latest.JOIN_ADD_TIME ? current : latest
    );

    console.log(`📋 选择最新记录: JOIN_ID=${latestRecord.JOIN_ID}, _id=${latestRecord._id}`);
    return this.updateReservationTime(latestRecord._id, newDay, newTimeStart, newTimeEnd, newTimeMark);
  }

  /**
   * 根据姓名更新预约时间
   */
  async updateReservationTimeByName(
    name: string,
    newDay: string,
    newTimeStart: string,
    newTimeEnd: string,
    newTimeMark: string
  ): Promise<boolean> {
    const records = await this.queryReservationsByName(name);
    
    if (records.length === 0) {
      throw new Error('未找到该姓名的预约记录');
    }

    // 如果有多条记录，更新最新的一条
    const latestRecord = records.reduce((latest, current) => 
      current.JOIN_ADD_TIME > latest.JOIN_ADD_TIME ? current : latest
    );

    console.log(`📋 选择最新记录: JOIN_ID=${latestRecord.JOIN_ID}, _id=${latestRecord._id}`);
    return this.updateReservationTime(latestRecord._id, newDay, newTimeStart, newTimeEnd, newTimeMark);
  }

  /**
   * 更新预约时间的通用方法 - 支持Token失效自动重试
   */
  private async updateReservationTime(
    recordId: string,
    newDay: string,
    newTimeStart: string,
    newTimeEnd: string,
    newTimeMark: string,
    retryCount: number = 0
  ): Promise<boolean> {
    console.log(`✏️ 更新预约时间...`);
    console.log(`📝 数据库记录ID: ${recordId}`);
    console.log(`📅 新日期: ${newDay}`);
    console.log(`⏰ 新时间: ${newTimeStart} - ${newTimeEnd}`);
    if (retryCount > 0) {
      console.log(`🔄 重试次数: ${retryCount}`);
    }
    
    const token = await this.getAccessToken();
    
    const updateData = {
      JOIN_MEET_DAY: newDay,
      JOIN_MEET_TIME_START: newTimeStart,
      JOIN_MEET_TIME_END: newTimeEnd,
      JOIN_MEET_TIME_MARK: newTimeMark,
      JOIN_EDIT_TIME: Date.now()
    };

    const query = `db.collection("ax_join").doc("${recordId}").update({data: ${JSON.stringify(updateData)}})`;
    console.log(`📝 更新语句: ${query}`);
    
    const requestData = {
      env: this.config.envId,
      query: query
    };

    const options: https.RequestOptions = {
      hostname: 'api.weixin.qq.com',
      path: `/tcb/databaseupdate?access_token=${token}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(requestData)),
      },
    };

    try {
      const response = await this.makeRequest(options, JSON.stringify(requestData));
      console.log(`📥 更新时间响应: ${response}`);
      
      const result = DatabaseUpdateResponse.parse(JSON.parse(response));
      
      if (result.errcode !== 0) {
        // 检查是否是Token相关错误
        if (this.isTokenError(result.errcode) && retryCount < 2) {
          console.warn(`⚠️ 检测到Token错误 (错误码: ${result.errcode})，清除缓存并重试...`);
          // 清除Token缓存，强制刷新
          this.accessToken = undefined;
          this.tokenExpiry = undefined;
          this.tokenRefreshing = undefined;
          // 递归重试
          return this.updateReservationTime(recordId, newDay, newTimeStart, newTimeEnd, newTimeMark, retryCount + 1);
        }
        
        console.error(`❌ 更新预约时间失败 - 错误码: ${result.errcode}, 错误信息: ${result.errmsg}`);
        throw new Error(`更新时间失败: ${result.errmsg} (错误码: ${result.errcode})`);
      }

      // 根据官方文档，检查 modified 字段
      const success = (result.modified && result.modified > 0) || false;
      console.log(`✅ 预约时间更新${success ? '成功' : '失败'}，影响记录数: ${result.modified || 0}`);
      return success;
    } catch (error) {
      console.error(`❌ 更新预约时间异常:`, error);
      throw new Error(`更新预约时间失败: ${error}`);
    }
  }

  /**
   * 根据手机号删除预约记录
   */
  async deleteReservationByMobile(mobile: string): Promise<{ deleted: number; ids: string[] }> {
    const records = await this.queryReservationsByMobile(mobile);
    
    if (records.length === 0) {
      return { deleted: 0, ids: [] };
    }

    let deletedCount = 0;
    const deletedIds: string[] = [];

    for (const record of records) {
      try {
        console.log(`🗑️ 删除记录: JOIN_ID=${record.JOIN_ID}, _id=${record._id}`);
        const success = await this.deleteReservation(record._id);
        if (success) {
          deletedCount++;
          deletedIds.push(record.JOIN_ID);
        }
      } catch (error) {
        console.error(`删除记录 ${record.JOIN_ID} 失败:`, error);
      }
    }

    return { deleted: deletedCount, ids: deletedIds };
  }

  /**
   * 根据姓名删除预约记录
   */
  async deleteReservationByName(name: string): Promise<{ deleted: number; ids: string[] }> {
    const records = await this.queryReservationsByName(name);
    
    if (records.length === 0) {
      return { deleted: 0, ids: [] };
    }

    let deletedCount = 0;
    const deletedIds: string[] = [];

    for (const record of records) {
      try {
        console.log(`🗑️ 删除记录: JOIN_ID=${record.JOIN_ID}, _id=${record._id}`);
        const success = await this.deleteReservation(record._id);
        if (success) {
          deletedCount++;
          deletedIds.push(record.JOIN_ID);
        }
      } catch (error) {
        console.error(`删除记录 ${record.JOIN_ID} 失败:`, error);
      }
    }

    return { deleted: deletedCount, ids: deletedIds };
  }

  /**
   * 获取可用的预约窗口列表
   */
  async getAvailableMeets(): Promise<any[]> {
    try {
      const query = `db.collection("ax_meet").where({MEET_STATUS: 1}).orderBy("MEET_ORDER", "asc").get()`;
      const meets = await this.dbQuery(query);
      
      return meets.map(meet => ({
        id: meet._id,
        meetId: meet.MEET_ID,
        title: meet.MEET_TITLE,
        status: meet.MEET_STATUS,
        seatCount: meet.MEET_SEAT_COUNT,
        availableDays: meet.MEET_DAYS || []
      }));
    } catch (error) {
      console.error(`❌ 获取预约窗口失败:`, error);
      return [];
    }
  }

  /**
   * 获取指定预约窗口在指定日期的可用时间段
   */
  async getAvailableTimeSlots(meetId: string, day: string): Promise<any[]> {
    try {
      const query = `db.collection("ax_meet").where({_id: "${meetId}"}).get()`;
      const meetResponse = await this.dbQuery(query);
      
      if (!meetResponse || meetResponse.length === 0) {
        return [];
      }
      
      const meet = meetResponse[0];
      if (!meet.MEET_DAYS || !Array.isArray(meet.MEET_DAYS)) {
        return [];
      }
      
      for (const dayInfo of meet.MEET_DAYS) {
        if (dayInfo.day === day && dayInfo.times) {
          return dayInfo.times.filter((time: any) => time.status === 1);
        }
      }
      
      return [];
    } catch (error) {
      console.error(`❌ 获取时间段失败:`, error);
      return [];
    }
  }

  /**
   * 验证预约窗口和时间段是否存在
   */
  private async validateMeetAndTime(meetId: string, timeMark: string, day: string): Promise<{ isValid: boolean; meetTitle?: string; timeSlot?: any }> {
    try {
      // 查询预约窗口
      const meetQuery = `db.collection("ax_meet").where({_id: "${meetId}"}).get()`;
      const meetResponse = await this.dbQuery(meetQuery);
      
      if (!meetResponse || meetResponse.length === 0) {
        return { isValid: false };
      }
      
      const meet = meetResponse[0];
      
      // 检查预约窗口状态
      if (meet.MEET_STATUS !== 1) {
        console.warn(`⚠️ 预约窗口状态异常: ${meet.MEET_STATUS}`);
        return { isValid: false };
      }
      
      // 查找对应的时间段
      let timeSlot = null;
      if (meet.MEET_DAYS && Array.isArray(meet.MEET_DAYS)) {
        for (const dayInfo of meet.MEET_DAYS) {
          if (dayInfo.day === day && dayInfo.times) {
            for (const time of dayInfo.times) {
              if (time.mark === timeMark && time.status === 1) {
                timeSlot = time;
                break;
              }
            }
          }
          if (timeSlot) break;
        }
      }
      
      if (!timeSlot) {
        console.warn(`⚠️ 时间段 ${timeMark} 在日期 ${day} 不存在或已关闭`);
        return { isValid: false };
      }
      
      return { 
        isValid: true, 
        meetTitle: meet.MEET_TITLE,
        timeSlot: timeSlot
      };
      
    } catch (error) {
      console.error(`❌ 验证预约窗口失败:`, error);
      return { isValid: false };
    }
  }

  /**
   * 生成唯一的时间段标识
   */
  private generateTimeMark(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'T' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + 'AAA';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 生成唯一的表单字段标识
   */
  private generateFieldMark(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 创建预约窗口（完善版）
   */
  async createMeetWindow(params: {
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
  }, retryCount: number = 0): Promise<{ success: boolean; meetId?: string }> {
    console.log(`➕ 创建新的预约窗口...`);
    console.log(`📝 标题: ${params.title}, 🪑 座位数: ${params.seatCount}`);
    console.log(`📅 预约日期数: ${params.meetDays.length}`);
    console.log(`📋 表单字段数: ${params.formFields?.length || 2} (使用默认姓名、手机)`);
    if (retryCount > 0) {
      console.log(`🔄 重试次数: ${retryCount}`);
    }
    
    const token = await this.getAccessToken();
    const now = Date.now();
    
    // 处理预约日期和时间段
    const meetDays = params.meetDays.map(dayConfig => ({
      day: dayConfig.day,
      times: dayConfig.times.map(timeConfig => ({
        mark: timeConfig.mark || this.generateTimeMark(),
        start: timeConfig.start,
        end: timeConfig.end,
        limit: timeConfig.limit || params.seatCount,
        status: 1 // 默认开放
      }))
    }));
    
    // 处理表单字段设置
    const formSet = params.formFields ? 
      params.formFields.map(field => ({
        title: field.title,
        mark: this.generateFieldMark(),
        type: field.type,
        required: field.required,
        options: field.options || []
      })) :
      [
        {
          title: "姓名",
          mark: this.generateFieldMark(),
          type: "line",
          required: true
        },
        {
          title: "手机",
          mark: this.generateFieldMark(),
          type: "mobile",
          required: true
        }
      ];
    
    const meetData = {
      _pid: "A00",
      MEET_ID: `MEET_${now}`,
      MEET_ADMIN_ID: params.adminId || `admin_${now}`,
      MEET_TITLE: params.title,
      MEET_CONTENT: params.content ? [{ type: 'text', content: params.content }] : [],
      MEET_DAYS: meetDays,
      MEET_SEAT_COUNT: params.seatCount,
      MEET_FORM_SET: formSet,
      MEET_STATUS: 1, // 默认启用
      MEET_ORDER: params.order || 9999,
      MEET_ADD_TIME: now,
      MEET_EDIT_TIME: now,
      MEET_ADD_IP: "",
      MEET_EDIT_IP: ""
    };

    const query = `db.collection("ax_meet").add({data: ${JSON.stringify(meetData)}})`;
    
    const requestData = {
      env: this.config.envId,
      query: query
    };

    const options: https.RequestOptions = {
      hostname: 'api.weixin.qq.com',
      path: `/tcb/databaseadd?access_token=${token}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(requestData)),
      },
    };

    try {
      const response = await this.makeRequest(options, JSON.stringify(requestData));
      console.log(`📥 创建预约窗口响应: ${response}`);
      
      const result = DatabaseAddResponse.parse(JSON.parse(response));
      
      if (result.errcode !== 0) {
        if (this.isTokenError(result.errcode) && retryCount < 2) {
          console.warn(`⚠️ 检测到Token错误 (错误码: ${result.errcode})，清除缓存并重试...`);
          this.accessToken = undefined;
          this.tokenExpiry = undefined;
          this.tokenRefreshing = undefined;
          return this.createMeetWindow(params, retryCount + 1);
        }
        
        console.error(`❌ 创建预约窗口失败 - 错误码: ${result.errcode}, 错误信息: ${result.errmsg}`);
        throw new Error(`创建预约窗口失败: ${result.errmsg} (错误码: ${result.errcode})`);
      }

      const success = !!(result.id_list && result.id_list.length > 0);
      const meetId = success ? result.id_list![0] : undefined;
      
      console.log(`✅ 预约窗口创建${success ? '成功' : '失败'}`);
      if (success) {
        console.log(`🆔 窗口ID: ${meetData.MEET_ID}`);
        console.log(`🆔 数据库记录ID: ${meetId || '未返回'}`);
      }

      return { success, meetId: meetId || meetData.MEET_ID };
    } catch (error) {
      console.error(`❌ 创建预约窗口异常:`, error);
      throw new Error(`创建预约窗口失败: ${error}`);
    }
  }

  /**
   * 查询预约窗口
   */
  async queryMeetWindows(params: { 
    status?: string; 
    limit?: number 
  }): Promise<MeetRecord[]> {
    console.log(`🔍 查询预约窗口...`);
    console.log(`📊 状态筛选: ${params.status || '全部'}`);
    console.log(`📄 数量限制: ${params.limit || '默认20'}`);
    
    let whereClause = '';
    if (params.status) {
      whereClause = `.where({MEET_STATUS: ${parseInt(params.status)}})`;
    }
    
    const limit = params.limit || 20;
    const query = `db.collection("ax_meet")${whereClause}.orderBy("MEET_ORDER", "asc").limit(${limit}).get()`;
    
    try {
      const results = await this.dbQuery(query);
      console.log(`✅ 查询到 ${results.length} 个预约窗口`);
      return results as MeetRecord[];
    } catch (error) {
      console.error(`❌ 查询预约窗口失败:`, error);
      throw new Error(`查询预约窗口失败: ${error}`);
    }
  }

  /**
   * 更新预约窗口
   */
  async updateMeetWindow(params: {
    meetId: string;
    title?: string;
    seatCount?: number;
    content?: string;
    status?: string;
  }, retryCount: number = 0): Promise<boolean> {
    console.log(`🔄 更新预约窗口...`);
    console.log(`🆔 窗口ID: ${params.meetId}`);
    if (retryCount > 0) {
      console.log(`🔄 重试次数: ${retryCount}`);
    }
    
    const updateData: any = {
      MEET_EDIT_TIME: Date.now()
    };
    
    if (params.title) updateData.MEET_TITLE = params.title;
    if (params.seatCount) updateData.MEET_SEAT_COUNT = params.seatCount;
    if (params.content) updateData.MEET_CONTENT = [{ type: 'text', content: params.content }];
    if (params.status) updateData.MEET_STATUS = parseInt(params.status);
    
    const updateFields = Object.keys(updateData).map(key => 
      `${key}: ${typeof updateData[key] === 'string' ? `"${updateData[key]}"` : updateData[key]}`
    ).join(', ');
    
    const query = `db.collection("ax_meet").where({_id: "${params.meetId}"}).update({data: {${updateFields}}})`;
    
    try {
      const modifiedCount = await this.dbUpdate(query, retryCount);
      const success = modifiedCount > 0;
      console.log(`${success ? '✅' : '❌'} 预约窗口更新${success ? '成功' : '失败'}, 影响记录数: ${modifiedCount}`);
      return success;
    } catch (error) {
      console.error(`❌ 更新预约窗口异常:`, error);
      throw new Error(`更新预约窗口失败: ${error}`);
    }
  }

  /**
   * 删除预约窗口
   */
  async deleteMeetWindow(meetId: string, retryCount: number = 0): Promise<boolean> {
    console.log(`🗑️ 删除预约窗口...`);
    console.log(`🆔 窗口ID: ${meetId}`);
    if (retryCount > 0) {
      console.log(`🔄 重试次数: ${retryCount}`);
    }
    
    const query = `db.collection("ax_meet").where({_id: "${meetId}"}).remove()`;
    
    try {
      const deletedCount = await this.dbDelete(query, retryCount);
      const success = deletedCount > 0;
      console.log(`${success ? '✅' : '❌'} 预约窗口删除${success ? '成功' : '失败'}, 删除记录数: ${deletedCount}`);
      return success;
    } catch (error) {
      console.error(`❌ 删除预约窗口异常:`, error);
      throw new Error(`删除预约窗口失败: ${error}`);
    }
  }
} 