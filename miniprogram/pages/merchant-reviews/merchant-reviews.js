const api = require('../../utils/api');

Page({
  data: { reviews: [], avgRating: '5.0', stars: '⭐⭐⭐⭐⭐' },

  onLoad() { this.loadReviews(); },

  async loadReviews() {
    const res = await api.getMerchantReviews();
    if (res.code === 200) {
      const reviews = (res.data || []).map(r => ({
        ...r,
        starsText: '⭐'.repeat(Math.max(1, Math.min(5, r.rating || 5)))
      }));
      let avg = 5.0;
      if (reviews.length > 0) {
        const sum = reviews.reduce((s, r) => s + r.rating, 0);
        avg = (sum / reviews.length).toFixed(1);
      }
      const starCount = Math.round(parseFloat(avg));
      this.setData({
        reviews,
        avgRating: avg,
        stars: '⭐'.repeat(starCount)
      });
    }
  }
});
