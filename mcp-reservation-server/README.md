# 预约系统 MCP 服务器

这是一个基于 Model Context Protocol (MCP) 的微信云开发预约系统API服务器，允许AI模型安全地访问和管理预约数据。

## 功能特性

### 🔧 支持的工具

1. **query_reservations** - 查询预约记录
   - 支持按用户ID、状态、预约项目ID筛选
   - 可设置返回记录数限制
   - 返回格式化的预约信息

2. **update_reservation_status** - 更新预约状态
   - 取消预约（状态设为10）
   - 恢复预约（状态设为1）
   - 系统取消（状态设为99）
   - 可添加取消理由

3. **delete_reservation** - 删除预约记录
   - 永久删除指定预约记录
   - 不可撤销操作，需谨慎使用

### 📊 预约状态说明

- `1` - ✅ 预约成功
- `10` - ❌ 已取消
- `99` - ⚠️ 系统取消

## 安装和配置

### 1. 安装依赖

```bash
cd mcp-reservation-server
npm install
```

### 2. 配置环境变量

复制环境变量示例文件并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
WECHAT_APP_ID=你的微信小程序AppID
WECHAT_APP_SECRET=你的微信小程序Secret
WECHAT_ENV_ID=你的微信云环境ID
```

### 3. 构建项目

```bash
npm run build
```

### 4. 启动服务器

```bash
npm start
```

或开发模式：

```bash
npm run dev
```

## 在AI客户端中使用

### 配置MCP客户端

在你的AI客户端配置文件中添加这个MCP服务器：

```json
{
  "mcpServers": {
    "reservation": {
      "command": "node",
      "args": ["/path/to/mcp-reservation-server/dist/index.js"],
      "env": {
        "WECHAT_APP_ID": "你的AppID",
        "WECHAT_APP_SECRET": "你的Secret", 
        "WECHAT_ENV_ID": "你的环境ID"
      }
    }
  }
}
```

### Claude Desktop 配置示例

```json
{
  "mcpServers": {
    "reservation": {
      "command": "node",
      "args": ["C:\\path\\to\\mcp-reservation-server\\dist\\index.js"],
      "env": {
        "WECHAT_APP_ID": "wxf76ea9bf5982dd05",
        "WECHAT_APP_SECRET": "4af9e95c1d4394f0b48d33b9e90d22a8",
        "WECHAT_ENV_ID": "cloud1-3ggfodggf223466a"
      }
    }
  }
}
```

## 使用示例

### 查询预约记录

```
请查询所有状态为成功的预约记录
```

### 取消预约

```
请取消预约ID为 JOIN123456 的预约，理由是"用户主动取消"
```

### 删除预约

```
请永久删除预约ID为 JOIN123456 的记录
```

## API参考

### 微信云开发API端点

本MCP服务器使用以下微信云开发API：

- **获取Access Token**: `GET https://api.weixin.qq.com/cgi-bin/token`
- **数据库查询**: `POST https://api.weixin.qq.com/tcb/databasequery`
- **数据库更新**: `POST https://api.weixin.qq.com/tcb/databaseupdate`
- **数据库删除**: `POST https://api.weixin.qq.com/tcb/databasedelete`

### 数据库集合

- **ax_join**: 预约记录表
  - `JOIN_ID`: 预约记录ID
  - `JOIN_USER_ID`: 用户ID
  - `JOIN_MEET_ID`: 预约项目ID
  - `JOIN_MEET_TITLE`: 预约项目标题
  - `JOIN_STATUS`: 预约状态
  - `JOIN_REASON`: 取消理由
  - 其他字段...

## 安全注意事项

1. **环境变量保护**: 确保微信AppSecret等敏感信息通过环境变量设置，不要硬编码在代码中
2. **访问权限**: 确保只有受信任的AI客户端可以访问此MCP服务器
3. **操作日志**: 服务器会记录所有API调用，便于审计
4. **数据备份**: 删除操作不可撤销，建议定期备份重要数据

## 故障排除

### 常见错误

1. **AccessToken不合法 (40014)**
   - 检查AppID和AppSecret是否正确
   - 确认IP白名单设置

2. **AccessToken过期 (42001)**
   - 服务器会自动刷新token，如持续出现请检查系统时间

3. **数据库查询失败**
   - 检查云环境ID是否正确
   - 确认数据库集合是否存在

### 调试模式

设置环境变量启用调试日志：

```bash
LOG_LEVEL=debug npm start
```

## 开发

### 项目结构

```
mcp-reservation-server/
├── src/
│   ├── index.ts          # 主服务器文件
│   ├── wechat-api.ts     # 微信API客户端
│   └── types.ts          # 类型定义
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

### 构建命令

- `npm run build` - 编译TypeScript
- `npm run dev` - 开发模式运行
- `npm run clean` - 清理构建文件

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！ 