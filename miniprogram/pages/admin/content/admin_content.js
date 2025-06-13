const AdminBiz = require('../../../biz/admin_biz.js');
const pageHelper = require('../../../helper/page_helper.js');

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
	onLoad: async function (options) {
		if (!AdminBiz.isAdmin(this)) return;

		let parent = pageHelper.getPrevPage(2);
		if (!parent) return;

		let formContent = parent.data.formContent;
		if (formContent && formContent.length > 0)
			this.setData({
				formContent
			});
	},




	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady: function () {

	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: function () {},

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

	},

	model: function (e) {
		pageHelper.model(this, e);
	},

	bindSaveTap: async function (e) {
		let formContent = this.selectComponent("#contentEditor").getNodeList();

		// 获取 meetId（可根据实际页面参数调整）
		let pages = getCurrentPages();
		let parent = pages[pages.length - 2];
		let meetId = parent && parent.data && parent.data.id;

		if (!meetId) {
			wx.showToast({ title: '找不到关联ID', icon: 'none' });
			return;
		}

		// 调用云函数保存内容
		wx.showLoading({ title: '保存中...', mask: true });
		try {
			await wx.cloud.callFunction({
				name: 'cloud',
				data: {
					$url: 'admin/meet_update_content',
					meetId,
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
	},

	url: function (e) {
		pageHelper.url(e, this);
	},

	bindSaveTap: function (e) {
		let formContent = this.selectComponent("#contentEditor").getNodeList();

		let parent = pageHelper.getPrevPage(2);
		if (!parent) return;

		parent.setData({
			formContent
		}, () => {
			parent._setContentDesc();
		});

		wx.navigateBack({
			delta: 0,
		});
	}
})