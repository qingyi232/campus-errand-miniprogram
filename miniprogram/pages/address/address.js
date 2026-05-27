const api = require('../../utils/api');
Page({
  data: { addresses: [] },
  onShow() { this.loadAddresses(); },
  async loadAddresses() {
    const res = await api.getAddressList();
    if (res.code === 200) this.setData({ addresses: res.data || [] });
  },
  addAddr() { wx.navigateTo({ url: '/pages/address-edit/address-edit' }); },
  editAddr(e) { wx.navigateTo({ url: '/pages/address-edit/address-edit?id=' + e.currentTarget.dataset.id }); },
  async setDefault(e) {
    const id = e.currentTarget.dataset.id;
    const addr = this.data.addresses.find(a => a.id === id);
    if (addr) {
      await api.updateAddress(id, { ...addr, is_default: 1 });
      wx.showToast({ title: '设置成功' });
      this.loadAddresses();
    }
  },
  delAddr(e) {
    wx.showModal({
      title: '提示', content: '确定删除此地址？',
      success: async (r) => {
        if (r.confirm) {
          await api.deleteAddress(e.currentTarget.dataset.id);
          wx.showToast({ title: '已删除' });
          this.loadAddresses();
        }
      }
    });
  }
});
