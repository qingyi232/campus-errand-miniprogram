const api = require('../../utils/api');

Page({
  data: {
    form: { goods_desc: '', buy_location: '', budget: '', delivery_address: '', reward: '', remark: '' }
  },

  onInput(e) {
    this.setData({ ['form.' + e.currentTarget.dataset.field]: e.detail.value });
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
    if (!form.goods_desc) return wx.showToast({ title: '请描述购买商品', icon: 'none' });
    if (!form.buy_location) return wx.showToast({ title: '请输入购买地点', icon: 'none' });
    if (!form.budget) return wx.showToast({ title: '请输入预算金额', icon: 'none' });
    if (!form.delivery_address) return wx.showToast({ title: '请输入配送地址', icon: 'none' });
    if (!form.reward || parseFloat(form.reward) < 2) return wx.showToast({ title: '赏金最低2元', icon: 'none' });

    wx.showLoading({ title: '发布中...' });
    try {
      const res = await api.publishTask({
        ...form, type: 'help_buy',
        reward: parseFloat(form.reward),
        budget: parseFloat(form.budget)
      });
      if (res.code === 200) {
        wx.showToast({ title: '发布成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1000);
      } else wx.showToast({ title: res.msg, icon: 'none' });
    } catch (e) { wx.showToast({ title: '发布失败', icon: 'none' }); }
    wx.hideLoading();
  }
});
