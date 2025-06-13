/**
 * Notes: passport模块业务逻辑 
 * Date: 2020-10-14 07:48:00 
 */

const BaseService = require('./base_service.js');

const cloudBase = require('../../framework/cloud/cloud_base.js');
const UserModel = require('../model/user_model.js');
const config = require('../../config/config.js');
const http = require('axios'); // 用于发起网络请求

class PassportService extends BaseService {

	// 插入用户
	async insertUser(userId, mobile, name = '', joinCnt = 0) {
		// 判断是否存在
		let where = {
			USER_MINI_OPENID: userId
		}
		let cnt = await UserModel.count(where);
		if (cnt > 0) return;

		// 入库
		let data = {
			USER_MINI_OPENID: userId,
			USER_MOBILE: mobile,
			USER_NAME: name
		}
		await UserModel.insert(data);
	}

	/** 获取手机号码 */
	async getPhone(cloudID) {
		let cloud = cloudBase.getCloud();
		let res = await cloud.getOpenData({
			list: [cloudID], // 假设 event.openData.list 是一个 CloudID 字符串列表
		});
		if (res && res.list && res.list[0] && res.list[0].data) {

			let phone = res.list[0].data.phoneNumber;

			return phone;
		} else
			return '';
	}

	/** 取得我的用户信息 */
	async getMyDetail(userId) {
		let where = {
			USER_MINI_OPENID: userId
		}
		let fields = 'USER_MOBILE,USER_NAME,USER_CITY,USER_TRADE,USER_WORK'
		return await UserModel.getOne(where, fields);
	}

	/** 修改用户资料 */
	async editBase(userId, {
		mobile,
		name,
		trade,
		work,
		city
	}) {
		let where = {
			USER_MINI_OPENID: userId
		};
		// 判断是否存在
		let cnt = await UserModel.count(where);
		if (cnt == 0) {
			await this.insertUser(userId, mobile, name, 0);
			return;
		}

		let data = {
			USER_MOBILE: mobile,
			USER_NAME: name,
			USER_CITY: city,
			USER_WORK: work,
			USER_TRADE: trade
		};

		await UserModel.edit(where, data);

	}

	/**
	 * 微信登录
	 * @param {object} params 
	 * @param {string} params.code wx.login获取到的code
	 * @param {string} params.name 用户昵称
	 * @param {string} params.avatar 用户头像
	 */
	async wxLogin({ code, name, avatar }) {
		const cloud = cloudBase.getCloud();
		const wxContext = cloud.getWXContext();

		// 调用 code2Session 接口
		const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${config.WECHAT_APPID}&secret=${config.WECHAT_APPSECRET}&js_code=${code}&grant_type=authorization_code`;

		let sessionRes;
		try {
			sessionRes = await http.get(url);
			if (sessionRes.data.errcode) {
				console.error('wxLogin code2Session error:', sessionRes.data);
				this.AppError('微信登录失败，请稍后再试');
			}
		} catch (err) {
			console.error('wxLogin code2Session request error:', err);
			this.AppError('微信登录请求失败，请检查网络');
		}

		const { openid, session_key } = sessionRes.data;

		if (!openid) {
			this.AppError('获取 openid 失败');
		}

		// 查询或创建用户
		let user = await UserModel.getOne({ USER_MINI_OPENID: openid });

		if (!user) {
			const data = {
				USER_MINI_OPENID: openid,
				USER_NAME: name,
				USER_AVATAR_URL: avatar, // 假设 UserModel 有 USER_AVATAR_URL 字段
				USER_STATUS: UserModel.STATUS.COMM,
				USER_LOGIN_CNT: 1,
				USER_LOGIN_TIME: this._timestamp,
			};
			await UserModel.insert(data);
			user = await UserModel.getOne({ USER_MINI_OPENID: openid }); 
		} else {
			// 更新登录信息
			const updateData = {
				USER_LOGIN_CNT: user.USER_LOGIN_CNT + 1,
				USER_LOGIN_TIME: this._timestamp,
				USER_NAME: name, // 每次登录都更新昵称和头像
				USER_AVATAR_URL: avatar,
			};
			await UserModel.edit({ USER_MINI_OPENID: openid }, updateData);
			user = await UserModel.getOne({ USER_MINI_OPENID: openid }); 
		}

		// 生成自定义登录态 (这里简单返回用户信息，实际项目中可能需要生成token)
		// 注意：实际项目中 session_key 不应该返回给客户端
		return {
			userId: user.USER_MINI_OPENID,
			name: user.USER_NAME,
			avatar: user.USER_AVATAR_URL,
			// token: generateToken(openid) // 实际项目中需要生成和管理token
		};
	}

}

module.exports = PassportService;