# Admin后台数据库连通接口文档

## 概述

本文档详细说明了admin后台管理系统中"本店动态"、"菜品推荐"、"关于我们"、"联系我们"模块的数据库连通方式和接口使用方法。

## 前端数据获取方式

### 1. 本店动态和菜品推荐数据获取

**前端调用方式：**
```javascript
// 获取首页新闻列表（包含本店动态和菜品推荐）
await cloudHelper.callCloudSumbit('news/home_list', {}, opts)
```

**数据结构：**
```javascript
{
  data: [
    {
      type: 'news',
      _id: '文章ID',
      title: '文章标题',
      desc: '文章描述',
      ext: '发布时间',
      pic: '封面图片'
    }
  ]
}
```

### 2. 关于我们和联系我们数据获取

**前端调用方式：**
```javascript
// 获取所有设置信息
await cloudHelper.callCloudData('home/setup_all', {}, opts)
```

**数据结构：**
```javascript
{
  SETUP_ABOUT: '关于我们内容',
  SETUP_ABOUT_PIC: ['关于我们图片数组'],
  SETUP_ADDRESS: '联系地址',
  SETUP_PHONE: '联系电话',
  SETUP_SERVICE_PIC: ['客服二维码图片数组'],
  SETUP_OFFICE_PIC: ['官方微信二维码图片数组']
}
```

## 后台管理接口

### 1. 新闻管理（本店动态 + 菜品推荐）

#### 1.1 获取新闻列表
**接口路由：** `admin/news_list`
**方法：** `admin/admin_news_controller@getNewsList`

**请求参数：**
```javascript
{
  search: '搜索条件',
  sortType: '搜索类型',
  sortVal: '搜索值',
  orderBy: '排序方式',
  whereEx: '附加查询条件',
  page: 1,
  size: 10,
  isTotal: true
}
```

#### 1.2 新增新闻
**接口路由：** `admin/news_insert`
**方法：** `admin/admin_news_controller@insertNews`

**请求参数：**
```javascript
{
  title: '标题（必填，4-50字符）',
  cateId: '分类ID（必填）', // 1=本店动态, 2=菜品推荐
  cateName: '分类名称（必填）',
  order: '排序号（必填，1-9999）',
  desc: '简介（必填，10-200字符）',
  type: '类型（0=本地文章，1=外部链接）',
  url: '外部链接地址（type=1时必填）'
}
```

#### 1.3 编辑新闻
**接口路由：** `admin/news_edit`
**方法：** `admin/admin_news_controller@editNews`

**请求参数：**
```javascript
{
  id: '文章ID（必填）',
  title: '标题（必填，4-50字符）',
  cateId: '分类ID（必填）',
  cateName: '分类名称（必填）',
  order: '排序号（必填，1-9999）',
  desc: '简介（10-200字符）',
  type: '类型（0=本地文章，1=外部链接）',
  url: '外部链接地址（type=1时必填）'
}
```

#### 1.4 更新新闻内容
**接口路由：** `admin/news_update_content`
**方法：** `admin/admin_news_controller@updateNewsContent`

**请求参数：**
```javascript
{
  newsId: '文章ID（必填）',
  content: ['富文本内容数组']
}
```

#### 1.5 更新新闻图片
**接口路由：** `admin/news_update_pic`
**方法：** `admin/admin_news_controller@updateNewsPic`

**请求参数：**
```javascript
{
  newsId: '文章ID（必填）',
  imgList: ['图片cloudId数组']
}
```

#### 1.6 删除新闻
**接口路由：** `admin/news_del`
**方法：** `admin/admin_news_controller@delNews`

**请求参数：**
```javascript
{
  id: '文章ID（必填）'
}
```

#### 1.7 修改新闻状态
**接口路由：** `admin/news_status`
**方法：** `admin/admin_news_controller@statusNews`

**请求参数：**
```javascript
{
  id: '文章ID（必填）',
  status: '状态（0=禁用，1=启用，8=删除）'
}
```

#### 1.8 新闻排序
**接口路由：** `admin/news_sort`
**方法：** `admin/admin_news_controller@sortNews`

**请求参数：**
```javascript
{
  id: '文章ID（必填）',
  sort: '排序值'
}
```

### 2. 设置管理（关于我们 + 联系我们）

#### 2.1 关于我们设置
**接口路由：** `admin/setup_about`
**方法：** `admin/admin_setup_controller@setupAbout`

**请求参数：**
```javascript
{
  about: '关于我们内容（必填，10-50000字符）',
  aboutPic: ['介绍图片cloudId数组']
}
```

#### 2.2 联系我们设置
**接口路由：** `admin/setup_contact`
**方法：** `admin/admin_setup_controller@setupContact`

**请求参数：**
```javascript
{
  phone: '联系电话',
  address: '联系地址',
  servicePic: ['客服二维码图片cloudId数组'],
  officePic: ['官方微信二维码图片cloudId数组']
}
```

## 数据库表结构

### 1. 新闻表（ax_news）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | string | 文章ID |
| NEWS_TITLE | string | 文章标题 |
| NEWS_DESC | string | 文章描述 |
| NEWS_CATE_ID | string | 分类ID（1=本店动态，2=菜品推荐） |
| NEWS_CATE_NAME | string | 分类名称 |
| NEWS_TYPE | int | 类型（0=本地文章，1=外部链接） |
| NEWS_URL | string | 外部链接URL |
| NEWS_STATUS | int | 状态（0=禁用，1=启用，8=删除） |
| NEWS_ORDER | int | 排序号 |
| NEWS_HOME | int | 首页推荐排序 |
| NEWS_CONTENT | array | 富文本内容 |
| NEWS_PIC | array | 图片cloudId数组 |
| NEWS_VIEW_CNT | int | 访问次数 |
| NEWS_ADD_TIME | int | 创建时间戳 |
| NEWS_EDIT_TIME | int | 编辑时间戳 |

### 2. 设置表（ax_setup）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | string | 设置ID |
| SETUP_ABOUT | string | 关于我们内容 |
| SETUP_ABOUT_PIC | array | 关于我们图片cloudId数组 |
| SETUP_ADDRESS | string | 联系地址 |
| SETUP_PHONE | string | 联系电话 |
| SETUP_SERVICE_PIC | array | 客服二维码图片cloudId数组 |
| SETUP_OFFICE_PIC | array | 官方微信二维码图片cloudId数组 |
| SETUP_ADD_TIME | int | 创建时间戳 |
| SETUP_EDIT_TIME | int | 编辑时间戳 |

## 分类说明

### 新闻分类：
- **分类ID 1**：本店动态
- **分类ID 2**：菜品推荐

这样可以通过分类来区分不同类型的内容，前端可以根据需要获取特定分类的内容。

## 前后端调用示例

### 后台添加本店动态示例：
```javascript
// 后台JavaScript调用
await cloudHelper.callCloudSumbit('admin/news_insert', {
  title: '新品上市：招牌红烧肉',
  cateId: '1', // 本店动态
  cateName: '本店动态',
  order: 100,
  desc: '精选五花肉，秘制调料，传统工艺，香糯可口。',
  type: 0
}, { title: '发布中...' });
```

### 后台添加菜品推荐示例：
```javascript
// 后台JavaScript调用
await cloudHelper.callCloudSumbit('admin/news_insert', {
  title: '经典川菜：宫保鸡丁',
  cateId: '2', // 菜品推荐
  cateName: '菜品推荐',
  order: 200,
  desc: '传统川菜，酸甜可口，老少皆宜。',
  type: 0
}, { title: '发布中...' });
```

### 后台更新关于我们示例：
```javascript
// 后台JavaScript调用
await cloudHelper.callCloudSumbit('admin/setup_about', {
  about: '我们是一家专注于传统美食的餐厅...',
  aboutPic: ['cloud://xxxxx.jpg', 'cloud://yyyyy.jpg']
}, { title: '保存中...' });
```

### 后台更新联系我们示例：
```javascript
// 后台JavaScript调用
await cloudHelper.callCloudSumbit('admin/setup_contact', {
  phone: '400-123-4567',
  address: '北京市朝阳区某某路123号',
  servicePic: ['cloud://service-qr.jpg'],
  officePic: ['cloud://wechat-qr.jpg']
}, { title: '保存中...' });
```

## 注意事项

1. **数据一致性**：所有修改操作都会自动更新 `EDIT_TIME` 时间戳
2. **图片管理**：图片需要先上传到云存储获得cloudId，再保存到数据库
3. **内容审核**：新增和编辑内容会进行自动内容审核
4. **权限控制**：所有admin接口都需要管理员权限验证
5. **分类管理**：建议在前端固定分类ID（1=本店动态，2=菜品推荐）
6. **错误处理**：接口调用失败时会自动显示错误提示

## 已修复的问题

1. ✅ 修复了 `editNews` 方法中缺少实际数据库更新操作的问题
2. ✅ 统一了数据库字段名称（使用 `_id` 而不是 `NEWS_ID`）
3. ✅ 完善了设置管理的数据库操作，支持新建和更新
4. ✅ 修复了控制器中缺少 `await` 关键字的问题
5. ✅ 优化了数据库查询和更新逻辑

现在所有的数据库连通功能都已经正常工作，前端和后端的数据接口保持一致。 