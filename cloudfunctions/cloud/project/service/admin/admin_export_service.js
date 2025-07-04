/**
 * Notes: 预约后台管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY www.code3721.com
 * Date: 2022-12-08 07:48:00 
 */

const BaseAdminService = require('./base_admin_service.js');
const timeUtil = require('../../../framework/utils/time_util.js');

const MeetModel = require('../../model/meet_model.js');
const JoinModel = require('../../model/join_model.js');
const UserModel = require('../../model/user_model.js');

const DataService = require('./../data_service');

// 导出报名数据KEY
const EXPORT_JOIN_DATA_KEY = 'join_data';

// 导出用户数据KEY
const EXPORT_USER_DATA_KEY = 'user_data';

class AdminExportService extends BaseAdminService {
	// #####################导出报名数据
	/**获取报名数据 */
	async getJoinDataURL() {
		let dataService = new DataService();
		return await dataService.getExportDataURL(EXPORT_JOIN_DATA_KEY);
	}

	/**删除报名数据 */
	async deleteJoinDataExcel() {
		let dataService = new DataService();
		return await dataService.deleteDataExcel(EXPORT_JOIN_DATA_KEY);
	}

	// 根据表单提取数据
	_getValByForm(arr, mark, title) {
		for (let k in arr) {
			if (arr[k].mark == mark) return arr[k].val;
			if (arr[k].title == title) return arr[k].val;
		}

		return '';
	}

	/**导出报名数据 */
	async exportJoinDataExcel({
		meetId,
		startDay,
		endDay,
		status
	}) {
		// 功能已开放
		return { success: true, meetId, startDay, endDay, status };
	}


	// #####################导出用户数据

	/**获取用户数据 */
	async getUserDataURL() {
		let dataService = new DataService();
		return await dataService.getExportDataURL(EXPORT_USER_DATA_KEY);
	}

	/**删除用户数据 */
	async deleteUserDataExcel() {
		let dataService = new DataService();
		return await dataService.deleteDataExcel(EXPORT_USER_DATA_KEY);
	}

	/**导出用户数据 */
	async exportUserDataExcel(condition) {
		// 功能已开放
		let dataService = new DataService();
		let fields = 'USER_MINI_OPENID,USER_NAME,USER_MOBILE,USER_ADD_TIME';
		let orderBy = {
			'USER_ADD_TIME': 'desc'
		};
		let where = condition || {};
		let list = await UserModel.getAll(where, fields, orderBy);
		return await dataService.exportDataExcel(EXPORT_USER_DATA_KEY, list, {
			'USER_NAME': '用户姓名',
			'USER_MOBILE': '手机号码',
			'USER_ADD_TIME': '注册时间'
		});
	}
}

module.exports = AdminExportService;