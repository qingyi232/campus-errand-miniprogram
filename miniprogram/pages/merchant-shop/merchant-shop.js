const api = require('../../utils/api');
Page({
  data: { shop: null, products: [] },
  onLoad(options) {
    this.shopId = options.id;
    this.loadShop();
  },
  async loadShop() {
    const res = await api.getShopDetail(this.shopId);
    if (res.code === 200) {
      const d = res.data;
      const products = (d.products || []).map(p => {
        try { p.images = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []); } catch(e) { p.images = []; }
        return p;
      });
      this.setData({ shop: d, products });
      wx.setNavigationBarTitle({ title: d.shop_name || '店铺' });
    }
  },
  goProduct(e) {
    wx.navigateTo({ url: '/pages/product-detail/product-detail?id=' + e.currentTarget.dataset.id });
  }
});
