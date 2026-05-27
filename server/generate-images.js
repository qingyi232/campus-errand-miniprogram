const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const goodsDir = path.join(__dirname, 'public/images/goods');
const bannersDir = path.join(__dirname, 'public/images/banners');
const avatarsDir = path.join(__dirname, 'public/images/avatars');

function generateImage(w, h, bgColor, text, filePath) {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, w, h);

  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, 'rgba(255,255,255,0.1)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.15)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath();
  ctx.arc(w * 0.75, h * 0.25, w * 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const maxWidth = w * 0.8;
  let fontSize = Math.min(w / 6, 48);
  ctx.font = `bold ${fontSize}px "Microsoft YaHei", "PingFang SC", sans-serif`;

  const lines = [];
  let currentLine = '';
  for (const char of text) {
    const testLine = currentLine + char;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const lineHeight = fontSize * 1.4;
  const startY = h / 2 - (lines.length - 1) * lineHeight / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, w / 2, startY + i * lineHeight);
  });

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buf);
}

const merchantProducts = [
  { file: 'pepsi.png', name: '百事可乐', color: '#0063BE' },
  { file: 'lays.png', name: '乐事薯片', color: '#E31937' },
  { file: 'noodle.png', name: '康师傅泡面', color: '#D4380D' },
  { file: 'water.png', name: '农夫山泉', color: '#1890FF' },
  { file: 'pen.png', name: '晨光中性笔', color: '#333333' },
  { file: 'notebook.png', name: 'A4笔记本', color: '#7B68EE' },
  { file: 'stapler.png', name: '得力订书机', color: '#52C41A' },
  { file: 'marker.png', name: '马克笔套装', color: '#FA8C16' },
];

const secondHandGoods = [
  { file: 'math-book.png', name: '高等数学', color: '#1A5276' },
  { file: 'ipad.png', name: 'iPad Air 5', color: '#2C3E50' },
  { file: 'keyboard.png', name: '罗技K380键盘', color: '#2F4F4F' },
  { file: 'english-book.png', name: '四级英语真题', color: '#CF1322' },
  { file: 'desk-lamp.png', name: '小米台灯Pro', color: '#DAA520' },
  { file: 'nike.png', name: '耐克Air Force', color: '#111111' },
  { file: 'vocab-book.png', name: '考研英语红宝书', color: '#B22222' },
  { file: 'headphone.png', name: '索尼WH-1000XM4', color: '#1A1A2E' },
];

const banners = [
  { file: 'banner1.png', name: '新学期跑腿服务上线', color: '#36B37E' },
  { file: 'banner2.png', name: '二手市场开张啦', color: '#FF9500' },
  { file: 'banner3.png', name: '邀请好友得奖励', color: '#0084FF' },
];

const avatars = [
  { file: 'admin.png', name: '管理员', color: '#36B37E' },
  { file: 'li.png', name: '李同学', color: '#0084FF' },
  { file: 'wang.png', name: '王小明', color: '#FF9500' },
  { file: 'zhang.png', name: '张小红', color: '#CF1322' },
  { file: 'zhao.png', name: '赵同学', color: '#7B68EE' },
  { file: 'liu.png', name: '刘小雨', color: '#FA8C16' },
  { file: 'chen.png', name: '陈同学', color: '#52C41A' },
  { file: 'sun.png', name: '孙小梅', color: '#1890FF' },
];

console.log('Generating merchant product images...');
merchantProducts.forEach(item => {
  generateImage(400, 400, item.color, item.name, path.join(goodsDir, item.file));
  console.log(`  ${item.file}`);
});

console.log('Generating second-hand goods images...');
secondHandGoods.forEach(item => {
  generateImage(400, 400, item.color, item.name, path.join(goodsDir, item.file));
  console.log(`  ${item.file}`);
});

console.log('Generating banner images...');
banners.forEach(item => {
  generateImage(750, 340, item.color, item.name, path.join(bannersDir, item.file));
  console.log(`  ${item.file}`);
});

console.log('Generating avatar images...');
avatars.forEach(item => {
  generateImage(200, 200, item.color, item.name, path.join(avatarsDir, item.file));
  console.log(`  ${item.file}`);
});

console.log('\nAll images generated successfully!');
