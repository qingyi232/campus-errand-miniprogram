const api = require('../../utils/api');
const { DEFAULT_AVATAR } = require('../../utils/config');

Page({
  data: {
    isLogin: false,
    userInfo: null,
    unreadCount: 0,
    publishCount: 0,
    acceptCount: 0,
    goodsCount: 0,
    defaultAvatar: DEFAULT_AVATAR
  },

  onShow() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    this.setData({ isLogin: !!token, userInfo });
    if (token) this.loadUserData();
  },

  async loadUserData() {
    try {
      const [infoRes, unreadRes, pubRes, accRes, goodsRes] = await Promise.all([
        api.getUserInfo(),
        api.getUnreadCount(),
        api.getMyPublished({ page: 1 }),
        api.getMyAccepted({ page: 1 }),
        api.getMyGoods()
      ]);
      if (infoRes.code === 200) {
        wx.setStorageSync('userInfo', infoRes.data);
        this.setData({
          userInfo: infoRes.data,
          unreadCount: unreadRes.code === 200 ? unreadRes.data : 0,
          publishCount: pubRes.code === 200 ? (pubRes.data || []).length : 0,
          acceptCount: accRes.code === 200 ? (accRes.data || []).length : 0,
          goodsCount: goodsRes.code === 200 ? (goodsRes.data || []).length : 0
        });
      }
    } catch (e) {}
  },

  goLogin() { wx.navigateTo({ url: '/pages/login/login' }); },
  goEditInfo() { wx.navigateTo({ url: '/pages/profile-info/profile-info' }); },
  goWallet() { wx.navigateTo({ url: '/pages/wallet/wallet' }); },
  goMyTasks() { wx.navigateTo({ url: '/pages/my-tasks/my-tasks' }); },
  goMyOrders() { wx.navigateTo({ url: '/pages/my-orders/my-orders' }); },
  goMyGoods() { wx.navigateTo({ url: '/pages/my-goods/my-goods' }); },
  goAddress() { wx.navigateTo({ url: '/pages/address/address' }); },
  goMessages() { wx.navigateTo({ url: '/pages/messages/messages' }); },

  goMerchant() {
    if (this.data.userInfo.isMerchant) {
      wx.navigateTo({ url: '/pages/merchant-index/merchant-index' });
    } else {
      wx.navigateTo({ url: '/pages/merchant-apply/merchant-apply' });
    }
  },

  logout() {
    wx.showModal({
      title: '提示', content: '确定退出登录？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          this.setData({ isLogin: false, userInfo: null });
          wx.switchTab({ url: '/pages/index/index' });
        }
      }
    });
  }
});
