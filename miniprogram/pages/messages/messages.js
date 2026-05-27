const api = require('../../utils/api');
Page({
  data: { messages: [] },
  onShow() { this.loadMessages(); },
  async loadMessages() {
    const res = await api.getMessages({ page: 1 });
    if (res.code === 200) this.setData({ messages: res.data.list || [] });
  },
  async readMsg(e) {
    const { id, rid, type } = e.currentTarget.dataset;
    await api.readMessage(id);
    if (type === 'task' && rid) wx.navigateTo({ url: '/pages/task-detail/task-detail?id=' + rid });
    else if (type === 'order' && rid) wx.navigateTo({ url: '/pages/order-detail/order-detail?id=' + rid });
    else this.loadMessages();
  },
  async readAll() {
    await api.readAllMessages();
    wx.showToast({ title: '全部已读' });
    this.loadMessages();
  }
});
