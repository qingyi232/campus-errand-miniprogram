const api = require('../../utils/api');
const { DEFAULT_GOODS_IMG } = require('../../utils/config');

Page({
  data: {
    goods: [],
    categories: ['教材书籍', '数码产品', '生活用品', '服饰鞋帽', '运动户外', '其他'],
    currentCategory: '',
    keyword: '',
    sort: '',
    page: 1,
    loading: false,
    noMore: false,
    defaultImg: DEFAULT_GOODS_IMG
  },

  onLoad() { this.loadGoods(); },
  onShow() { this.loadGoods(); },
  onPullDownRefresh() { this.setData({ page: 1 }); this.loadGoods().then(() => wx.stopPullDownRefresh()); },
  onReachBottom() { if (!this.data.noMore) this.loadMore(); },

  filterCategory(e) {
    this.setData({ currentCategory: e.currentTarget.dataset.cate, page: 1 });
    this.loadGoods();
  },

  changeSort(e) {
    this.setData({ sort: e.currentTarget.dataset.sort, page: 1 });
    this.loadGoods();
  },

  onSearch(e) { this.setData({ keyword: e.detail.value }); },
  doSearch() { this.setData({ page: 1 }); this.loadGoods(); },

  async loadGoods() {
    this.setData({ loading: true });
    try {
      const res = await api.getMarketList({
        page: 1, category: this.data.currentCategory,
        keyword: this.data.keyword, sort: this.data.sort
      });
      if (res.code === 200) {
        this.setData({ goods: res.data.list || [], noMore: (res.data.list || []).length >= res.data.total });
      }
    } catch (e) {}
    this.setData({ loading: false });
  },

  async loadMore() {
    const page = this.data.page + 1;
    this.setData({ page });
    try {
      const res = await api.getMarketList({
        page, category: this.data.currentCategory,
        keyword: this.data.keyword, sort: this.data.sort
      });
      if (res.code === 200) {
        const goods = this.data.goods.concat(res.data.list || []);
        this.setData({ goods, noMore: goods.length >= res.data.total });
      }
    } catch (e) {}
  },

  goDetail(e) { wx.navigateTo({ url: '/pages/market-detail/market-detail?id=' + e.currentTarget.dataset.id }); },

  goPublish() {
    if (!wx.getStorageSync('token')) { wx.navigateTo({ url: '/pages/login/login' }); return; }
    wx.navigateTo({ url: '/pages/market-publish/market-publish' });
  }
});
