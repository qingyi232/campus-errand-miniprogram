function formatTime(date) {
  if (!date) return '';
  if (typeof date === 'string') date = new Date(date);
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const h = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
}

function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string') date = new Date(date);
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${m}-${d}`;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return mins + '分钟前';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + '小时前';
  const days = Math.floor(hours / 24);
  if (days < 30) return days + '天前';
  return formatDate(date);
}

function getTaskTypeName(type) {
  const map = { express_pickup: '取快递', express_send: '寄快递', help_buy: '帮买服务' };
  return map[type] || type;
}

function getTaskStatusName(status) {
  const map = { pending: '待接单', accepted: '已接单', delivering: '配送中', completed: '已完成', cancelled: '已取消' };
  return map[status] || status;
}

function getTaskStatusColor(status) {
  const map = { pending: '#FF9500', accepted: '#36B37E', delivering: '#0084FF', completed: '#8F92A1', cancelled: '#E74C3C' };
  return map[status] || '#8F92A1';
}

module.exports = {
  formatTime, formatDate, timeAgo,
  getTaskTypeName, getTaskStatusName, getTaskStatusColor
};
