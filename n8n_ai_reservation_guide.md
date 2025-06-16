# n8n AI预约管理系统 - 自然语言操作指南

## 🎯 概述

这个指南将帮助您在n8n中创建一个智能预约管理系统，使用AI和自然语言处理来管理预约记录。

## 🏗️ 系统架构

### 核心组件
1. **Chat Trigger** - 聊天触发器
2. **AI Agent** - 智能代理
3. **HTTP Request Tools** - HTTP请求工具
4. **MCP Client** (可选) - Model Context Protocol客户端

### 工作流程
```
用户输入 → Chat Trigger → AI Agent → HTTP Tools → 微信云开发API → 返回结果
```

## 🔧 环境配置

### 1. 安装MCP节点
```bash
npm install n8n-nodes-mcp
export N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true
```

### 2. Docker环境配置
```yaml
version: '3'
services:
  n8n:
    image: n8nio/n8n
    environment:
      - N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true
      - WECHAT_APP_ID=wxf76ea9bf5982dd05
      - WECHAT_APP_SECRET=4af9e95c1d4394f0b48d33b9e90d22a8
      - WECHAT_ENV_ID=cloud1-3ggfodggf223466a
      - OPENAI_API_KEY=your-openai-key
    ports:
      - "5678:5678"
```

## 📝 工作流配置

### AI代理配置
```json
{
  "systemMessage": "你是智能预约管理助手。可以帮助用户查询、修改和删除预约记录。",
  "model": "gpt-4", 
  "temperature": 0.1,
  "memory": {"maxInteractions": 10}
}
```

### HTTP工具配置

#### 查询预约工具
```json
{
  "name": "query_reservations",
  "description": "查询预约记录",
  "httpRequest": {
    "method": "POST",
    "url": "https://api.weixin.qq.com/tcb/databasequery",
    "body": {
      "env": "cloud1-3ggfodggf223466a", 
      "query": "db.collection('ax_join').orderBy('JOIN_ADD_TIME', 'desc').get()"
    }
  }
}
```

## 💬 自然语言交互示例

### 查询预约
```
用户: "查看我的预约记录"
AI: 查询成功！找到 3 条预约记录：

1. ID: JOIN123456
   项目: 会议室A预约
   日期: 2024-01-15
   时间: 09:00-10:00
   状态: 预约成功
```

### 修改预约
```
用户: "取消预约JOIN123456"  
AI: 预约状态修改成功！已取消预约JOIN123456
```

## 🚀 部署运行

```bash
# 启动n8n
export N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true
n8n start

# 访问界面
open http://localhost:5678
```

## 🤖 AI Prompt设计

### 系统提示词
```
你是一个智能预约管理助手，名叫"小约"。你的职责是帮助用户管理预约记录。

**可用工具：**
1. query_reservations - 查询预约记录
2. update_reservation - 修改预约状态  
3. delete_reservation - 删除预约记录

**操作规则：**
1. 理解用户的自然语言请求
2. 根据意图选择合适的工具
3. 友好地返回操作结果
4. 删除操作需要用户确认

**状态说明：**
- 1: 预约成功
- 10: 用户取消
- 99: 系统取消

**回复要求：**
- 使用友好的中文回复
- 结果要清晰明了
- 错误时给出建议
```

### 用户意图识别示例
```javascript
// 查询意图识别
const queryIntents = [
  "查看我的预约",
  "有哪些预约记录",
  "显示所有预约",
  "我预约了什么",
  "查询预约状态"
];

// 修改意图识别  
const updateIntents = [
  "取消预约",
  "修改预约状态", 
  "我要取消预约",
  "恢复预约",
  "更新预约"
];

// 删除意图识别
const deleteIntents = [
  "删除预约记录",
  "彻底删除预约",
  "移除预约记录"
];
```

## 🔍 高级功能

### 1. 使用MCP增强AI能力
```bash
# 安装MCP服务器
npm install -g @modelcontextprotocol/server-brave-search

# 在n8n中配置MCP客户端
{
  "node": "MCP Client",
  "server": "npx -y @modelcontextprotocol/server-brave-search",
  "tools": ["brave_web_search"],
  "description": "为AI提供实时搜索能力"
}
```

### 2. 批量操作支持
```javascript
// 批量查询用户预约
const batchQuery = {
  "tool": "query_reservations",
  "parameters": {
    "user_ids": ["user1", "user2", "user3"],
    "batch_size": 10
  }
};

// 批量状态更新
const batchUpdate = {
  "tool": "batch_update_reservations", 
  "parameters": {
    "join_ids": ["JOIN123456", "JOIN123457"],
    "new_status": 10,
    "reason": "活动取消"
  }
};
```

### 3. 智能提醒功能
```javascript
// 预约提醒工作流
{
  "trigger": "Schedule Trigger",
  "schedule": "0 9 * * *", // 每天9点
  "workflow": [
    {
      "node": "Query Today Reservations",
      "query": "SELECT * FROM ax_join WHERE JOIN_MEET_DAY = TODAY()"
    },
    {
      "node": "Send Reminder",
      "message": "您今天有预约：{{ reservation.title }} - {{ reservation.time }}"
    }
  ]
}
```

## 🛠️ 故障排除

### 常见问题

1. **Access Token过期**
```javascript
// 添加token刷新逻辑
if (response.errcode === 42001) {
  // 重新获取token
  const newToken = await getAccessToken();
  // 重试请求
}
```

2. **API限制**
```javascript
// 添加请求限制
const rateLimiter = {
  maxRequests: 100,
  timeWindow: 3600000, // 1小时
  delay: 1000 // 1秒延迟
};
```

3. **错误处理**
```javascript
// 统一错误处理
const handleError = (error) => {
  console.error('API Error:', error);
  return {
    success: false,
    message: '操作失败，请稍后重试',
    error: error.message
  };
};
```

## 📊 监控和分析

### 性能指标
- 响应时间监控
- API调用成功率
- 用户满意度评分
- 工作流执行统计

### 日志配置
```yaml
# 日志记录配置
logging:
  level: INFO
  format: JSON
  outputs:
    - console
    - file: /var/log/n8n/reservation.log
```

## 🔐 安全考虑

1. **API密钥管理**
   - 使用环境变量存储敏感信息
   - 定期轮换API密钥
   - 启用API访问日志

2. **权限控制**
   - 实现基于角色的访问控制
   - 记录所有操作日志
   - 敏感操作需要额外确认

3. **数据保护**
   - 加密传输敏感数据
   - 定期备份数据
   - 实现数据访问审计

这个指南提供了一个完整的n8n AI预约管理系统实现方案，结合了自然语言处理、HTTP API集成和智能工具使用，让用户可以通过自然语言轻松管理预约系统。 