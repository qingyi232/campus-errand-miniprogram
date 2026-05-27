const api = require('../../utils/api');
Page({
  data: {
    rating: 5, content: '',
    ratingTexts: ['非常差', '比较差', '一般', '比较好', '非常好']
  },
  onLoad(options) { this.taskId = options.taskId; this.revieweeId = options.revieweeId; },
  setRating(e) { this.setData({ rating: parseInt(e.currentTarget.dataset.r) }); },
  onContentInput(e) { this.setData({ content: e.detail.value }); },
  async submit() {
    wx.showLoading({ title: '提交中...' });
    try {
      const res = await api.reviewTask(this.taskId, {
        rating: this.data.rating,
        content: this.data.content,
        reviewee_id: parseInt(this.revieweeId)
      });
      if (res.code === 200) {
        wx.showToast({ title: '评价成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1000);
      } else wx.showToast({ title: res.msg, icon: 'none' });
    } catch (e) { wx.showToast({ title: '提交失败', icon: 'none' }); }
    wx.hideLoading();
  }
});
