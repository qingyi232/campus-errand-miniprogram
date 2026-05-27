const api = require('../../utils/api');

Page({
  data: { goods: null, commentText: '' },

  onLoad(options) {
    this.goodsId = options.id;
    this.loadDetail();
  },

  async loadDetail() {
    const res = await api.getMarketDetail(this.goodsId);
    if (res.code === 200) this.setData({ goods: res.data });
  },

  onCommentInput(e) { this.setData({ commentText: e.detail.value }); },

  async sendComment() {
    if (!wx.getStorageSync('token')) { wx.navigateTo({ url: '/pages/login/login' }); return; }
    if (!this.data.commentText.trim()) return wx.showToast({ title: '请输入留言内容', icon: 'none' });
    try {
      const res = await api.commentGoods(this.goodsId, { content: this.data.commentText });
      if (res.code === 200) {
        wx.showToast({ title: '留言成功' });
        this.setData({ commentText: '' });
        this.loadDetail();
      }
    } catch (e) {}
  },

  previewImg(e) {
    wx.previewImage({ current: e.currentTarget.dataset.url, urls: this.data.goods.images });
  }
});
