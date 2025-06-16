const cloudHelper = require('../helper/cloud_helper.js');
const pageHelper = require('../helper/page_helper.js');
const setting = require('../setting/setting.js');
const MeetBiz = require('../biz/meet_biz.js');
const PassportBiz = require('../biz/passport_biz.js');

module.exports = Behavior({

	/**
	 * 页面的初始数据
	 */
	data: {
		isLoad: false,
		selectedSeats: [],
	},

	methods: {
		/**
		 * 生命周期函数--监听页面加载
		 */
		onLoad: async function (options) {
			// 强制登录检查
			if (!PassportBiz.requireLogin(this)) {
				return;
			}

			// 处理meetId参数
			if (!options.meetId) {
				console.error('[meet_join_bh.js] onLoad: meetId is missing in options');
				this.setData({ isLoad: null });
				return;
			}

			this.setData({
				id: options.meetId
			});

			if (options.seats) {
				this.setData({
					selectedSeats: options.seats.split(',').map(Number)
				});
			}

            if (options.timeMark) {
                this.setData({
                    timeMark: options.timeMark
                });
            } else {
				console.error('[meet_join_bh.js] onLoad: timeMark is missing in options');
				this.setData({ isLoad: null });
				return;
            }

			this._loadDetail();
		},

		_loadDetail: async function () {
			let id = this.data.id;
			if (!id) {
				console.error('[meet_join_bh.js] _loadDetail: id is missing');
				this.setData({ isLoad: null });
				return;
			}

			let timeMark = this.data.timeMark;
			if (!timeMark) {
				console.error('[meet_join_bh.js] _loadDetail: timeMark is missing');
                this.setData({ isLoad: null });
                return;
			}

			let params = {
				meetId: id,
				timeMark
			};
			let opt = {
				title: 'bar'
			};

			try {
			let meet = await cloudHelper.callCloudData('meet/detail_for_join', params, opt);
			if (!meet) {
				this.setData({
					isLoad: null
					});
				return;
			}

				// 确保 MEET_FORM_SET 存在
				if (!meet.MEET_FORM_SET || meet.MEET_FORM_SET.length === 0) {
					console.warn('[meet_join_bh.js] _loadDetail: MEET_FORM_SET is empty or not found in meet object');
					meet.MEET_FORM_SET = [];
            }

			this.setData({
				isLoad: true,
					meet
				});
			} catch (error) {
				console.error('[meet_join_bh.js] _loadDetail: Error loading detail:', error);
				this.setData({
					isLoad: null
				});
			}
		},

		/**
		 * 生命周期函数--监听页面初次渲染完成
		 */
		onReady: function () {},

		/**
		 * 生命周期函数--监听页面显示
		 */
		onShow: function () {

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
			await this._loadDetail();
			wx.stopPullDownRefresh();
		},



		url: function (e) {
			pageHelper.url(e, this);
		},

		onPageScroll: function (e) {
			// 回页首按钮
			pageHelper.showTopBtn(e, this);

		},

		bindCheckTap: async function (e) {
			this.selectComponent("#form-show").checkForms();
		},

		bindSubmitCmpt: async function (e) {
			let forms = e.detail;

			let callback = async () => {
				try {
					let opts = {
						title: '提交中'
					}
					let params = {
						meetId: this.data.id,
						timeMark: this.data.timeMark,
						forms,
						seats: this.data.selectedSeats
					}
					await cloudHelper.callCloudSumbit('meet/join', params, opts).then(res => {
						let content = '预约成功！'

						let joinId = res.data.joinId;
						wx.showModal({
							title: '温馨提示',
							showCancel: false,
							content,
							success() {
								let ck = () => {
									wx.reLaunch({
										url: pageHelper.fmtURLByPID('/pages/my/join_detail/my_join_detail?flag=home&id=' + joinId),
									})
								}
								ck();
							}
						})
					})
				} catch (err) {
					console.log(err);
				};
			}

			// 消息订阅
			await MeetBiz.subscribeMessageMeet(callback);
		},

		// 跳转到登录页面
		bindGoLogin: function() {
			wx.navigateTo({
				url: '../../my/index/my_index'
			});
		}
	}
})
