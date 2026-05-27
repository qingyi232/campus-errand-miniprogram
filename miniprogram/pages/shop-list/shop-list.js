const api = require('../../utils/api');
Page({
  data: { shops: [] },
  onLoad() { this.loadShops(); },
  async loadShops() {
    const res = await api.getShopList();
    if (res.code === 200) this.setData({ shops: res.data || [] });
  },
  goShop(e) {
    wx.navigateTo({ url: '/pages/merchant-shop/merchant-shop?id=' + e.currentTarget.dataset.id });
  }
});
