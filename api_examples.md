# 预约系统HTTP API使用示例

## 配置信息
- **AppID**: `wxf76ea9bf5982dd05`
- **Secret**: `4af9e95c1d4394f0b48d33b9e90d22a8`
- **云环境ID**: `cloud1-3ggfodggf223466a`

## 1. 获取Access Token

### 请求
```http
GET https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wxf76ea9bf5982dd05&secret=4af9e95c1d4394f0b48d33b9e90d22a8
```

### 响应示例
```json
{
  "access_token": "93_Q_Vz2s9Y-NOwTpjt3S9DuXp3IJl0P0Y4ae3lncfghjVLTinrBQ-G-1f7416C1AxZa96lZOtEL_UtLYsn70YxmAVtw87QahJU08Ev2AfTbCFuu1Pm-shqH1qp5xMSFNjAFAMZH",
  "expires_in": 7200
}
```

## 2. 查询预约列表

### 查询所有预约记录
```http
POST https://api.weixin.qq.com/tcb/databasequery?access_token=YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "env": "cloud1-3ggfodggf223466a",
  "query": "db.collection(\"ax_join\").orderBy(\"JOIN_ADD_TIME\", \"desc\").limit(20).get()"
}
```

### 查询特定用户的预约
```http
POST https://api.weixin.qq.com/tcb/databasequery?access_token=YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "env": "cloud1-3ggfodggf223466a",
  "query": "db.collection(\"ax_join\").where({JOIN_USER_ID: \"USER_ID_HERE\"}).orderBy(\"JOIN_ADD_TIME\", \"desc\").get()"
}
```

### 查询特定状态的预约
```http
POST https://api.weixin.qq.com/tcb/databasequery?access_token=YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "env": "cloud1-3ggfodggf223466a", 
  "query": "db.collection(\"ax_join\").where({JOIN_STATUS: 1}).orderBy(\"JOIN_ADD_TIME\", \"desc\").get()"
}
```

### 查询响应示例
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "pager": {
    "Offset": 0,
    "Limit": 20,
    "Total": 5
  },
  "data": [
    "{\"_id\":\"join123\",\"JOIN_ID\":\"JOIN123456\",\"JOIN_USER_ID\":\"user001\",\"JOIN_MEET_TITLE\":\"会议室预约\",\"JOIN_STATUS\":1,\"JOIN_MEET_DAY\":\"2024-01-15\",\"JOIN_MEET_TIME_START\":\"09:00\",\"JOIN_MEET_TIME_END\":\"10:00\"}"
  ]
}
```

## 3. 修改预约状态

### 方法一：使用文档ID更新（官方推荐）
```http
POST https://api.weixin.qq.com/tcb/databaseupdate?access_token=YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "env": "cloud1-3ggfodggf223466a",
  "query": "db.collection(\"ax_join\").doc(\"67a1b2c3d4e5f6789012345\").update({data:{JOIN_STATUS: 10, JOIN_REASON: \"用户主动取消\", JOIN_EDIT_TIME: 1704440000}})"
}
```

### 方法二：使用WHERE条件更新
```http
POST https://api.weixin.qq.com/tcb/databaseupdate?access_token=YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "env": "cloud1-3ggfodggf223466a",
  "query": "db.collection(\"ax_join\").where({JOIN_ID: \"JOIN123456\"}).update({data: {\"JOIN_STATUS\": 10, \"JOIN_REASON\": \"用户主动取消\", \"JOIN_EDIT_TIME\": 1704440000}})"
}
```

### 取消预约示例
```http
POST https://api.weixin.qq.com/tcb/databaseupdate?access_token=YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "env": "cloud1-3ggfodggf223466a",
  "query": "db.collection(\"ax_join\").doc(\"67a1b2c3d4e5f6789012345\").update({data:{JOIN_STATUS: 10, JOIN_REASON: \"用户主动取消\", JOIN_EDIT_TIME: 1704440000}})"
}
```

### 恢复预约示例
```http
POST https://api.weixin.qq.com/tcb/databaseupdate?access_token=YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "env": "cloud1-3ggfodggf223466a",
  "query": "db.collection(\"ax_join\").doc(\"67a1b2c3d4e5f6789012345\").update({data:{JOIN_STATUS: 1, JOIN_EDIT_TIME: 1704440000}})"
}
```

### 系统取消预约示例
```http
POST https://api.weixin.qq.com/tcb/databaseupdate?access_token=YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "env": "cloud1-3ggfodggf223466a",
  "query": "db.collection(\"ax_join\").doc(\"67a1b2c3d4e5f6789012345\").update({data:{JOIN_STATUS: 99, JOIN_REASON: \"系统自动取消\", JOIN_EDIT_TIME: 1704440000}})"
}
```

### 更新响应示例
```json
{
  "errcode": 0,
  "errmsg": "ok", 
  "updated": 1
}
```

## 4. 删除预约记录

### 方法一：使用文档ID删除（官方推荐）
```http
POST https://api.weixin.qq.com/tcb/databasedelete?access_token=YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "env": "cloud1-3ggfodggf223466a",
  "query": "db.collection(\"ax_join\").doc(\"67a1b2c3d4e5f6789012345\").remove()"
}
```

### 方法二：使用WHERE条件删除
```http
POST https://api.weixin.qq.com/tcb/databasedelete?access_token=YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "env": "cloud1-3ggfodggf223466a",
  "query": "db.collection(\"ax_join\").where({JOIN_ID: \"JOIN123456\"}).remove()"
}
```

### 删除响应示例
```json
{
  "errcode": 0,
  "errmsg": "ok",
  "deleted": 1
}
```

## 状态码说明

### 预约状态 (JOIN_STATUS)
- `1` - 预约成功
- `10` - 已取消  
- `99` - 系统取消

### API错误码
- `0` - 成功
- `40014` - AccessToken不合法
- `42001` - AccessToken过期
- `40097` - 请求参数错误

## 使用cURL示例

### 获取Access Token
```bash
curl "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wxf76ea9bf5982dd05&secret=4af9e95c1d4394f0b48d33b9e90d22a8"
```

### 查询预约记录
```bash
curl -X POST \
  "https://api.weixin.qq.com/tcb/databasequery?access_token=YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "env": "cloud1-3ggfodggf223466a",
    "query": "db.collection(\"ax_join\").limit(10).get()"
  }'
```

### 修改预约状态（使用文档ID）
```bash
curl -X POST \
  "https://api.weixin.qq.com/tcb/databaseupdate?access_token=YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "env": "cloud1-3ggfodggf223466a", 
    "query": "db.collection(\"ax_join\").doc(\"67a1b2c3d4e5f6789012345\").update({data:{JOIN_STATUS: 10, JOIN_EDIT_TIME: 1704440000}})"
  }'
```

### 修改预约状态（使用WHERE条件）
```bash
curl -X POST \
  "https://api.weixin.qq.com/tcb/databaseupdate?access_token=YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "env": "cloud1-3ggfodggf223466a", 
    "query": "db.collection(\"ax_join\").where({JOIN_ID: \"JOIN123456\"}).update({data: {\"JOIN_STATUS\": 10, \"JOIN_EDIT_TIME\": 1704440000}})"
  }'
```

## 重要说明

### 更新方法选择

1. **使用 `.doc(文档ID)` 方法（推荐）**
   - 性能更好，直接定位文档
   - 适用于已知文档 `_id` 的情况
   - 官方推荐的标准做法

2. **使用 `.where()` 条件方法**
   - 适用于通过业务字段查找的情况
   - 如通过 `JOIN_ID` 查找记录
   - 需要先查询获取文档ID，再进行更新

### 参数说明

- **文档ID**: 数据库记录的 `_id` 字段，如 `"67a1b2c3d4e5f6789012345"`
- **JOIN_ID**: 业务预约记录ID，如 `"JOIN123456"`
- **JOIN_STATUS**: 预约状态（1=成功，10=已取消，99=系统取消）
- **JOIN_EDIT_TIME**: 修改时间戳（Unix时间戳）

## Postman集合导入

您可以创建一个Postman集合包含以上所有请求，方便测试：

1. 创建环境变量：
   - `baseUrl`: `https://api.weixin.qq.com`
   - `appId`: `wxf76ea9bf5982dd05`
   - `appSecret`: `4af9e95c1d4394f0b48d33b9e90d22a8`
   - `envId`: `cloud1-3ggfodggf223466a`
   - `accessToken`: (通过第一个请求获取后设置)

2. 在获取Token的请求中添加Tests脚本自动设置环境变量：
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.access_token) {
        pm.environment.set("accessToken", response.access_token);
    }
}
``` 