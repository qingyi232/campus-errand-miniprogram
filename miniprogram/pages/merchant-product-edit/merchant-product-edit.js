const api = require('../../utils/api');
const { DEFAULT_GOODS_IMG } = require('../../utils/config');
Page({
  data: {
    isEdit: false,
    form: { name: '', description: '', price: '', stock: '', category: '', images: [] }
  },
  onLoad(options) {
    if (options.id) {
      this.productId = options.id;
      this.setData({ isEdit: true });
      this.loadProduct();
    }
  },
  async loadProduct() {
    const res = await api.getMerchantProducts();
    if (res.code === 200) {
      const p = (res.data || []).find(item => item.id == this.productId);
      if (p) this.setData({ form: { name: p.name, description: p.description || '', price: String(p.price), stock: String(p.stock), category: p.category || '', images: p.images || [] } });
    }
  },
  onInput(e) { this.setData({ ['form.' + e.currentTarget.dataset.field]: e.detail.value }); },
  async save() {
    const { form } = this.data;
    if (!form.name || !form.price || !form.stock) return wx.showToast({ title: '请填写必要信息', icon: 'none' });
    const data = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock), status: 1, images: form.images.length ? form.images : [DEFAULT_GOODS_IMG] };
    wx.showLoading({ title: '保存中...' });
    try {
      const res = this.data.isEdit
        ? await api.updateMerchantProduct(this.productId, data)
        : await api.addMerchantProduct(data);
      if (res.code === 200) { wx.showToast({ title: '保存成功' }); setTimeout(() => wx.navigateBack(), 500); }
      else wx.showToast({ title: res.msg, icon: 'none' });
    } catch (e) { wx.showToast({ title: '保存失败', icon: 'none' }); }
    wx.hideLoading();
  }
});
