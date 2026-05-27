const api = require('../../utils/api');

Page({
  data: {
    form: { sender_address: '', receiver_name: '', receiver_phone: '', receiver_address: '', reward: '', remark: '' }
  },

  onInput(e) {
    this.setData({ ['form.' + e.currentTarget.dataset.field]: e.detail.value });
  },

  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        if (res.name || res.address) {
          this.setData({ 'form.sender_address': (res.name || '') + ' ' + (res.address || '') });
        }
      },
      fail: () => {}
    });
  },

  async submit() {
    const { form } = this.data;
    if (!form.sender_address) return wx.showToast({ title: '请输入寄件地址', icon: 'none' });
    if (!form.receiver_name) return wx.showToast({ title: '请输入收件人', icon: 'none' });
    if (!form.receiver_phone) return wx.showToast({ title: '请输入收件电话', icon: 'none' });
    if (!form.receiver_address) return wx.showToast({ title: '请输入收件地址', icon: 'none' });
    if (!form.reward || parseFloat(form.reward) < 2) return wx.showToast({ title: '赏金最低2元', icon: 'none' });

    wx.showLoading({ title: '发布中...' });
    try {
      const res = await api.publishTask({ ...form, type: 'express_send', reward: parseFloat(form.reward) });
      if (res.code === 200) {
        wx.showToast({ title: '发布成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1000);
      } else wx.showToast({ title: res.msg, icon: 'none' });
    } catch (e) { wx.showToast({ title: '发布失败', icon: 'none' }); }
    wx.hideLoading();
  }
});
