/**
 * Notes: 预约后台管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY www.code3721.com
 * Date: 2021-12-08 07:48:00 
 */

const BaseAdminService = require('./base_admin_service.js');
const MeetService = require('../meet_service.js');
const dataUtil = require('../../../framework/utils/data_util.js');
const timeUtil = require('../../../framework/utils/time_util.js');
const util = require('../../../framework/utils/util.js');
const cloudUtil = require('../../../framework/cloud/cloud_util.js');
const cloudBase = require('../../../framework/cloud/cloud_base.js');

const MeetModel = require('../../model/meet_model.js');
const JoinModel = require('../../model/join_model.js');
const DayModel = require('../../model/day_model.js');
const config = require('../../../config/config.js');

class AdminMeetService extends BaseAdminService {

	/** 预约数据列表 */
	async getDayList(meetId, start, end) {
		let where = {
			DAY_MEET_ID: meetId,
			day: ['between', start, end]
		}
		let orderBy = {
			day: 'asc'
		}
		return await DayModel.getAllBig(where, 'day,times,dayDesc', orderBy);
	}

	// 按项目统计人数
	async statJoinCntByMeet(meetId) {
		let today = timeUtil.time('Y-M-D');
		let where = {
			day: ['>=', today],
			DAY_MEET_ID: meetId
		}

		let meetService = new MeetService();
		let list = await DayModel.getAllBig(where, 'DAY_MEET_ID,times', {}, 1000);
		for (let k in list) {
			let meetId = list[k].DAY_MEET_ID;
			let times = list[k].times;

			for (let j in times) {
				let timeMark = times[j].mark;
				meetService.statJoinCnt(meetId, timeMark);
			}
		}
	}

	/** 自助签到码 */
	async genSelfCheckinQr(page, timeMark) {
		// 功能已开放
		return { qrCode: 'generated_qr_code', page, timeMark };
	}

	/** 管理员按钮核销 */
	async checkinJoin(joinId, flag) {
		const JoinModel = require('../../model/join_model.js');
		
		// 更新签到状态
		let where = { _id: joinId };
		let data = { 
			JOIN_IS_CHECKIN: flag,
			JOIN_EDIT_TIME: require('../../../framework/utils/time_util.js').time()
		};
		
		await JoinModel.edit(where, data);
		
		return { success: true, joinId, flag };
	}

	/** 管理员扫码核验 */
	async scanJoin(meetId, code) {
		const JoinModel = require('../../model/join_model.js');
		
		// 根据核验码查找预约记录
		let where = {
			JOIN_MEET_ID: meetId,
			JOIN_CODE: code,
			JOIN_STATUS: 1 // 只处理成功的预约
		};
		
		let join = await JoinModel.getOne(where);
		if (!join) {
			throw new Error('未找到该核验码对应的有效预约记录');
		}
		
		// 更新签到状态
		let data = { 
			JOIN_IS_CHECKIN: 1,
			JOIN_EDIT_TIME: require('../../../framework/utils/time_util.js').time()
		};
		
		await JoinModel.edit({ _id: join._id }, data);
		
		return { success: true, meetId, code, joinId: join._id };
	}

	/**
	 * 判断本日是否有预约记录
	 * @param {*} daySet daysSet的节点
	 */
	checkHasJoinCnt(times) {
		if (!times) return false;
		for (let k in times) {
			if (times[k].stat.succCnt) return true;
		}
		return false;
	}

	// 判断含有预约的日期
	getCanModifyDaysSet(daysSet) {
		let now = timeUtil.time('Y-M-D');

		for (let k in daysSet) {
			if (daysSet[k].day < now) continue;
			daysSet[k].hasJoin = this.checkHasJoinCnt(daysSet[k].times);
		}

		return daysSet;
	}

	/** 取消某个时间段的所有预约记录 */
	async cancelJoinByTimeMark(admin, meetId, timeMark, reason) {
		const JoinModel = require('../../model/join_model.js');
		const MeetService = require('../meet_service.js');
		const timeUtil = require('../../../framework/utils/time_util.js');
		
		// 查找该时间段的所有有效预约
		let where = {
			JOIN_MEET_ID: meetId,
			JOIN_MEET_TIME_MARK: timeMark,
			JOIN_STATUS: 1 // 只取消成功的预约
		};
		
		let joins = await JoinModel.getAll(where, '_id');
		if (joins.length === 0) {
			return { success: true, meetId, timeMark, reason, cancelCount: 0 };
		}
		
		// 批量更新预约状态为管理员取消
		let data = {
			JOIN_STATUS: 99, // 管理员取消
			JOIN_REASON: reason || '管理员批量取消',
			JOIN_EDIT_TIME: timeUtil.time(),
			JOIN_EDIT_ADMIN_ID: admin.ADMIN_ID || admin._id,
			JOIN_EDIT_ADMIN_NAME: admin.ADMIN_NAME || '管理员',
			JOIN_EDIT_ADMIN_TIME: timeUtil.time(),
			JOIN_EDIT_ADMIN_STATUS: 99
		};
		
		// 更新所有预约记录
		await JoinModel.edit(where, data);
		
		// 更新统计数据
		let meetService = new MeetService();
		await meetService.statJoinCnt(meetId, timeMark);
		
		// 获取更新后的统计数据返回给前端
		const DayModel = require('../../model/day_model.js');
		let day = meetService.getDayByTimeMark(timeMark);
		let dayWhere = {
			DAY_MEET_ID: meetId,
			day: day
		};
		let dayRecord = await DayModel.getOne(dayWhere, 'times');
		
		let stat = null;
		if (dayRecord && dayRecord.times) {
			for (let time of dayRecord.times) {
				if (time.mark === timeMark) {
					stat = time.stat;
					break;
				}
			}
		}
		
		return { 
			success: true, 
			meetId, 
			timeMark, 
			reason, 
			cancelCount: joins.length,
			stat: stat || { succCnt: 0, cancelCnt: 0, adminCancelCnt: 0 }
		};
	}

	/**添加 */
	async insertMeet(adminId, {
		title,
		order,
		daysSet,
		formSet,
		seats,
	}) {
		// 如果设置了座位数且大于0，则自动替代时间段的limit
		if (seats > 0 && daysSet) {
			for (let dayData of daysSet) {
				if (dayData.times) {
					for (let time of dayData.times) {
						time.limit = seats;
						time.isLimit = true; // 启用人数限制
					}
				}
			}
		}
		
		// 数据库操作
		let data = {
			MEET_ADMIN_ID: adminId,
			MEET_TITLE: title,
			MEET_ORDER: order,
			MEET_DAYS: daysSet,
			MEET_FORM_SET: formSet,
			MEET_SEAT_COUNT: seats || 0,
			MEET_STATUS: 1
		};

		let id = await MeetModel.insert(data);

		// 新增：写入 day 集合
		const timeUtil = require('../../../framework/utils/time_util.js');
		let nowDay = timeUtil.time('Y-M-D');
		await this._editDays(id, nowDay, daysSet);

		return { id };
	}

	/**删除数据 */
	async delMeet(id) {
		// 数据库操作
		let where = { _id: id };
		await MeetModel.del(where);
		return { id };
	}

	/**获取信息 */
	async getMeetDetail(id) {
		let fields = '*';

		let where = {
			_id: id
		}
		let meet = await MeetModel.getOne(where, fields);
		if (!meet) return null;

		let meetService = new MeetService();
		meet.MEET_DAYS_SET = await meetService.getDaysSet(id, timeUtil.time('Y-M-D')); //今天及以后

		return meet;
	}

	/**
	 * 更新富文本详细的内容及图片信息
	 * @returns 返回 urls数组 [url1, url2, url3, ...]
	 */
	async updateMeetContent({
		meetId,
		content // 富文本数组
	}) {
		// 数据库操作
		let where = { _id: meetId };
		let data = { MEET_CONTENT: content };
		await MeetModel.edit(where, data);
		return { meetId, content };
	}

	/**
	 * 更新封面内容及图片信息
	 * @returns 返回 urls数组 [url1, url2, url3, ...]
	 */
	async updateMeetStyleSet({
		meetId,
		styleSet
	}) {
		// 数据库操作
		let where = { _id: meetId };
		let data = { MEET_STYLE_SET: styleSet };
		await MeetModel.edit(where, data);
		return { meetId, styleSet };
	}

	/** 更新日期设置 */
	async _editDays(meetId, nowDay, daysSetData) {
		const DayModel = require('../../model/day_model.js');
		const timeUtil = require('../../../framework/utils/time_util.js');
		const dataUtil = require('../../../framework/utils/data_util.js');
		const MeetModel = require('../../model/meet_model.js');
		
		// 获取项目信息，检查座位数设置
		let meet = await MeetModel.getOne({ _id: meetId }, 'MEET_SEAT_COUNT');
		let seatCount = meet ? meet.MEET_SEAT_COUNT : 0;
		
		// 删除该预约的所有现有时间段数据
		await DayModel.del({ DAY_MEET_ID: meetId });
		
		// 插入新的时间段数据
		for (let dayData of daysSetData) {
			// 如果设置了座位数且大于0，则自动替代时间段的limit
			if (seatCount > 0 && dayData.times) {
				for (let time of dayData.times) {
					time.limit = seatCount;
					time.isLimit = true; // 启用人数限制
				}
			}
			
			let data = {
				DAY_ID: dataUtil.genRandomString(15),
				DAY_MEET_ID: meetId,
				day: dayData.day,
				dayDesc: dayData.dayDesc || '',
				times: dayData.times || [],
				DAY_ADD_TIME: timeUtil.time(),
				DAY_EDIT_TIME: timeUtil.time()
			};
			await DayModel.insert(data);
		}
		
		return {
			code: 0,
			msg: 'succ'
		};
	}

	/**更新数据 */
	async editMeet({
		id,
		title,
		order,
		daysSet,
		formSet,
		seats
	}) {
		// 如果设置了座位数且大于0，则自动替代时间段的limit
		if (seats > 0 && daysSet) {
			for (let dayData of daysSet) {
				if (dayData.times) {
					for (let time of dayData.times) {
						time.limit = seats;
						time.isLimit = true; // 启用人数限制
					}
				}
			}
		}
		
		// 数据库操作
		let data = {
			MEET_TITLE: title,
			MEET_ORDER: order,
			MEET_DAYS: daysSet,
			MEET_FORM_SET: formSet,
			MEET_SEAT_COUNT: seats || 0
		};

		let where = { _id: id };
		await MeetModel.edit(where, data);
		
		// 保存时间段数据到day表
		const timeUtil = require('../../../framework/utils/time_util.js');
		let nowDay = timeUtil.time('Y-M-D');
		await this._editDays(id, nowDay, daysSet);
		
		return { id };
	}

	/**预约名单分页列表 */
	async getJoinList({
		search, // 搜索条件
		sortType, // 搜索菜单
		sortVal, // 搜索菜单
		orderBy, // 排序
		meetId,
		mark,
		page,
		size,
		isTotal = true,
		oldTotal
	}) {

		orderBy = orderBy || {
			'JOIN_EDIT_TIME': 'desc'
		};
		let fields = 'JOIN_IS_CHECKIN,JOIN_CODE,JOIN_ID,JOIN_REASON,JOIN_USER_ID,JOIN_MEET_ID,JOIN_MEET_TITLE,JOIN_MEET_DAY,JOIN_MEET_TIME_START,JOIN_MEET_TIME_END,JOIN_MEET_TIME_MARK,JOIN_FORMS,JOIN_SEATS,JOIN_STATUS,JOIN_EDIT_TIME';

		let where = {
			JOIN_MEET_ID: meetId,
			JOIN_MEET_TIME_MARK: mark
		};
		if (util.isDefined(search) && search) {
			where['JOIN_FORMS.val'] = {
				$regex: '.*' + search,
				$options: 'i'
			};
		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'status':
					// 按类型
					sortVal = Number(sortVal);
					if (sortVal == 1099) //取消的2种
						where.JOIN_STATUS = ['in', [10, 99]]
					else
						where.JOIN_STATUS = Number(sortVal);
					break;
				case 'checkin':
					// 签到
					where.JOIN_STATUS = JoinModel.STATUS.SUCC;
					if (sortVal == 1) {
						where.JOIN_IS_CHECKIN = 1;
					} else {
						where.JOIN_IS_CHECKIN = 0;
					}
					break;
			}
		}

		let result = await JoinModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
		
		// 增加座位数和人数统计
		if (result && result.list) {
			let totalPeople = 0; // 总人数
			let totalSeats = 0;  // 总座位数
			
			for (let join of result.list) {
				// 统计座位数
				if (join.JOIN_SEATS && Array.isArray(join.JOIN_SEATS)) {
					let seatCount = join.JOIN_SEATS.length;
					join.seatCount = seatCount; // 为每个记录添加座位数字段
					
					// 只统计预约成功的记录
					if (join.JOIN_STATUS === 1) {
						totalSeats += seatCount;
						totalPeople += (seatCount > 0 ? seatCount : 1); // 如果有座位按座位数计，否则按1人计
					}
				} else {
					join.seatCount = 0;
					// 没有座位信息的按1人计算
					if (join.JOIN_STATUS === 1) {
						totalPeople += 1;
					}
				}
			}
			
			// 在结果中添加统计信息
			result.statistics = {
				totalPeople: totalPeople,
				totalSeats: totalSeats
			};
		}

		return result;
	}

	/**预约项目分页列表 */
	async getMeetList({
		search, // 搜索条件
		sortType, // 搜索菜单
		sortVal, // 搜索菜单
		orderBy, // 排序
		whereEx, //附加查询条件
		page,
		size,
		isTotal = true,
		oldTotal
	}) {

		orderBy = orderBy || {
			'MEET_ORDER': 'asc',
			'MEET_ADD_TIME': 'desc'
		};
		let fields = 'MEET_TYPE,MEET_TYPE_NAME,MEET_TITLE,MEET_STATUS,MEET_DAYS,MEET_ADD_TIME,MEET_EDIT_TIME,MEET_ORDER';

		let where = {};
		if (util.isDefined(search) && search) {
			where.MEET_TITLE = {
				$regex: '.*' + search,
				$options: 'i'
			};
		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'status':
					// 按类型
					where.MEET_STATUS = Number(sortVal);
					break;
				case 'typeId':
					// 按类型
					where.MEET_TYPE_ID = sortVal;
					break;
				case 'sort':
					// 排序
					if (sortVal == 'view') {
						orderBy = {
							'MEET_VIEW_CNT': 'desc',
							'MEET_ADD_TIME': 'desc'
						};
					}

					break;
			}
		}

		return await MeetModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
	}

	/** 删除 */
	async delJoin(joinId) {
		const JoinModel = require('../../model/join_model.js');
		const MeetService = require('../meet_service.js');
		
		// 获取预约记录信息用于更新统计
		let join = await JoinModel.getOne({ _id: joinId }, 'JOIN_MEET_ID,JOIN_MEET_TIME_MARK');
		if (!join) {
			throw new Error('预约记录不存在');
		}
		
		// 删除预约记录
		await JoinModel.del({ _id: joinId });
		
		// 更新统计数据
		let meetService = new MeetService();
		await meetService.statJoinCnt(join.JOIN_MEET_ID, join.JOIN_MEET_TIME_MARK);
		
		return { success: true, joinId };
	}

	/**修改报名状态 
	 * 特殊约定 99=>正常取消 
	 */
	async statusJoin(admin, joinId, status, reason = '') {
		const JoinModel = require('../../model/join_model.js');
		const MeetService = require('../meet_service.js');
		const timeUtil = require('../../../framework/utils/time_util.js');
		
		// 获取原预约记录
		let join = await JoinModel.getOne({ _id: joinId }, 'JOIN_MEET_ID,JOIN_MEET_TIME_MARK,JOIN_STATUS');
		if (!join) {
			throw new Error('预约记录不存在');
		}
		
		// 更新预约状态
		let data = { 
			JOIN_STATUS: status,
			JOIN_EDIT_TIME: timeUtil.time()
		};
		
		// 如果有取消理由，记录理由
		if (reason) {
			data.JOIN_REASON = reason;
		}
		
		// 如果是管理员操作，记录管理员信息
		if (admin && (status === 99 || status === 10)) {
			data.JOIN_EDIT_ADMIN_ID = admin.ADMIN_ID || admin._id;
			data.JOIN_EDIT_ADMIN_NAME = admin.ADMIN_NAME || '管理员';
			data.JOIN_EDIT_ADMIN_TIME = timeUtil.time();
			data.JOIN_EDIT_ADMIN_STATUS = status;
		}
		
		await JoinModel.edit({ _id: joinId }, data);
		
		// 更新统计数据
		let meetService = new MeetService();
		await meetService.statJoinCnt(join.JOIN_MEET_ID, join.JOIN_MEET_TIME_MARK);
		
		return { success: true, joinId, status, reason };
	}

	/**修改项目状态 */
	async statusMeet(id, status) {
		// 数据库操作
		let where = { _id: id };
		let data = { MEET_STATUS: status };
		await MeetModel.edit(where, data);
		return { id, status };
	}

	/**置顶排序设定 */
	async sortMeet(id, sort) {
		// 数据库操作
		let where = { _id: id };
		let data = { MEET_ORDER: sort };
		await MeetModel.edit(where, data);
		return { id, sort };
	}
}

module.exports = AdminMeetService;
