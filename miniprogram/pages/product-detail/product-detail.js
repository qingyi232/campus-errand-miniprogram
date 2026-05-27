const api = require('../../utils/api');
Page({
  data: { product: null, quantity: 1, totalPrice: '0.00' },
  onLoad(options) {
    this.productId = options.id;
    this.loadDetail();
  },
  async loadDetail() {
    const res = await api.getProductDetail(this.productId);
    if (res.code === 200) {
      const p = res.data;
      try { p.images = typeof p.images === 'string' ? JSON.parse(p.images) : p.images; } catch(e) { p.images = []; }
      this.setData({ product: p, totalPrice: (p.price * this.data.quantity).toFixed(2) });
    }
  },
  updatePrice() {
    if (this.data.product) this.setData({ totalPrice: (this.data.product.price * this.data.quantity).toFixed(2) });
  },
  minus() { if (this.data.quantity > 1) { this.setData({ quantity: this.data.quantity - 1 }); this.updatePrice(); } },
  plus() { if (this.data.quantity < this.data.product.stock) { this.setData({ quantity: this.data.quantity + 1 }); this.updatePrice(); } },
  buyNow() {
    if (!wx.getStorageSync('token')) { wx.navigateTo({ url: '/pages/login/login' }); return; }
    wx.navigateTo({ url: '/pages/order-confirm/order-confirm?productId=' + this.productId + '&quantity=' + this.data.quantity });
  },
  previewImg(e) {
    wx.previewImage({ current: e.currentTarget.dataset.url, urls: this.data.product.images });
  }
});
