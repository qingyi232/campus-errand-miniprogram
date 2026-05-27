const api = require('../../utils/api');

Page({
  data: {
    username: '',
    password: ''
  },

  onUsernameInput(e) { this.setData({ username: e.detail.value }); },
  onPasswordInput(e) { this.setData({ password: e.detail.value }); },

  fillAdmin() { this.setData({ username: 'admin', password: 'admin123' }); },
  fillUser() { this.setData({ username: '13800001111', password: '123456' }); },
  fillMerchant() { this.setData({ username: '13800004444', password: '123456' }); },

  async wxLogin() {
    wx.showLoading({ title: '登录中...' });
    try {
      const res = await api.login({ code: 'wx_' + Date.now(), nickName: '微信用户', avatarUrl: '' });
      if (res.code === 200) {
        wx.setStorageSync('token', res.data.token);
        wx.setStorageSync('userInfo', res.data.userInfo);
        getApp().globalData.token = res.data.token;
        getApp().globalData.userInfo = res.data.userInfo;
        wx.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 500);
      } else {
        wx.showToast({ title: res.msg || '登录失败', icon: 'none' });
      }
    } catch (e) {
      wx.showToast({ title: '登录失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  async passwordLogin() {
    const { username, password } = this.data;
    if (!username || !password) {
      wx.showToast({ title: '请填写账号和密码', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '登录中...' });
    try {
      const res = await api.loginByPassword({ username, password });
      if (res.code === 200) {
        wx.setStorageSync('token', res.data.token);
        wx.setStorageSync('userInfo', res.data.userInfo);
        getApp().globalData.token = res.data.token;
        getApp().globalData.userInfo = res.data.userInfo;
        wx.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 500);
      } else {
        wx.showToast({ title: res.msg || '登录失败', icon: 'none' });
      }
    } catch (e) {
      wx.showToast({ title: '登录失败', icon: 'none' });
    }
    wx.hideLoading();
  }
});
