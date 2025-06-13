const cacheHelper = require('../helper/cache_helper.js');
const pageHelper = require('../helper/page_helper.js');
const cloudHelper = require('../helper/cloud_helper.js');
const timeHelper = require('../helper/time_helper.js');
const PassortBiz = require('../biz/passport_biz.js');
const setting = require('../setting/setting.js');

module.exports = Behavior({
	data: {
		myTodayList: null
	},

	methods: {
		/**
		 * 生命周期函数--监听页面加载
		 */
		onLoad: async function (options) {
			if (setting.IS_SUB) wx.hideHomeButton();
		},

		_loadTodayList: async function () {
			try {
				let params = {
					day: timeHelper.time('Y-M-D')
				}
				let opts = {
					title: 'bar'
				}
				await cloudHelper.callCloudSumbit('my/my_join_someday', params, opts).then(res => {
					this.setData({
						myTodayList: res.data
					});
				});
			} catch (err) {
				console.log(err)
			}
		},

		/**
		 * 生命周期函数--监听页面初次渲染完成
		 */
		onReady: function () {},

		/**
		 * 生命周期函数--监听页面显示
		 */
		onShow: async function () {
			await this._loadTodayList();
			this._loadUser();
		},

		/**
		 * 生命周期函数--监听页面隐藏
		 */
		onHide: function () {

		},

		/**
		 * 生命周期函数--监听页面卸载
		 */
		onUnload: function () {

		},

		_loadUser: async function (e) {
			let user = cacheHelper.get(PassortBiz.CACHE_USER);
			if (user && user.userId) {
				this.setData({
					user
				});
			} else {
				// 如果缓存没有，可以考虑是否需要调用云函数获取，或者清除本地user状态
				this.setData({
					user: null
				});
			}
		},

		/**
		 * 页面相关事件处理函数--监听用户下拉动作
		 */
		onPullDownRefresh: async function () {
			await this._loadTodayList();
			await this._loadUser();
			wx.stopPullDownRefresh();
		},

		/**
		 * 页面上拉触底事件的处理函数
		 */
		onReachBottom: function () {

		},


		/**
		 * 用户点击右上角分享
		 */
		onShareAppMessage: function () {},

		url: function (e) {
			pageHelper.url(e, this);
		},

		setTap: function (e, skin) {
			let itemList = ['清除缓存', '后台管理'];
			wx.showActionSheet({
				itemList,
				success: async res => {
					let idx = res.tapIndex;
					if (idx == 0) {
						cacheHelper.clear();
						pageHelper.showNoneToast('清除缓存成功');
					}

					if (idx == 1) {
						pageHelper.setSkin(skin);
						if (setting.IS_SUB) {
							PassortBiz.adminLogin('admin', '123456', this);
						} else {
							wx.reLaunch({
								url: '/pages/admin/index/login/admin_login',
							});
						}

					}

				},
				fail: function (res) {}
			})
		},

		bindWxLogin: async function () {
			let that = this;
			wx.getUserProfile({
				desc: '用于完善会员资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写 <mcreference link="https://blog.csdn.net/qq_32340877/article/details/119861959" index="1">1</mcreference> <mcreference link="https://developers.weixin.qq.com/miniprogram/dev/api/open-api/user-info/wx.getUserProfile.html" index="2">2</mcreference>
				success: async (res) => {
					let userInfo = res.userInfo;
					wx.login({
						success: async resLogin => {
							if (resLogin.code) {
								let params = {
									code: resLogin.code,
									nickName: userInfo.nickName,
									avatarUrl: userInfo.avatarUrl
								};
								try {
									await cloudHelper.callCloudSumbit('passport/wx_login', params).then(resCloud => {
										if (resCloud && resCloud.data) {
											// 登录成功
											cacheHelper.set(PassortBiz.CACHE_USER, resCloud.data);
											that.setData({
												user: resCloud.data
											});
											pageHelper.showSuccToast('登录成功');
										} else {
											pageHelper.showModal('登录失败，请重试');
										}
									});
								} catch (err) {
									console.error(err);
									pageHelper.showModal('登录失败，请重试');
								}
							} else {
								pageHelper.showModal('获取登录凭证失败，请重试');
							}
						}
					});
				},
				fail: (err) => {
					console.log('用户拒绝授权', err);
					// 可以根据业务需求提示用户，例如：
					// pageHelper.showModal('您已拒绝授权，部分功能可能无法使用');
				}
			});
		},

		bindLogoutTap: function () {
			PassortBiz.logout(); // 清除登录缓存
			// 强制更新页面数据，确保UI响应
			this.setData({
				user: null, 
				myTodayList: [] // 清空今日订座列表，或设置为初始状态
			});
			pageHelper.showSuccToast('已退出登录');
			// 可能需要重新加载或导航到特定页面，根据业务需求决定
			// wx.reLaunch({ url: '/pages/my/index' }); 
		}
	}
})