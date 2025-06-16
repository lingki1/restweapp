const cloudHelper = require('../helper/cloud_helper.js');
const pageHelper = require('../helper/page_helper.js');
const timeHelper = require('../helper/time_helper.js');
const setting = require('../setting/setting.js');
const PassportBiz = require('../biz/passport_biz.js');
const cacheHelper = require('../helper/cache_helper.js');

module.exports = Behavior({

	/**
	 * 页面的初始数据
	 */
	data: {
		isLoad: false,
		list: [],

		day: '',
		hasDays: [],

		seats: [],
		selectedSeats: [],
		currentTimeSlot: null, // 当前选择的时段索引
		currentMeetItem: null, // 当前选择的会议项目
		
		userInfo: null, // 用户信息
	},

	methods: {
		/**
		 * 生命周期函数--监听页面加载
		 */
		onLoad: async function (options) {
			if (setting.IS_SUB) wx.hideHomeButton();
		},

		_loadList: async function () {
			let params = {
				day: this.data.day,
				forceRefresh: new Date().getTime().toString()
			}
			let opts = {
				title: this.data.isLoad ? 'bar' : 'bar'
			}
			try {
				this.setData({
					list: null,
					currentTimeSlot: null,
					currentMeetItem: null,
					seats: [],
					selectedSeats: []
				});
				let res = await cloudHelper.callCloudSumbit('meet/list_by_day', params, opts);
				console.log('Cloud function response:', res);
				let rawList = res.data || [];
				let currentList = rawList.map(item => {
					// 现在每个项目都应该有正确的timeMark
					if (!item.timeMark || item.timeMark === undefined) {
						console.warn(`[calendar_index_bh.js] _loadList: Item with _id=${item._id} is missing timeMark. This indicates a backend data issue.`);
						item.timeMark = null;
						item.hasError = true;
					}
					return item;
				});

				this.setData({
					list: currentList,
					isLoad: true
                });
			} catch (err) {
				console.error(err);
			}
		},

		// 选择时段
		bindSelectTimeSlot(e) {
			// 检查用户登录状态
			if (!PassportBiz.checkLogin(this)) {
				return;
			}

			const slotIndex = parseInt(e.currentTarget.dataset.index);
			const meetItem = this.data.list[slotIndex];
			
			if (!meetItem) {
				wx.showToast({
					title: '时段信息错误',
					icon: 'none'
				});
				return;
			}

			// 生成座位
			const seatCount = meetItem.seatCount || 10;
			const seats = [];
			for (let i = 0; i < seatCount; i++) {
				seats.push({
					id: i,
					number: i + 1,
					status: 'available'
				});
			}

			this.setData({
				currentTimeSlot: slotIndex,
				currentMeetItem: meetItem,
				seats: seats,
				selectedSeats: []
			}, () => {
				// 异步更新已预约座位
				this._updateReservedSeats(meetItem._id, meetItem.timeMark);
			});
		},

		// 取消选择
		bindCancelSelection() {
			this.setData({
				currentTimeSlot: -1,
				currentMeetItem: null,
				seats: [],
				selectedSeats: []
			});
		},

		// 更新已预约座位
		async _updateReservedSeats(meetId, timeMark) {
			try {
				const params = {
					meetId: meetId,
					timeMark: timeMark
				};
				const opts = {
					title: 'bar'
				};
				
				const reservedSeats = await cloudHelper.callCloudData('meet/get_reserved_seats', params, opts);
				if (reservedSeats && reservedSeats.length > 0) {
					const seatUpdateData = {};
					
					reservedSeats.forEach(seatIndex => {
						if (seatIndex >= 0 && seatIndex < this.data.seats.length) {
							seatUpdateData[`seats[${seatIndex}].status`] = 'reserved';
						}
					});

					if (Object.keys(seatUpdateData).length > 0) {
						this.setData(seatUpdateData);
					}
				}
			} catch (error) {
				console.error('获取已预约座位失败:', error);
			}
		},

		_loadHasList: async function () {
			let params = {
				day: timeHelper.time('Y-M-D')
			}
			let opts = {
				title: 'bar'
			}
			try {
				// 添加强制刷新参数，确保不使用缓存
				params.forceRefresh = timeHelper.time('YMDhms');
				await cloudHelper.callCloudSumbit('meet/list_has_day', params, opts).then(res => {
					this.setData({
						hasDays: res.data,
					});
				});
			} catch (err) {
				console.error(err);
			}
		},

		/**
		 * 生命周期函数--监听页面初次渲染完成
		 */
		onReady: function () {

		},

		/**
		 * 生命周期函数--监听页面显示
		 */
		onShow: async function () {
			// 检查用户登录状态
			const userInfo = PassportBiz.getUser();
			this.setData({
				userInfo: userInfo,
				day: timeHelper.time('Y-M-D')
			}, async () => {
				await this._loadHasList();
				await this._loadList();
			});
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

		/**
		 * 页面相关事件处理函数--监听用户下拉动作
		 */
		onPullDownRefresh: async function () {
			await this._loadHasList();
			await this._loadList();
			wx.stopPullDownRefresh();
		},

		/**
		 * 用户点击右上角分享
		 */
		onShareAppMessage: function () {

		},

		bindClickCmpt: async function (e) {
			let day = e.detail.day;
			this.setData({
				day
			}, async () => {
				await this._loadList();
			})

		},

		bindMonthChangeCmpt: function (e) {
			console.log(e.detail)
		},

		url: async function (e) {
			pageHelper.url(e, this);
		},

		// 选择座位
		bindSelectSeat(e) {
			const seatIndex = parseInt(e.currentTarget.dataset.index);
			const seat = this.data.seats[seatIndex];
			
			if (!seat || seat.status === 'reserved') {
				return;
			}
			
			const selectedSeats = [...this.data.selectedSeats];
			const seatUpdateData = {};

			if (seat.status === 'selected') {
				// 取消选择
				const index = selectedSeats.indexOf(seatIndex);
				if (index > -1) {
					selectedSeats.splice(index, 1);
				}
				seatUpdateData[`seats[${seatIndex}].status`] = 'available';
            } else {
				// 选择座位
				selectedSeats.push(seatIndex);
				seatUpdateData[`seats[${seatIndex}].status`] = 'selected';
			}

			seatUpdateData.selectedSeats = selectedSeats;
			this.setData(seatUpdateData);
		},

		// 下一步
		bindNextStep() {
			if (!this.data.selectedSeats || this.data.selectedSeats.length === 0) {
				wx.showToast({
					title: '请先选择座位',
					icon: 'none'
				});
				return;
			}

			if (!this.data.currentMeetItem) {
				wx.showToast({
					title: '时段信息错误',
					icon: 'none'
				});
				return;
			}

			const meetId = this.data.currentMeetItem._id;
			const timeMark = this.data.currentMeetItem.timeMark;
			const selectedSeats = this.data.selectedSeats.join(',');

			wx.navigateTo({
				url: `../../meet/join/meet_join?meetId=${meetId}&timeMark=${timeMark}&seats=${selectedSeats}`
			});
		},

		// 跳转到登录页面
		bindGoLogin: function() {
			wx.navigateTo({
				url: '../../my/index/my_index'
			});
		},

		// 微信一键登录
		bindWxLogin: async function () {
			let that = this;
			wx.getUserProfile({
				desc: '用于完善会员资料',
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
											cacheHelper.set(PassportBiz.CACHE_USER, resCloud.data);
											that.setData({
												userInfo: resCloud.data
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
					pageHelper.showModal('需要授权后才能使用预约功能');
				}
			});
		}
	}
})