const api = require('../../utils/api');
Page({
  data: {
    stats: { today: {}, week: {}, month: {}, total: {}, hotProducts: [], dailyStats: [] },
    chartScale: 80,
    chartData: []
  },
  onLoad() { this.loadStats(); },
  async loadStats() {
    const res = await api.getMerchantStats();
    if (res.code === 200) {
      const data = res.data;
      // Fill missing dates for last 14 days
      const chartData = [];
      const now = new Date();
      const existMap = {};
      (data.dailyStats || []).forEach(d => {
        const key = d.date ? d.date.slice(0, 10) : '';
        existMap[key] = d.orders || 0;
      });
      for (let i = 13; i >= 0; i--) {
        const dt = new Date(now);
        dt.setDate(dt.getDate() - i);
        const key = dt.toISOString().slice(0, 10);
        const label = (dt.getMonth() + 1) + '/' + dt.getDate();
        chartData.push({
          date: key,
          dateLabel: label,
          orders: existMap[key] || 0
        });
      }
      const maxOrders = Math.max(...chartData.map(d => d.orders), 1);
      const chartScale = Math.floor(240 / maxOrders);
      this.setData({ stats: data, chartData, chartScale });
    }
  }
});
