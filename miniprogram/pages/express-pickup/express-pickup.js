const api = require('../../utils/api');

Page({
  data: {
    expressPoints: ['菜鸟驿站（南门）', '京东快递柜（食堂旁）', '中通快递点（西门）', '圆通快递点（北门）', '韵达快递点（东门）'],
    form: { express_point: '', pickup_code: '', delivery_address: '', reward: '', remark: '' }
  },

  onPointChange(e) {
    this.setData({ 'form.express_point': this.data.expressPoints[e.detail.value] });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['form.' + field]: e.detail.value });
  },

  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        if (res.name || res.address) {
          this.setData({ 'form.delivery_address': (res.name || '') + ' ' + (res.address || '') });
        }
      },
      fail: () => {}
    });
  },

  async submit() {
    const { form } = this.data;
    if (!form.express_point) return wx.showToast({ title: '请选择快递点', icon: 'none' });
    if (!form.pickup_code) return wx.showToast({ title: '请输入取件码', icon: 'none' });
    if (!form.delivery_address) return wx.showToast({ title: '请输入送达地址', icon: 'none' });
    if (!form.reward || parseFloat(form.reward) < 2) return wx.showToast({ title: '赏金最低2元', icon: 'none' });

    wx.showLoading({ title: '发布中...' });
    try {
      const res = await api.publishTask({ ...form, type: 'express_pickup', reward: parseFloat(form.reward) });
      if (res.code === 200) {
        wx.showToast({ title: '发布成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1000);
      } else {
        wx.showToast({ title: res.msg || '发布失败', icon: 'none' });
      }
    } catch (e) {
      wx.showToast({ title: '发布失败', icon: 'none' });
    }
    wx.hideLoading();
  }
});
