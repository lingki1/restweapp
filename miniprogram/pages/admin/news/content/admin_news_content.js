// pages/admin/news/content/admin_news_content.js
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		formContent: [{
			type: 'text',
			val: '',
		}]
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		let parent = getCurrentPages()[getCurrentPages().length - 2];
		if (parent && parent.data && parent.data.formContent) {
			this.setData({
				formContent: parent.data.formContent
			});
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
	onPullDownRefresh: function () {

	},

	/**
	 * 页面上拉触底事件的处理函数
	 */
	onReachBottom: function () {

	},

	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage: function () {

	},

	bindSaveTap: async function (e) {
		let formContent = this.selectComponent("#contentEditor").getNodeList();

		// 获取 newsId
		let parent = getCurrentPages()[getCurrentPages().length - 2];
		let newsId = parent && parent.data && parent.data.id;

		if (!newsId) {
			wx.showToast({ title: '找不到关联ID', icon: 'none' });
			return;
		}

		// 调用云函数保存内容
		wx.showLoading({ title: '保存中...', mask: true });
		try {
			await wx.cloud.callFunction({
				name: 'cloud',
				data: {
					$url: 'admin/news_update_content',
					newsId,
					content: formContent
				}
			});
			wx.showToast({ title: '保存成功', icon: 'success' });
		} catch (err) {
			wx.showToast({ title: '保存失败', icon: 'none' });
			return;
		}

		// 同步到上级页面
		parent.setData({
			formContent
		}, () => {
			parent._setContentDesc && parent._setContentDesc();
		});

		wx.navigateBack({ delta: 0 });
	}
})