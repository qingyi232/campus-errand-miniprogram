const api = require('../../utils/api');
const { DEFAULT_AVATAR } = require('../../utils/config');
Page({
  data: { campusList: ['主校区', '东校区', '南校区'], form: { nickname: '', avatar: '', campus: '', dormitory: '' }, defaultAvatar: DEFAULT_AVATAR },
  onLoad() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({ form: { nickname: userInfo.nickname || '', avatar: userInfo.avatar || '', campus: userInfo.campus || '', dormitory: userInfo.dormitory || '' } });
  },
  onInput(e) { this.setData({ ['form.' + e.currentTarget.dataset.field]: e.detail.value }); },
  onCampusChange(e) { this.setData({ 'form.campus': this.data.campusList[e.detail.value] }); },
  changeAvatar() {
    wx.chooseImage({
      count: 1,
      success: (res) => this.setData({ 'form.avatar': res.tempFilePaths[0] })
    });
  },
  async save() {
    wx.showLoading({ title: '保存中...' });
    try {
      const res = await api.updateUserInfo(this.data.form);
      if (res.code === 200) {
        const userInfo = wx.getStorageSync('userInfo');
        wx.setStorageSync('userInfo', { ...userInfo, ...this.data.form });
        wx.showToast({ title: '保存成功' });
        setTimeout(() => wx.navigateBack(), 500);
      }
    } catch (e) { wx.showToast({ title: '保存失败', icon: 'none' }); }
    wx.hideLoading();
  }
});
