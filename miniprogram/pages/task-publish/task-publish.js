Page({
  goType(e) {
    wx.navigateTo({ url: '/pages/' + e.currentTarget.dataset.type + '/' + e.currentTarget.dataset.type });
  }
});
