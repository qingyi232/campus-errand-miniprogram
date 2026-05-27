const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    tasks: [],
    currentType: '',
    page: 1,
    loading: false,
    noMore: false
  },

  onLoad() {
    this.loadTasks();
  },

  onPullDownRefresh() {
    this.setData({ page: 1, noMore: false });
    this.loadTasks().then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (!this.data.noMore) this.loadMore();
  },

  filterType(e) {
    this.setData({ currentType: e.currentTarget.dataset.type, page: 1, noMore: false });
    this.loadTasks();
  },

  async loadTasks() {
    this.setData({ loading: true });
    try {
      const res = await api.getTaskHall({ page: 1, type: this.data.currentType });
      if (res.code === 200) {
        const tasks = (res.data.list || []).map(t => ({ ...t, timeAgo: util.timeAgo(t.created_at) }));
        this.setData({ tasks, noMore: tasks.length >= res.data.total });
      }
    } catch (e) {
      console.error(e);
    }
    this.setData({ loading: false });
  },

  async loadMore() {
    const page = this.data.page + 1;
    this.setData({ page });
    try {
      const res = await api.getTaskHall({ page, type: this.data.currentType });
      if (res.code === 200) {
        const newTasks = (res.data.list || []).map(t => ({ ...t, timeAgo: util.timeAgo(t.created_at) }));
        const tasks = this.data.tasks.concat(newTasks);
        this.setData({ tasks, noMore: tasks.length >= res.data.total });
      }
    } catch (e) {}
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/task-detail/task-detail?id=' + e.currentTarget.dataset.id });
  },

  async acceptTask(e) {
    if (!wx.getStorageSync('token')) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认接单',
      content: '确定要接取这个任务吗？',
      success: async (modalRes) => {
        if (modalRes.confirm) {
          try {
            const res = await api.acceptTask(id);
            if (res.code === 200) {
              wx.showToast({ title: '接单成功', icon: 'success' });
              this.loadTasks();
            } else {
              wx.showToast({ title: res.msg || '接单失败', icon: 'none' });
            }
          } catch (e) {
            wx.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  }
});
