const api = require('../../utils/api');
Page({
  data: { tasks: [], status: '' },
  onShow() { this.loadTasks(); },
  changeStatus(e) { this.setData({ status: e.currentTarget.dataset.s }); this.loadTasks(); },
  async loadTasks() {
    const res = await api.getMyAccepted({ page: 1, status: this.data.status });
    if (res.code === 200) this.setData({ tasks: res.data || [] });
  },
  goDetail(e) { wx.navigateTo({ url: '/pages/task-detail/task-detail?id=' + e.currentTarget.dataset.id }); }
});
