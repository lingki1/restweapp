# RestAppt 项目结构与注释

## cloudfunctions 目录

```
cloudfunctions/
└── cloud/
    ├── config/                # 配置文件目录，包含路由、业务、消息等配置
    │   ├── biz_config.js      # 业务相关配置
    │   ├── config.js          # 全局配置项
    │   ├── msg_config.js      # 消息相关配置
    │   └── route.js           # 路由配置
    ├── framework/             # 框架层，封装通用工具、核心、数据库等
    │   ├── client/            # 客户端相关（如控制器基类）
    │   │   └── controller.js  # 控制器基类，供业务继承
    │   ├── cloud/             # 云函数相关工具
    │   │   ├── cloud_base.js  # 云函数基类
    │   │   └── cloud_util.js  # 云函数工具
    │   ├── core/              # 核心功能，如错误、代码、任务等
    │   │   ├── app_code.js    # 错误码定义
    │   │   ├── app_error.js   # 错误处理
    │   │   ├── app_job.js     # 定时/异步任务
    │   │   ├── app_other.js   # 其他核心功能
    │   │   ├── app_util.js    # 核心工具
    │   │   └── application.js # 应用主入口
    │   ├── database/          # 数据库相关
    │   │   ├── db_util.js     # 数据库工具
    │   │   ├── model.js       # 数据模型基类
    │   │   └── mysql_util.js  # MySQL 工具
    │   ├── lib/               # 第三方/自定义库
    │   │   ├── faker_lib.js   # 数据生成库
    │   │   ├── http_lib.js    # HTTP 请求库
    │   │   ├── md5_lib.js     # MD5 加密库
    │   │   └── mini_lib.js    # 小型工具库
    │   ├── utils/             # 通用工具
    │   │   ├── cache_util.js  # 缓存工具
    │   │   ├── constant.js    # 常量定义
    │   │   ├── data_util.js   # 数据处理工具
    │   │   ├── log_util.js    # 日志工具
    │   │   ├── math_util.js   # 数学工具
    │   │   ├── time_util.js   # 时间工具
    │   │   └── util.js        # 基础工具
    │   └── validate/          # 数据校验
    │       ├── content_check.js # 内容校验
    │       └── data_check.js    # 数据校验
    ├── index.js               # 云函数入口
    ├── package.json           # Node.js 依赖配置
    ├── package-lock.json      # 依赖锁定
    ├── config.json            # 运行时配置
    └── project/               # 业务代码
        ├── controller/        # 控制器（接口层）
        │   ├── admin/         # 后台管理相关控制器
        │   ├── test/          # 测试相关控制器
        │   ├── base_controller.js # 控制器基类
        │   ├── check_controller.js # 校验相关
        │   ├── home_controller.js  # 首页相关
        │   ├── meet_controller.js  # 预约相关
        │   ├── my_controller.js    # 我的相关
        │   ├── news_controller.js  # 新闻相关
        │   └── passport_controller.js # 登录/认证相关
        ├── model/             # 数据模型（数据库表结构与操作）
        └── service/           # 业务服务层
            ├── admin/         # 后台管理相关服务
            ├── base_service.js # 基础服务
            ├── data_service.js # 数据服务
            ├── home_service.js # 首页服务
            ├── meet_service.js # 预约服务
            ├── news_service.js # 新闻服务
            └── passport_service.js # 登录/认证服务
```

## miniprogram 目录

```
miniprogram/
├── app.js                # 小程序主入口 JS
├── app.json              # 小程序全局配置
├── app.wxss              # 小程序全局样式
├── sitemap.json          # 小程序页面地图
├── behavior/             # 页面行为逻辑（Behavior）
├── biz/                  # 业务逻辑 JS
├── cmpts/                # 组件（公共、业务、库）
├── helper/               # 辅助工具 JS
├── images/               # 图片资源
├── lib/                  # 工具库
├── pages/                # 页面目录
│   └── admin/            # 后台管理相关页面
│       └── ...           # 各子模块页面
├── projects/             # 项目模板（如A00）
│   └── A00/              # 示例项目A00
│       ├── about/        # 关于页面
│       ├── calendar/     # 日历页面
│       ├── default/      # 默认首页
│       ├── meet/         # 预约相关页面
│       ├── my/           # 我的相关页面
│       ├── news/         # 新闻相关页面
│       ├── search/       # 搜索页面
│       └── skin/         # 皮肤/主题
├── setting/              # 设置相关
├── style/                # 样式文件
│   ├── comm/             # 公共样式
│   └── project/          # 项目样式
└── tpls/                 # WXML模板
    ├── project/          # 项目模板
    ├── public/           # 公共模板
    └── wxs/              # WXS 脚本
```

---

> 以上结构及注释涵盖了 cloudfunctions 和 miniprogram 目录下的主要文件和目录，便于快速了解各部分作用。如需进一步了解某个文件/模块，请告知！ 