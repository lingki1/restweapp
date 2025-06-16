/**
 * Notes: 路由配置文件
 * User: CC
 * Date: 2020-10-14 07:00:00
 */

module.exports = { 
	'home/setup_all': 'home_controller@getSetupAll', //获取全局配置(所有)

	'passport/phone': 'passport_controller@getPhone',
	'passport/my_detail': 'passport_controller@getMyDetail',
	'passport/edit_base': 'passport_controller@editBase',
	'passport/wx_login': 'passport_controller@wxLogin',

	'news/list': 'news_controller@getNewsList',
	'news/home_list': 'news_controller@getHomeNewsList',
	'news/view': 'news_controller@viewNews', 

	'meet/list': 'meet_controller@getMeetList',
	'meet/list_by_day': 'meet_controller@getMeetListByDay',
	'meet/list_has_day': 'meet_controller@getHasDaysFromDay',
	'meet/view': 'meet_controller@viewMeet',
	'meet/detail_for_join': 'meet_controller@detailForJoin',
	'meet/before_join': 'meet_controller@beforeJoin',
	'meet/join': 'meet_controller@join',
	'meet/get_reserved_seats': 'meet_controller@getReservedSeats',

	'my/my_join_list': 'meet_controller@getMyJoinList',
	'my/my_join_cancel': 'meet_controller@cancelMyJoin',
	'my/my_join_detail': 'meet_controller@getMyJoinDetail',
	'my/my_join_someday': 'meet_controller@getMyJoinSomeday',
	'my/my_join_checkin': 'meet_controller@userSelfCheckin', 

	'test/test': 'test/test_controller@test',
	'test/meet_test_join': 'test/test_meet_controller@testJoin',

	//***########### ADMIN ################## */  
	'admin/login': 'admin/admin_home_controller@adminLogin',
	'admin/home': 'admin/admin_home_controller@adminHome',
	'admin/clear_cache': 'admin/admin_home_controller@clearCache',

	'admin/setup_about': 'admin/admin_setup_controller@setupAbout',
	'admin/setup_contact': 'admin/admin_setup_controller@setupContact', 
	'admin/setup_qr': 'admin/admin_setup_controller@genMiniQr', 

	'admin/news_list': 'admin/admin_news_controller@getNewsList',
	'admin/news_insert': 'admin/admin_news_controller@insertNews',
	'admin/news_detail': 'admin/admin_news_controller@getNewsDetail',
	'admin/news_edit': 'admin/admin_news_controller@editNews',
	'admin/news_update_pic': 'admin/admin_news_controller@updateNewsPic',
	'admin/news_update_content': 'admin/admin_news_controller@updateNewsContent',
	'admin/news_del': 'admin/admin_news_controller@delNews', 
	'admin/news_sort': 'admin/admin_news_controller@sortNews',
	'admin/news_status': 'admin/admin_news_controller@statusNews',

	'admin/meet_list': 'admin/admin_meet_controller@getMeetList',
	'admin/meet_join_list': 'admin/admin_meet_controller@getJoinList',
	'admin/join_status': 'admin/admin_meet_controller@statusJoin',
	'admin/join_del': 'admin/admin_meet_controller@delJoin',
	'admin/meet_insert': 'admin/admin_meet_controller@insertMeet',
	'admin/meet_detail': 'admin/admin_meet_controller@getMeetDetail',
	'admin/meet_edit': 'admin/admin_meet_controller@editMeet',
	'admin/meet_del': 'admin/admin_meet_controller@delMeet',
	'admin/meet_update_content': 'admin/admin_meet_controller@updateMeetContent',
	'admin/meet_update_style': 'admin/admin_meet_controller@updateMeetStyleSet',
	'admin/meet_sort': 'admin/admin_meet_controller@sortMeet',
	'admin/meet_status': 'admin/admin_meet_controller@statusMeet',
	'admin/meet_cancel_time_join': 'admin/admin_meet_controller@cancelJoinByTimeMark',
	'admin/join_scan': 'admin/admin_meet_controller@scanJoin',
	'admin/join_checkin': 'admin/admin_meet_controller@checkinJoin',
	'admin/self_checkin_qr': 'admin/admin_meet_controller@genSelfCheckinQr',
	'admin/meet_day_list': 'admin/admin_meet_controller@getDayList',

	'admin/join_data_get': 'admin/admin_export_controller@joinDataGet',
	'admin/join_data_export': 'admin/admin_export_controller@joinDataExport',
	'admin/join_data_del': 'admin/admin_export_controller@joinDataDel',

	'admin/temp_insert': 'admin/admin_meet_controller@insertTemp',
	'admin/temp_list': 'admin/admin_meet_controller@getTempList',
	'admin/temp_del': 'admin/admin_meet_controller@delTemp',
	'admin/temp_edit': 'admin/admin_meet_controller@editTemp', 

	'admin/log_list': 'admin/admin_mgr_controller@getLogList',

	'admin/user_list': 'admin/admin_user_controller@getUserList',
	'admin/user_detail': 'admin/admin_user_controller@getUserDetail',
	'admin/user_del': 'admin/admin_user_controller@delUser',  

	'admin/user_data_get': 'admin/admin_export_controller@userDataGet',
	'admin/user_data_export': 'admin/admin_export_controller@userDataExport',
	'admin/user_data_del': 'admin/admin_export_controller@userDataDel',


}