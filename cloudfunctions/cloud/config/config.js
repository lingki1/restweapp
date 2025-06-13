module.exports = {

	//### 微信小程序相关
	WECHAT_APPID: 'wxf76ea9bf5982dd05',
	WECHAT_APPSECRET: '4af9e95c1d4394f0b48d33b9e90d22a8',

	//### 环境相关 
	CLOUD_ID: 'cloud1-3ggfodggf223466a', //你的云环境id 

	ADMIN_NAME: 'admin', // 管理员账号（5-30位)
	ADMIN_PWD: '111111', // 管理员密码（5-30位) 


	// ##################################################################  
	PID: 'A00',  
	IS_DEMO: false,  

	NEWS_CATE: '1=本店动态,2=菜品推介',
	MEET_TYPE: '1=订座预约',
	// ##################################################################
	// #### 调试相关 
	TEST_MODE: false,  
	TEST_TOKEN_ID: '',

	COLLECTION_NAME: 'ax_admin|ax_cache|ax_day|ax_export|ax_join|ax_log|ax_meet|ax_news|ax_setup|ax_temp|ax_user',

	DATA_EXPORT_PATH: 'export/', //数据导出路径
	MEET_TIMEMARK_QR_PATH: 'meet/usercheckin/', //用户签到码路径 
	SETUP_PATH: 'setup/',

	// ## 缓存相关 
	IS_CACHE: true, //是否开启缓存
	CACHE_CALENDAR_TIME: 60 * 30, //日历缓存   

	// #### 内容安全
	CLIENT_CHECK_CONTENT: false, //前台图片文字是否校验
	ADMIN_CHECK_CONTENT: false, //后台图片文字是否校验    

	// #### 预约相关
	MEET_LOG_LEVEL: 'debug',

	// ### 后台业务相关
	ADMIN_LOGIN_EXPIRE: 86400, //管理员token过期时间 (秒) 
}