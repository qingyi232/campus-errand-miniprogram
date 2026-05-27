const api = require('../../utils/api');
Page({
  data: { order: null },
  onLoad(options) {
    this.orderId = options.id;
    this.loadOrder();
  },
  async loadOrder() {
    const res = await api.getOrderDetail(this.orderId);
    if (res.code === 200) {
      const o = res.data;
      const statusMap = { pending: '待确认', preparing: '准备中', ready: '待取货', completed: '已完成', cancelled: '已取消' };
      o.statusText = statusMap[o.status] || o.status;
      try { o.product_images = typeof o.product_images === 'string' ? JSON.parse(o.product_images) : (o.product_images || []); } catch(e) { o.product_images = []; }
      this.setData({ order: o });
    }
  }
});
