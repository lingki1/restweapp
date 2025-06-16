# 预约系统n8n工作流工具

## 项目简介

这是一个基于n8n工作流和微信云开发的预约系统AI助手，可以通过自然语言与用户交互，实现预约查询、修改、删除等操作。

## 文件结构

```
├── reservation_tools.py          # Python工具类 - 基于微信云开发API
├── system_prompt.md              # AI系统提示词 - 教AI如何使用工具
├── n8n_workflow_config.md        # n8n工作流配置指南
├── 预约系统数据库接口文档.md      # 数据库API接口文档
└── README.md                     # 使用说明文档
```

## 项目配置信息

### 微信小程序配置
- **AppID**: `wxf76ea9bf5982dd05`
- **云开发环境ID**: `cloud1-3ggfodggf223466a`
- **API基础URL**: `https://api.weixin.qq.com/tcb`

## 快速开始

### 1. 环境准备

#### 安装依赖
```bash
pip install requests python-dateutil typing-extensions
```

#### 配置环境变量
```bash
export WECHAT_APP_ID="wxf76ea9bf5982dd05"
export WECHAT_ENV_ID="cloud1-3ggfodggf223466a"
export WECHAT_ACCESS_TOKEN="你的微信访问令牌"
export OPENAI_API_KEY="你的OpenAI API密钥"
```

### 2. n8n配置

#### 安装n8n
```bash
npm install -g n8n
```

#### 启动n8n
```bash
n8n start
```

#### 配置工作流
1. 导入 `n8n_workflow_config.md` 中的工作流配置
2. 设置AI Agent节点，使用 `system_prompt.md` 的内容作为系统提示词
3. 配置Python Code节点，导入 `reservation_tools.py`
4. 设置Webhook触发器

### 3. 功能使用

#### 查询预约
```bash
curl -X POST http://localhost:5678/webhook/reservation/query \
  -H "Content-Type: application/json" \
  -d '{
    "user_message": "查看我今天的预约",
    "user_id": "user123",
    "access_token": "your-access-token"
  }'
```

#### 取消预约
```bash
curl -X POST http://localhost:5678/webhook/reservation/manage \
  -H "Content-Type: application/json" \
  -d '{
    "user_message": "取消预约编号ABC123",
    "user_id": "user123",
    "user_role": "user",
    "access_token": "your-access-token"
  }'
```

#### 管理员操作
```bash
curl -X POST http://localhost:5678/webhook/reservation/manage \
  -H "Content-Type: application/json" \
  -d '{
    "user_message": "查看会议室A今天的预约情况",
    "user_id": "admin123",
    "user_role": "admin",
    "admin_name": "管理员张三",
    "access_token": "your-access-token"
  }'
```

## 功能特性

### 用户功能
- ✅ 查询我的预约列表
- ✅ 获取预约详情
- ✅ 按日期查询预约
- ✅ 搜索预约记录
- ✅ 取消我的预约

### 管理员功能
- ✅ 查询所有预约记录
- ✅ 修改预约状态
- ✅ 删除预约记录
- ✅ 批量取消时段预约
- ✅ 获取预约统计信息

### AI交互
- ✅ 自然语言理解
- ✅ 智能参数提取
- ✅ 友好的错误提示
- ✅ 格式化输出结果

### 微信云开发集成
- ✅ 直接对接微信云数据库
- ✅ 使用MongoDB查询语法
- ✅ 支持复杂查询条件
- ✅ 自动处理认证和环境配置

## 支持的操作示例

### 查询类操作
- "查看我的预约"
- "今天有什么预约"
- "查询会议室A的预约情况"
- "搜索包含'会议'的预约"

### 管理类操作
- "取消预约编号ABC123"
- "修改预约状态为已取消"
- "删除预约记录"
- "批量取消上午的预约"

### 统计类操作
- "今天的预约统计"
- "会议室使用情况"
- "预约成功率统计"

## API接口说明

### 状态码
- **预约状态**: 1=预约成功, 10=已取消, 99=系统取消
- **项目状态**: 0=未启用, 1=使用中, 9=停止预约, 10=已关闭

### 主要字段
- `_id`: 数据库文档ID
- `JOIN_ID`: 预约记录ID
- `JOIN_CODE`: 预约编号（15位验证码）
- `JOIN_USER_ID`: 用户ID
- `JOIN_MEET_TITLE`: 项目名称
- `JOIN_MEET_DAY`: 预约日期
- `JOIN_SEATS`: 座位号数组
- `JOIN_STATUS`: 预约状态

### 微信云开发API响应
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "data": [...],
  "pager": {
    "Total": 总数量,
    "Offset": 偏移量,
    "Limit": 限制数量
  }
}
```

## 错误处理

### 常见错误
1. **认证错误**: access_token无效或过期
2. **参数错误**: 确保必需参数完整
3. **权限错误**: 验证用户角色权限
4. **业务错误**: 检查预约状态和规则
5. **微信API错误**: 检查errcode和errmsg

### 微信API错误码
- `40001`: access_token无效
- `40002`: 不合法的凭证类型
- `41001`: 缺少access_token参数
- `42001`: access_token超时
- `45009`: 接口调用超过限制

### 调试建议
1. 查看n8n执行日志
2. 检查Python工具返回结果
3. 验证微信云开发API连通性
4. 测试AI提示词效果
5. 检查access_token有效性

## 部署建议

### 生产环境
1. 使用HTTPS协议
2. 配置负载均衡
3. 设置监控告警
4. 定期备份数据
5. 定期刷新access_token

### 安全措施
1. Access_token定期轮换
2. API访问限制
3. 日志脱敏处理
4. 权限最小化原则
5. 数据库访问控制

## 扩展开发

### 添加新功能
1. 在 `reservation_tools.py` 中添加新方法
2. 更新 `system_prompt.md` 提示词
3. 修改n8n工作流配置
4. 添加测试用例

### 自定义配置
1. 修改微信云开发环境
2. 调整AI模型参数
3. 定制响应格式
4. 增加业务规则

## 常见问题

### Q: 如何获取微信access_token？
A: 使用微信公众平台的接口凭证，通过appid和secret获取，注意定期刷新。

### Q: 如何处理微信API调用限制？
A: 合理控制调用频率，使用缓存机制，避免短时间内大量请求。

### Q: 如何优化数据库查询性能？
A: 建立合适的索引，使用分页查询，避免全表扫描。

### Q: 如何处理并发预约冲突？
A: 使用数据库事务，实现乐观锁或悲观锁机制。

### Q: 如何监控工作流运行状态？
A: 配置n8n的webhook监控和日志输出，结合外部监控系统使用。

## 技术支持

如有问题请参考：
1. [n8n官方文档](https://docs.n8n.io/)
2. [OpenAI API文档](https://platform.openai.com/docs)
3. [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloud/reference-http-api/database/)
4. [微信公众平台技术文档](https://developers.weixin.qq.com/doc/)

## 许可证

本项目仅供学习和参考使用，请遵循相关开源协议。

## 功能介绍 
    
客户可以在小程序内进行卡座/包厢（不同规格大小）的订座服务，可进行小沙发卡座、大沙发卡座、多人桌、包间桌等各种类型的订座，同时完成不同时间段的预约， 前后端完整代码包括餐厅动态，菜品推介，新菜上市，预约订座，我的今日订座，后台订座管理与时段设置，订座名单查看与导出Excel，客户资料登记管理等功能，采用腾讯提供的小程序云开发解决方案，无须服务器和域名

- 订座管理：开始/截止时间/人数均可灵活设置，可以自定义客户预约填写的数据项
- 订座凭证：支持线下到场后校验签到/核销/二维码自助签到等多种方式
- 详尽的订座预约数据：支持预约名单数据导出Excel，打印

![image](https://user-images.githubusercontent.com/96903743/166129980-21d1e125-10e8-4460-890b-8166441ab809.png)

## 技术运用
- 本项目使用微信小程序平台进行开发。
- 使用腾讯专门的小程序云开发技术，云资源包含云函数，数据库，带宽，存储空间，定时器等，资源配额价格低廉，无需域名和服务器即可搭建。
- 小程序本身的即用即走，适合小工具的使用场景，也适合快速开发迭代。
- 云开发技术采用腾讯内部链路，没有被黑客攻击的风险，安全性高且免维护。
- 资源承载力可根据业务发展需要随时弹性扩展。  



## 作者
- 如有疑问，欢迎骚扰联系我鸭：开发交流，技术分享，问题答疑，功能建议收集，版本更新通知，安装部署协助，小程序开发定制等。
- 俺的微信:
 

![image](https://user-images.githubusercontent.com/96903743/166129985-03b88086-b45b-433e-8aac-940952c6a776.png)


## 演示

![image](https://user-images.githubusercontent.com/96903743/166129982-1b564a70-015e-4b38-9518-e0ea44f78379.png)
 
 
 

## 安装

- 安装手册见源码包里的word文档




## 截图
 ![image](https://user-images.githubusercontent.com/96903743/166129987-68b55d0e-4338-4571-99b9-a6b8ad6ebdee.png)
![image](https://user-images.githubusercontent.com/96903743/166129993-14a1035f-d343-4d8d-bde6-531c023c9e47.png)
![image](https://user-images.githubusercontent.com/96903743/166129995-7644f503-5a67-4716-8a0e-f12c5e2eecec.png)
![image](https://user-images.githubusercontent.com/96903743/166129996-d48392ec-3845-415c-9bb4-af5036d00931.png)
![image](https://user-images.githubusercontent.com/96903743/166129998-9d64c67f-7109-4211-87c9-c499de84b163.png)
![image](https://user-images.githubusercontent.com/96903743/166130000-93b143fb-1b93-4050-8387-f629ea217424.png)
![image](https://user-images.githubusercontent.com/96903743/166130001-253b8260-c76a-4df2-a4d8-611ec1a3126e.png)
![image](https://user-images.githubusercontent.com/96903743/166130003-20dd6c12-3caa-4fa8-9c1f-6c22e97357e3.png)
![image](https://user-images.githubusercontent.com/96903743/166130004-7708e814-4504-40b4-90ca-86ee9946b61e.png)



## 后台管理系统截图
 ![image](https://user-images.githubusercontent.com/96903743/166130005-0b54cd2d-46f3-49b5-857c-6d8f610ddf83.png)
![image](https://user-images.githubusercontent.com/96903743/166130007-8c52d72c-6c4a-4ae8-b97c-04e1e4a26a36.png)
![image](https://user-images.githubusercontent.com/96903743/166130009-8f0dd9a4-3d62-40ff-8336-255dc18efc20.png)
![image](https://user-images.githubusercontent.com/96903743/166130012-779ad7b7-5177-4101-b08c-8feaf5cc9d1c.png)
![image](https://user-images.githubusercontent.com/96903743/166130017-dd783ed8-f1ec-49a0-b35f-3616e0aaf574.png)
![image](https://user-images.githubusercontent.com/96903743/166130020-13ab503f-dbd6-4c85-aec0-2f69f349c002.png)
![image](https://user-images.githubusercontent.com/96903743/166130022-d8877e5b-2dbb-4f54-9a15-d9430a9ef4a6.png)
![image](https://user-images.githubusercontent.com/96903743/166130026-9c686658-a527-4279-8c0a-fb3e55c11f84.png)
![image](https://user-images.githubusercontent.com/96903743/166130028-c92c857e-7e51-4015-bc6c-5709d23aed3d.png)


