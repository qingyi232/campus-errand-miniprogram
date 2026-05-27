const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    task: null,
    statusName: '', typeName: '', statusColor: '',
    showActions: false, canAccept: false, canDeliver: false,
    canComplete: false, canReview: false, canCancel: false
  },

  onLoad(options) {
    this.taskId = options.id;
    this.loadTask();
  },

  onShow() { if (this.taskId) this.loadTask(); },

  async loadTask() {
    try {
      const res = await api.getTaskDetail(this.taskId);
      if (res.code === 200) {
        const task = res.data;
        if (task.reviews) {
          task.reviews = task.reviews.map(r => ({
            ...r,
            starsText: '⭐'.repeat(Math.max(1, Math.min(5, r.rating || 5)))
          }));
        }
        const userId = (wx.getStorageSync('userInfo') || {}).id;
        const isPublisher = task.user_id === userId;
        const isRunner = task.runner_id === userId;

        this.setData({
          task,
          statusName: util.getTaskStatusName(task.status),
          typeName: util.getTaskTypeName(task.type),
          statusColor: util.getTaskStatusColor(task.status),
          showActions: !!userId,
          canAccept: task.status === 'pending' && !isPublisher,
          canDeliver: task.status === 'accepted' && isRunner,
          canComplete: task.status === 'delivering' && isPublisher,
          canReview: task.status === 'completed' && (isPublisher || isRunner) && !task.reviews.find(r => r.reviewer_id === userId),
          canCancel: (task.status === 'pending' || task.status === 'accepted') && isPublisher
        });
      }
    } catch (e) {}
  },

  async acceptTask() {
    if (!wx.getStorageSync('token')) { wx.navigateTo({ url: '/pages/login/login' }); return; }
    wx.showModal({
      title: '确认接单', content: '确定接取这个任务吗？',
      success: async (r) => {
        if (r.confirm) {
          const res = await api.acceptTask(this.taskId);
          if (res.code === 200) { wx.showToast({ title: '接单成功' }); this.loadTask(); }
          else wx.showToast({ title: res.msg, icon: 'none' });
        }
      }
    });
  },

  async deliverTask() {
    const res = await api.deliverTask(this.taskId);
    if (res.code === 200) { wx.showToast({ title: '已开始配送' }); this.loadTask(); }
    else wx.showToast({ title: res.msg, icon: 'none' });
  },

  async completeTask() {
    wx.showModal({
      title: '确认收货', content: '确认已收到物品？',
      success: async (r) => {
        if (r.confirm) {
          const res = await api.completeTask(this.taskId);
          if (res.code === 200) { wx.showToast({ title: '已确认完成' }); this.loadTask(); }
          else wx.showToast({ title: res.msg, icon: 'none' });
        }
      }
    });
  },

  async cancelTask() {
    wx.showModal({
      title: '取消任务', content: '确定取消该任务吗？',
      success: async (r) => {
        if (r.confirm) {
          const res = await api.cancelTask(this.taskId);
          if (res.code === 200) { wx.showToast({ title: '已取消' }); this.loadTask(); }
        }
      }
    });
  },

  goReview() {
    const task = this.data.task;
    const userId = (wx.getStorageSync('userInfo') || {}).id;
    const revieweeId = task.user_id === userId ? task.runner_id : task.user_id;
    wx.navigateTo({ url: `/pages/review/review?taskId=${this.taskId}&revieweeId=${revieweeId}` });
  },

  callUser() { wx.makePhoneCall({ phoneNumber: this.data.task.user_phone }).catch(() => {}); },
  callRunner() { wx.makePhoneCall({ phoneNumber: this.data.task.runner_phone }).catch(() => {}); }
});
