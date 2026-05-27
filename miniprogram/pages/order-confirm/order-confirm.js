const api = require('../../utils/api');
Page({
  data: { product: null, quantity: 1, address: '', phone: '', remark: '', balance: 0, submitting: false, totalAmount: '0.00' },
  onLoad(options) {
    this.productId = options.productId;
    this.setData({ quantity: parseInt(options.quantity) || 1 });
    this.loadData();
  },
  async loadData() {
    const [pRes, wRes] = await Promise.all([
      api.getProductDetail(this.productId),
      api.getWallet()
    ]);
    if (pRes.code === 200) {
      const p = pRes.data;
      try { p.images = typeof p.images === 'string' ? JSON.parse(p.images) : p.images; } catch(e) { p.images = []; }
      const totalAmount = (p.price * this.data.quantity).toFixed(2);
      this.setData({ product: p, totalAmount });
    }
    if (wRes.code === 200) this.setData({ balance: wRes.data.balance || 0 });
  },
  onAddressInput(e) { this.setData({ address: e.detail.value }); },
  onPhoneInput(e) { this.setData({ phone: e.detail.value }); },
  onRemarkInput(e) { this.setData({ remark: e.detail.value }); },
  async submitOrder() {
    const { product, quantity, address, phone, remark, balance, submitting } = this.data;
    if (submitting) return;
    if (!address.trim()) return wx.showToast({ title: '请输入收货地址', icon: 'none' });
    if (!phone.trim()) return wx.showToast({ title: '请输入联系电话', icon: 'none' });
    const total = (product.price * quantity).toFixed(2);
    if (parseFloat(balance) < parseFloat(total)) return wx.showToast({ title: '余额不足，请先充值', icon: 'none' });
    this.setData({ submitting: true });
    try {
      const res = await api.placeOrder({ product_id: this.productId, quantity, address, phone, remark });
      if (res.code === 200) {
        wx.showToast({ title: '下单成功' });
        setTimeout(() => { wx.navigateBack({ delta: 2 }); }, 1500);
      } else {
        wx.showToast({ title: res.msg || '下单失败', icon: 'none' });
      }
    } catch(e) {
      wx.showToast({ title: '下单失败', icon: 'none' });
    }
    this.setData({ submitting: false });
  }
});
