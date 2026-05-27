const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const goodsDir = path.join(__dirname, 'public/images/goods');

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
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = Math.min(w / 6, 48);
  ctx.font = `bold ${fontSize}px "Microsoft YaHei", "PingFang SC", sans-serif`;
  const lines = [];
  let currentLine = '';
  const maxWidth = w * 0.8;
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
  fs.writeFileSync(filePath, canvas.toBuffer('image/png'));
}

generateImage(400, 400, '#CCCCCC', '暂无图片', path.join(goodsDir, 'default.png'));
generateImage(200, 200, '#CCCCCC', '默认头像', path.join(__dirname, 'public/images/avatars/default.png'));
console.log('Default images generated');
