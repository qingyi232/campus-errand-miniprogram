const api = require('../../utils/api');
const { DEFAULT_GOODS_IMG } = require('../../utils/config');

Page({
  data: {
    isEdit: false,
    categories: ['教材书籍', '数码产品', '生活用品', '服饰鞋帽', '运动户外', '其他'],
    form: { title: '', description: '', price: '', original_price: '', category: '', images: [], contact: '' }
  },

  onLoad(options) {
    if (options.id) {
      this.goodsId = options.id;
      this.setData({ isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑商品' });
      this.loadGoods();
    }
  },

  async loadGoods() {
    const res = await api.getMarketDetail(this.goodsId);
    if (res.code === 200) {
      const d = res.data;
      this.setData({
        form: {
          title: d.title, description: d.description || '', price: String(d.price),
          original_price: d.original_price ? String(d.original_price) : '',
          category: d.category || '', images: d.images || [], contact: d.contact || ''
        }
      });
    }
  },

  onInput(e) { this.setData({ ['form.' + e.currentTarget.dataset.field]: e.detail.value }); },
  onCateChange(e) { this.setData({ 'form.category': this.data.categories[e.detail.value] }); },

  addImg() {
    wx.chooseImage({
      count: 9 - this.data.form.images.length,
      success: (res) => {
        const imgs = this.data.form.images.concat(res.tempFilePaths.map(p => p));
        this.setData({ 'form.images': imgs });
      }
    });
  },

  delImg(e) {
    const imgs = this.data.form.images;
    imgs.splice(e.currentTarget.dataset.index, 1);
    this.setData({ 'form.images': imgs });
  },

  async submit() {
    const { form } = this.data;
    if (!form.title) return wx.showToast({ title: '请输入标题', icon: 'none' });
    if (!form.description) return wx.showToast({ title: '请输入描述', icon: 'none' });
    if (!form.price) return wx.showToast({ title: '请输入售价', icon: 'none' });
    if (!form.category) return wx.showToast({ title: '请选择分类', icon: 'none' });

    const images = form.images.length > 0 ? form.images : [DEFAULT_GOODS_IMG];

    const submitData = {
      ...form,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      images
    };

    wx.showLoading({ title: this.data.isEdit ? '保存中...' : '发布中...' });
    try {
      const res = this.data.isEdit
        ? await api.updateGoods(this.goodsId, { ...submitData, status: 'on_sale' })
        : await api.publishGoods(submitData);
      if (res.code === 200) {
        wx.showToast({ title: this.data.isEdit ? '保存成功' : '发布成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1000);
      } else wx.showToast({ title: res.msg, icon: 'none' });
    } catch (e) { wx.showToast({ title: '操作失败', icon: 'none' }); }
    wx.hideLoading();
  }
});
