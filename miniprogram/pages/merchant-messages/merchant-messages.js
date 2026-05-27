const api = require('../../utils/api');
Page({
  data: { messages: [] },
  onShow() { this.loadMessages(); },
  async loadMessages() {
    const res = await api.getMessages({ page: 1 });
    if (res.code === 200) this.setData({ messages: res.data.list || [] });
  },
  async readMsg(e) {
    await api.readMessage(e.currentTarget.dataset.id);
    this.loadMessages();
  }
});
