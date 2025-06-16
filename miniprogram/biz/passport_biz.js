/**
 * Notes: 注册登录模块业务逻辑
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY cclinux@qq.com
 * Date: 2020-11-14 07:48:00 
 */

const BaseBiz = require('./base_biz.js');
const AdminBiz = require('./admin_biz.js');
const setting = require('../setting/setting.js');
const dataHelper = require('../helper/data_helper.js');
const cloudHelper = require('../helper/cloud_helper.js');
const cacheHelper = require('../helper/cache_helper.js');

class PassportBiz extends BaseBiz {

	static CACHE_USER = 'CACHE_USER'; // 用户信息缓存KEY

	/**
	 * 页面初始化 分包下使用
	 * @param {*} skin   
	 * @param {*} that 
	 * @param {*} isLoadSkin  是否skin加载为data
	 * @param {*} tabIndex 	是否修改本页标题为设定值
	 * @param {*} isModifyNavColor 	是否修改头部导航颜色
	 */
	static async initPage({
		skin,
		that,
		isLoadSkin = false,
		tabIndex = -1,
		isModifyNavColor = true
	}) {

		if (isModifyNavColor) {
			wx.setNavigationBarColor({ //顶部
				backgroundColor: skin.NAV_BG,
				frontColor: skin.NAV_COLOR,
			});
		}


		if (tabIndex > -1) {
			wx.setNavigationBarTitle({
				title: skin.MENU_ITEM[tabIndex]
			});
		}

		skin.IS_SUB = setting.IS_SUB;
		if (isLoadSkin) {
			skin.newsCateArr = dataHelper.getSelectOptions(skin.NEWS_CATE);
			skin.meetTypeArr = dataHelper.getSelectOptions(skin.MEET_TYPE);
			that.setData({
				skin
			});
		}
	}

	static async adminLogin(name, pwd, that) {
		if (name.length < 5 || name.length > 30) {
			wx.showToast({
				title: '账号输入错误(5-30位)',
				icon: 'none'
			});
			return;
		}

		if (pwd.length < 5 || pwd.length > 30) {
			wx.showToast({
				title: '密码输入错误(5-30位)',
				icon: 'none'
			});
			return;
		}

		let params = {
			name,
			pwd
		};
		let opt = {
			title: '登录中'
		};

		try {
			await cloudHelper.callCloudSumbit('admin/login', params, opt).then(res => {
				if (res && res.data && res.data.name) AdminBiz.adminLogin(res.data);

				wx.reLaunch({
					url: '/pages/admin/index/home/admin_home',
				});
			});
		} catch (e) {
			console.log(e);
		}

	}

	static logout() {
		cacheHelper.remove(this.CACHE_USER);
	}

	/**
	 * 检查用户是否已登录
	 * @returns {Object|null} 用户信息或null
	 */
	static getUser() {
		return cacheHelper.get(this.CACHE_USER);
	}

	/**
	 * 检查用户是否已登录，如果未登录则跳转到登录页面
	 * @param {Object} that 页面实例
	 * @param {string} redirectUrl 登录成功后的跳转地址
	 * @returns {boolean} 是否已登录
	 */
	static checkLogin(that, redirectUrl = '') {
		const user = this.getUser();
		if (!user || !user.userId) {
			// 未登录，显示登录提示
			wx.showModal({
				title: '需要登录',
				content: '此功能需要登录后才能使用，是否立即登录？',
				confirmText: '立即登录',
				cancelText: '取消',
				success: (res) => {
					if (res.confirm) {
						// 跳转到个人中心进行登录
						wx.navigateTo({
							url: '/projects/A00/my/index/my_index'
						});
					}
				}
			});
			return false;
		}
		return true;
	}

	/**
	 * 强制登录检查，如果未登录则阻止页面加载
	 * @param {Object} that 页面实例
	 * @param {Function} callback 登录成功后的回调
	 */
	static requireLogin(that, callback) {
		const user = this.getUser();
		if (!user || !user.userId) {
			that.setData({
				isLoad: null,
				needLogin: true
			});
			return false;
		}
		if (callback) callback(user);
		return true;
	}

}

module.exports = PassportBiz;