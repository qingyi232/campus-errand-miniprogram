const api = require('../../utils/api');
const { DEFAULT_GOODS_IMG } = require('../../utils/config');

Page({
  data: { goods: [], defaultImg: DEFAULT_GOODS_IMG },

  onShow() { this.loadGoods(); },

  async loadGoods() {
    const res = await api.getMyGoods();
    if (res.code === 200) this.setData({ goods: res.data || [] });
  },

  goPublish() {
    wx.navigateTo({ url: '/pages/market-publish/market-publish' });
  },

  editGoods(e) {
    wx.navigateTo({ url: '/pages/market-publish/market-publish?id=' + e.currentTarget.dataset.id });
  },

  async toggleStatus(e) {
    const { id, status } = e.currentTarget.dataset;
    const goods = this.data.goods.find(g => g.id == id);
    if (goods) {
      try {
        const res = await api.updateGoods(id, { ...goods, status, images: goods.images });
        if (res.code === 200) {
          wx.showToast({ title: '操作成功' });
          this.loadGoods();
        } else {
          wx.showToast({ title: res.msg || '操作失败', icon: 'none' });
        }
      } catch (e) { wx.showToast({ title: '操作失败', icon: 'none' }); }
    }
  },

  async markSold(e) {
    const id = e.currentTarget.dataset.id;
    const goods = this.data.goods.find(g => g.id == id);
    if (goods) {
      wx.showModal({
        title: '确认', content: '确定标记为已售出？',
        success: async (r) => {
          if (r.confirm) {
            await api.updateGoods(id, { ...goods, status: 'sold', images: goods.images });
            wx.showToast({ title: '已标记' });
            this.loadGoods();
          }
        }
      });
    }
  },

  deleteGoods(e) {
    wx.showModal({
      title: '确认删除', content: '确定删除这个商品吗？删除后不可恢复',
      success: async (r) => {
        if (r.confirm) {
          const res = await api.deleteGoods(e.currentTarget.dataset.id);
          if (res.code === 200) {
            wx.showToast({ title: '已删除' });
            this.loadGoods();
          }
        }
      }
    });
  }
});
