const { BASE_URL } = require('./config');

function getToken() {
  return wx.getStorageSync('token') || '';
}

function request(url, method = 'GET', data = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
      },
      success(res) {
        if (res.data.code === 401) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          wx.navigateTo({ url: '/pages/login/login' });
          reject(new Error('请先登录'));
          return;
        }
        resolve(res.data);
      },
      fail(err) {
        wx.showToast({ title: '网络请求失败', icon: 'none' });
        reject(err);
      }
    });
  });
}

const api = {
  // 用户
  login: (data) => request('/user/login', 'POST', data),
  loginByPassword: (data) => request('/user/login/password', 'POST', data),
  getUserInfo: () => request('/user/info'),
  updateUserInfo: (data) => request('/user/info', 'PUT', data),
  bindPhone: (data) => request('/user/bindPhone', 'POST', data),

  // 地址
  getAddressList: () => request('/user/address'),
  addAddress: (data) => request('/user/address', 'POST', data),
  updateAddress: (id, data) => request('/user/address/' + id, 'PUT', data),
  deleteAddress: (id) => request('/user/address/' + id, 'DELETE'),

  // 消息
  getMessages: (params) => request('/user/messages?page=' + (params.page || 1)),
  readMessage: (id) => request('/user/messages/' + id + '/read', 'PUT'),
  readAllMessages: () => request('/user/messages/readAll', 'PUT'),
  getUnreadCount: () => request('/user/messages/unread'),

  // 钱包
  getWallet: () => request('/user/wallet'),
  getWalletRecords: (params) => request('/user/wallet/records?page=' + (params.page || 1) + (params.type ? '&type=' + params.type : '')),
  recharge: (data) => request('/user/wallet/recharge', 'POST', data),

  // 任务
  publishTask: (data) => request('/task', 'POST', data),
  getTaskHall: (params) => request('/task/hall?page=' + (params.page || 1) + (params.type ? '&type=' + params.type : '')),
  getTaskDetail: (id) => request('/task/' + id),
  acceptTask: (id) => request('/task/' + id + '/accept', 'POST'),
  deliverTask: (id) => request('/task/' + id + '/delivering', 'POST'),
  completeTask: (id) => request('/task/' + id + '/complete', 'POST'),
  cancelTask: (id) => request('/task/' + id + '/cancel', 'POST'),
  reviewTask: (id, data) => request('/task/' + id + '/review', 'POST', data),
  getMyPublished: (params) => request('/task/my/published?page=' + (params.page || 1) + (params.status ? '&status=' + params.status : '')),
  getMyAccepted: (params) => request('/task/my/accepted?page=' + (params.page || 1) + (params.status ? '&status=' + params.status : '')),

  // 二手市场
  getMarketList: (params) => {
    let url = '/market?page=' + (params.page || 1);
    if (params.category) url += '&category=' + params.category;
    if (params.keyword) url += '&keyword=' + encodeURIComponent(params.keyword);
    if (params.sort) url += '&sort=' + params.sort;
    return request(url);
  },
  getMarketDetail: (id) => request('/market/' + id),
  publishGoods: (data) => request('/market', 'POST', data),
  updateGoods: (id, data) => request('/market/' + id, 'PUT', data),
  deleteGoods: (id) => request('/market/' + id, 'DELETE'),
  getMyGoods: () => request('/market/my/list'),
  commentGoods: (id, data) => request('/market/' + id + '/comment', 'POST', data),

  // 商家
  merchantApply: (data) => request('/merchant/apply', 'POST', data),
  getMerchantInfo: () => request('/merchant/info'),
  updateMerchantInfo: (data) => request('/merchant/info', 'PUT', data),
  getMerchantProducts: (params) => request('/merchant/products' + (params ? '?status=' + params.status : '')),
  addMerchantProduct: (data) => request('/merchant/products', 'POST', data),
  updateMerchantProduct: (id, data) => request('/merchant/products/' + id, 'PUT', data),
  deleteMerchantProduct: (id) => request('/merchant/products/' + id, 'DELETE'),
  getMerchantOrders: (params) => request('/merchant/orders' + (params && params.status ? '?status=' + params.status : '')),
  updateOrderStatus: (id, data) => request('/merchant/orders/' + id + '/status', 'PUT', data),
  getMerchantStats: () => request('/merchant/stats'),
  getMerchantReviews: () => request('/merchant/reviews'),

  // 商家店铺（用户端浏览）
  getShopList: () => request('/merchant/shops'),
  getShopDetail: (id) => request('/merchant/shops/' + id),
  getProductDetail: (id) => request('/merchant/product/' + id),
  placeOrder: (data) => request('/merchant/place-order', 'POST', data),
  getMyShopOrders: (params) => request('/merchant/my-orders' + (params && params.status ? '?status=' + params.status : '')),
  getOrderDetail: (id) => request('/merchant/order/' + id),

  // 公共
  getBanners: () => request('/common/banners'),
  getAnnouncements: () => request('/common/announcements'),
  getCategories: (type) => request('/common/categories' + (type ? '?type=' + type : '')),
  getHotTasks: () => request('/common/hot-tasks'),
  getRecommendGoods: () => request('/common/recommend-goods'),
};

module.exports = api;
