const api = require('../../utils/api');
Page({
  data: { balance: '0.00', records: [], filterType: '' },
  onShow() { this.loadWallet(); this.loadRecords(); },
  changeFilter(e) { this.setData({ filterType: e.currentTarget.dataset.t }); this.loadRecords(); },
  async loadWallet() {
    const res = await api.getWallet();
    if (res.code === 200) this.setData({ balance: res.data.balance });
  },
  async loadRecords() {
    const res = await api.getWalletRecords({ page: 1, type: this.data.filterType });
    if (res.code === 200) this.setData({ records: res.data || [] });
  },
  recharge() {
    wx.showModal({
      title: '充值', editable: true, placeholderText: '请输入充值金额',
      success: async (r) => {
        if (r.confirm && r.content) {
          const amount = parseFloat(r.content);
          if (isNaN(amount) || amount <= 0) return wx.showToast({ title: '请输入有效金额', icon: 'none' });
          const res = await api.recharge({ amount });
          if (res.code === 200) { wx.showToast({ title: '充值成功' }); this.loadWallet(); this.loadRecords(); }
        }
      }
    });
  }
});
