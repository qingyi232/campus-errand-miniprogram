const api = require('../../utils/api');
Page({
  data: {
    isEdit: false,
    campusList: ['主校区', '东校区', '南校区'],
    form: { name: '', phone: '', campus: '', dormitory: '', detail: '', is_default: false }
  },
  onLoad(options) {
    if (options.id) {
      this.addrId = options.id;
      this.setData({ isEdit: true });
      this.loadAddress();
    }
  },
  async loadAddress() {
    const res = await api.getAddressList();
    if (res.code === 200) {
      const addr = (res.data || []).find(a => a.id == this.addrId);
      if (addr) this.setData({ form: { ...addr, is_default: !!addr.is_default } });
    }
  },
  onInput(e) { this.setData({ ['form.' + e.currentTarget.dataset.field]: e.detail.value }); },
  onCampusChange(e) { this.setData({ 'form.campus': this.data.campusList[e.detail.value] }); },
  onDefaultChange(e) { this.setData({ 'form.is_default': e.detail.value }); },
  async save() {
    const { form } = this.data;
    if (!form.name || !form.phone) return wx.showToast({ title: '请填写完整信息', icon: 'none' });
    wx.showLoading({ title: '保存中...' });
    try {
      const res = this.data.isEdit
        ? await api.updateAddress(this.addrId, form)
        : await api.addAddress(form);
      if (res.code === 200) { wx.showToast({ title: '保存成功' }); setTimeout(() => wx.navigateBack(), 500); }
      else wx.showToast({ title: res.msg, icon: 'none' });
    } catch (e) { wx.showToast({ title: '保存失败', icon: 'none' }); }
    wx.hideLoading();
  }
});
