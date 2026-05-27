const api = require('../../utils/api');
Page({
  data: { merchant: null },
  onShow() { this.loadInfo(); },
  async loadInfo() {
    const res = await api.getMerchantInfo();
    if (res.code === 200) this.setData({ merchant: res.data });
  },
  goProducts() { wx.navigateTo({ url: '/pages/merchant-products/merchant-products' }); },
  goOrders() { wx.navigateTo({ url: '/pages/merchant-orders/merchant-orders' }); },
  goShop() { wx.navigateTo({ url: '/pages/merchant-shop/merchant-shop' }); },
  goStats() { wx.navigateTo({ url: '/pages/merchant-stats/merchant-stats' }); },
  goMessages() { wx.navigateTo({ url: '/pages/merchant-messages/merchant-messages' }); },
  goReviews() { wx.navigateTo({ url: '/pages/merchant-reviews/merchant-reviews' }); }
});
