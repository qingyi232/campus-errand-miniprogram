const api = require('../../utils/api');
const { DEFAULT_GOODS_IMG } = require('../../utils/config');
Page({
  data: { products: [], statusFilter: '', defaultImg: DEFAULT_GOODS_IMG },
  onShow() { this.loadProducts(); },
  changeFilter(e) { this.setData({ statusFilter: e.currentTarget.dataset.s }); this.loadProducts(); },
  async loadProducts() {
    const params = this.data.statusFilter !== '' ? { status: this.data.statusFilter } : null;
    const res = await api.getMerchantProducts(params);
    if (res.code === 200) this.setData({ products: res.data || [] });
  },
  addProduct() { wx.navigateTo({ url: '/pages/merchant-product-edit/merchant-product-edit' }); },
  editProduct(e) { wx.navigateTo({ url: '/pages/merchant-product-edit/merchant-product-edit?id=' + e.currentTarget.dataset.id }); },
  async toggleStatus(e) {
    const { id, status } = e.currentTarget.dataset;
    const product = this.data.products.find(p => p.id === id);
    if (product) {
      await api.updateMerchantProduct(id, { ...product, status: status === 1 ? 0 : 1, images: product.images });
      wx.showToast({ title: '操作成功' });
      this.loadProducts();
    }
  },
  deleteProduct(e) {
    wx.showModal({
      title: '提示', content: '确定删除该商品？',
      success: async (r) => {
        if (r.confirm) {
          await api.deleteMerchantProduct(e.currentTarget.dataset.id);
          wx.showToast({ title: '已删除' });
          this.loadProducts();
        }
      }
    });
  }
});
