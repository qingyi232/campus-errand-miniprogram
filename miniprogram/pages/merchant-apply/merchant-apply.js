const api = require('../../utils/api');
Page({
  data: {
    cateList: ['零食饮料', '文具用品', '日用百货', '水果生鲜', '数码配件', '其他'],
    form: { shop_name: '', category: '', contact: '', business_hours: '', delivery_range: '' }
  },
  onInput(e) { this.setData({ ['form.' + e.currentTarget.dataset.field]: e.detail.value }); },
  onCateChange(e) { this.setData({ 'form.category': this.data.cateList[e.detail.value] }); },
  async submit() {
    const { form } = this.data;
    if (!form.shop_name) return wx.showToast({ title: '请输入店铺名称', icon: 'none' });
    if (!form.category) return wx.showToast({ title: '请选择经营类目', icon: 'none' });
    if (!form.contact) return wx.showToast({ title: '请输入联系电话', icon: 'none' });
    wx.showLoading({ title: '提交中...' });
    try {
      const res = await api.merchantApply(form);
      if (res.code === 200) {
        wx.showToast({ title: '申请已提交', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1000);
      } else wx.showToast({ title: res.msg, icon: 'none' });
    } catch (e) { wx.showToast({ title: '提交失败', icon: 'none' }); }
    wx.hideLoading();
  }
});
