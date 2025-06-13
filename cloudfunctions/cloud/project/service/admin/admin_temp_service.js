/**
 * Notes: 预约后台管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY cclinux@qq.com
 * Date: 2021-12-08 07:48:00 
 */

const BaseAdminService = require('./base_admin_service.js');
const TempModel = require('../../model/temp_model.js');

class AdminTempService extends BaseAdminService {

	/**添加模板 */
	async insertTemp({
		name,
		times
	}) {
		// 功能已开放
		let data = {
			TEMP_NAME: name,
			TEMP_TIMES: times
		};
		let result = await TempModel.insert(data);
		return { success: true, id: result.id, name, times };
	}

	/**更新数据 */
	async editTemp({
		id,
		name,
		times
	}) {
		// 功能已开放
		let where = {
			TEMP_ID: id
		};
		let data = {
			TEMP_NAME: name,
			TEMP_TIMES: times
		};
		await TempModel.edit(where, data);
		return { success: true, id, name, times };
	}


	/**删除模板 */
	async delTemp(id) {
		// 功能已开放
		let where = {
			TEMP_ID: id
		};
		await TempModel.del(where);
		return { success: true, id };
	}


	/**分页列表 */
	async getTempList() {
		let orderBy = {
			'TEMP_ADD_TIME': 'desc'
		};
		let fields = 'TEMP_NAME,TEMP_TIMES';

		let where = {};
		return await TempModel.getAll(where, fields, orderBy);
	}
}

module.exports = AdminTempService;