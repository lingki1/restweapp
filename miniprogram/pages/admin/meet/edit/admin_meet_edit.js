const AdminBiz = require('../../../../biz/admin_biz.js');
const pageHelper = require('../../../../helper/page_helper.js');
const bizHelper = require('../../../../biz/biz_helper.js');
const cloudHelper = require('../../../../helper/cloud_helper.js');
const timeHelper = require('../../../../helper/time_helper.js');
const validate = require('../../../../helper/validate.js');
const AdminMeetBiz = require('../../../../biz/admin_meet_biz.js');

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		isLoad: false,
		id: null,

	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: async function (options) {
		if (!AdminBiz.isAdmin(this)) return;
		pageHelper.getOptions(this, options);

		this.setData(await AdminMeetBiz.initFormData()); // 初始化表单数据   

		await this._loadDetail();

		this._setContentDesc();
	},

	_loadDetail: async function () {
		let id = this.data.id;
		if (!id) return;

		pageHelper.formSetBarTitleByAddEdit(id, '后台-活动/预约');

		let params = {
			id
		};
		let opt = {
			title: 'bar'
		};
		let meet = await cloudHelper.callCloudData('admin/meet_detail', params, opt);

		if (!meet) {
			this.setData({
				isLoad: null
			})
			return;
		}

		this.setData({
			isLoad: true,
			formTitle: meet.MEET_TITLE,
			formContent: meet.MEET_CONTENT,
			formOrder: meet.MEET_ORDER,
			formDaysSet: meet.MEET_DAYS_SET,
			formFormSet: meet.MEET_FORM_SET,
			formSeats: meet.MEET_SEAT_COUNT || 0,
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
		await this._loadDetail();
		wx.stopPullDownRefresh();
	},

	model: function (e) {
		pageHelper.model(this, e);
	},

	bindFormSetCmpt: function (e) {
		this.setData({
			formFormSet: e.detail,
		});
	},

	bindFormAddSubmit: async function () {
		pageHelper.formClearFocus(this);

		if (!AdminBiz.isAdmin(this)) return;

		let data = this.data;
		delete data.formTypeId; // 删除formTypeId字段
		if (data.formTitle.length <= 0) return pageHelper.formHint(this, 'formTitle', '请填写「标题」');


		if (data.formDaysSet.length <= 0) {
			pageHelper.anchor('formDaysSet', this);
			return pageHelper.formHint(this, 'formDaysSet', '请配置「可预约时段」');
		}
		if (data.formFormSet.length <= 0) return pageHelper.showModal('请至少设置一项「用户填写资料」');
		
		data.formSeats = Number(data.formSeats);

		data = validate.check(data, AdminMeetBiz.CHECK_FORM, this);
		if (!data) return;

		try {
			// 先创建，再上传 
			let result = await cloudHelper.callCloudSumbit('admin/meet_insert', data);
			let meetId = result.data.id;

			let formContent = this.data.formContent;
			if (formContent && formContent.length > 0) {
				wx.showLoading({
					title: '提交中...',
					mask: true
				});
				await AdminMeetBiz.updateMeetCotnentPic(meetId, formContent, this);
			}

			let callback = async function () {
				bizHelper.removeCacheList('admin-meet');
				bizHelper.removeCacheList('meet-list');
				wx.navigateBack();

			}
			pageHelper.showSuccToast('添加成功', 2000, callback);

		} catch (err) {
			console.log(err);
		}

	},

	bindFormEditSubmit: async function () {
		pageHelper.formClearFocus(this);

		if (!AdminBiz.isAdmin(this)) return;

		let data = this.data;
		delete data.formTypeId; // 删除formTypeId字段
		if (data.formTitle.length <= 0) return pageHelper.formHint(this, 'formTitle', '请填写「标题」');


		if (data.formDaysSet.length <= 0) {
			pageHelper.anchor('formDaysSet', this);
			return pageHelper.formHint(this, 'formDaysSet', '请配置「可预约时段」');
		}
		if (data.formFormSet.length <= 0) return pageHelper.showModal('请至少设置一项「用户填写资料」');

		data.formSeats = Number(data.formSeats);

		data = validate.check(data, AdminMeetBiz.CHECK_FORM, this);
		if (!data) return;

		try {
			let meetId = this.data.id;
			data.id = meetId;

			// 先修改，再上传 
			await cloudHelper.callCloudSumbit('admin/meet_edit', data);

			// 富文本 提交处理
			let formContent = this.data.formContent;
			wx.showLoading({
				title: '提交中...',
				mask: true
			});
			if (!await AdminMeetBiz.updateMeetCotnentPic(meetId, formContent, this)) return;

			let callback = async function () { 
				// 更新列表页面数据
				let node = {
					'MEET_TITLE': data.title,
					'MEET_DAYS_SET': data.daysSet,
					'MEET_FORM_SET': data.formSet,
					'MEET_EDIT_TIME': timeHelper.time('Y-M-D h:m:s'),
					'leaveDay': AdminMeetBiz.getLeaveDay(data.daysSet)
				}
				pageHelper.modifyPrevPageListNodeObject(meetId, node);
				wx.navigateBack();

			}
			pageHelper.showSuccToast('编辑成功', 2000, callback);

		} catch (err) {
			console.log(err);
		}

	},


	bindMyImgUploadListener: function (e) {
		this.setData({
			imgList: e.detail
		});
	},

	switchModel: function (e) {
		pageHelper.switchModel(this, e);
	},

	url: function (e) {
		pageHelper.url(e, this);
	},

	_setContentDesc: function () {
		let contentDesc = '未填写';
		let content = this.data.formContent;
		let imgCnt = 0;
		let textCnt = 0;
		for (let k in content) {
			if (content[k].type == 'img') imgCnt++;
			if (content[k].type == 'text') textCnt++;
		}

		if (imgCnt || textCnt) {
			contentDesc = textCnt + '段文字，' + imgCnt + '张图片';
		}
		this.setData({
			contentDesc
		});
	}

})
