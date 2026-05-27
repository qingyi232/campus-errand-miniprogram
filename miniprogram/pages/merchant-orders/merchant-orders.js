const api = require('../../utils/api');
Page({
  data: { orders: [], status: '' },
  onShow() { this.loadOrders(); },
  changeStatus(e) { this.setData({ status: e.currentTarget.dataset.s }); this.loadOrders(); },
  async loadOrders() {
    const res = await api.getMerchantOrders(this.data.status ? { status: this.data.status } : null);
    if (res.code === 200) this.setData({ orders: res.data || [] });
  },
  async updateStatus(e) {
    const { id, s } = e.currentTarget.dataset;
    const res = await api.updateOrderStatus(id, { status: s });
    if (res.code === 200) { wx.showToast({ title: '操作成功' }); this.loadOrders(); }
  }
});
