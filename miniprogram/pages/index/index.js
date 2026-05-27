const api = require('../../utils/api');
const util = require('../../utils/util');
const { DEFAULT_GOODS_IMG } = require('../../utils/config');

Page({
  data: {
    userInfo: null,
    banners: [],
    announcements: [],
    hotTasks: [],
    recommendGoods: [],
    unreadCount: 0,
    defaultImg: DEFAULT_GOODS_IMG
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    const userInfo = wx.getStorageSync('userInfo');
    this.setData({ userInfo });
    this.loadUnread();
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },

  async loadData() {
    try {
      const [bannersRes, announcementsRes, hotTasksRes, goodsRes] = await Promise.all([
        api.getBanners(),
        api.getAnnouncements(),
        api.getHotTasks(),
        api.getRecommendGoods()
      ]);
      const hotTasks = (hotTasksRes.data || []).map(t => ({
        ...t,
        timeAgo: util.timeAgo(t.created_at)
      }));
      this.setData({
        banners: bannersRes.data || [],
        announcements: announcementsRes.data || [],
        hotTasks,
        recommendGoods: goodsRes.data || []
      });
    } catch (e) {
      console.error('加载首页数据失败', e);
    }
  },

  async loadUnread() {
    if (!wx.getStorageSync('token')) return;
    try {
      const res = await api.getUnreadCount();
      if (res.code === 200) this.setData({ unreadCount: res.data });
    } catch (e) {}
  },

  onBannerTap(e) {
    const link = e.currentTarget.dataset.link;
    if (link) wx.switchTab({ url: link }).catch(() => wx.navigateTo({ url: link }));
  },

  goExpressPickup() {
    if (!this.checkLogin()) return;
    wx.navigateTo({ url: '/pages/express-pickup/express-pickup' });
  },

  goExpressSend() {
    if (!this.checkLogin()) return;
    wx.navigateTo({ url: '/pages/express-send/express-send' });
  },

  goHelpBuy() {
    if (!this.checkLogin()) return;
    wx.navigateTo({ url: '/pages/help-buy/help-buy' });
  },

  goMarket() {
    wx.switchTab({ url: '/pages/market/market' });
  },

  goHall() {
    wx.switchTab({ url: '/pages/hall/hall' });
  },

  goMessages() {
    if (!this.checkLogin()) return;
    wx.navigateTo({ url: '/pages/messages/messages' });
  },

  goTaskDetail(e) {
    wx.navigateTo({ url: '/pages/task-detail/task-detail?id=' + e.currentTarget.dataset.id });
  },

  goGoodsDetail(e) {
    wx.navigateTo({ url: '/pages/market-detail/market-detail?id=' + e.currentTarget.dataset.id });
  },

  goSearch() {},

  goShops() {
    wx.navigateTo({ url: '/pages/shop-list/shop-list' });
  },

  checkLogin() {
    if (!wx.getStorageSync('token')) {
      wx.navigateTo({ url: '/pages/login/login' });
      return false;
    }
    return true;
  }
});
