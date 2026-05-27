const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../miniprogram/images/icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

function drawIcon(size, bgColor, drawFn, filePath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  drawFn(ctx, size);
  fs.writeFileSync(filePath, canvas.toBuffer('image/png'));
}

const s = 80;

function iconPickup(ctx, s) {
  ctx.strokeStyle = '#36B37E'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const cx = s/2, cy = s/2;
  ctx.beginPath(); ctx.rect(cx-18, cy-14, 36, 28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx-18, cy-6); ctx.lineTo(cx+18, cy-6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx-6, cy-14); ctx.lineTo(cx-6, cy-6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx+6, cy-14); ctx.lineTo(cx+6, cy-6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx-8, cy+2); ctx.lineTo(cx+8, cy+2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx-5, cy+8); ctx.lineTo(cx+5, cy+8); ctx.stroke();
}

function iconSend(ctx, s) {
  ctx.strokeStyle = '#0084FF'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const cx = s/2, cy = s/2;
  ctx.beginPath(); ctx.moveTo(cx-18, cy-10); ctx.lineTo(cx+18, cy-10); ctx.lineTo(cx+18, cy+14);
  ctx.lineTo(cx-18, cy+14); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx-18, cy-10); ctx.lineTo(cx, cy+2); ctx.lineTo(cx+18, cy-10); ctx.stroke();
}

function iconBuy(ctx, s) {
  ctx.strokeStyle = '#FF9500'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const cx = s/2, cy = s/2;
  ctx.beginPath(); ctx.moveTo(cx-20, cy-16); ctx.lineTo(cx-14, cy-16); ctx.lineTo(cx-8, cy+8);
  ctx.lineTo(cx+18, cy+8); ctx.lineTo(cx+20, cy-6); ctx.lineTo(cx-10, cy-6); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx-6, cy+16, 3, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx+14, cy+16, 3, 0, Math.PI*2); ctx.stroke();
}

function iconMarket(ctx, s) {
  ctx.strokeStyle = '#7B68EE'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const cx = s/2, cy = s/2;
  ctx.beginPath(); ctx.moveTo(cx-18, cy-8); ctx.lineTo(cx-18, cy+16); ctx.lineTo(cx+18, cy+16);
  ctx.lineTo(cx+18, cy-8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx-22, cy-8); ctx.lineTo(cx, cy-20); ctx.lineTo(cx+22, cy-8); ctx.stroke();
  ctx.beginPath(); ctx.rect(cx-6, cy+2, 12, 14); ctx.stroke();
}

function iconSearch(ctx, s) {
  ctx.strokeStyle = '#999'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  const cx = s/2-4, cy = s/2-4;
  ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx+9, cy+9); ctx.lineTo(cx+18, cy+18); ctx.stroke();
}

function iconBell(ctx, s) {
  ctx.strokeStyle = '#FF5630'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const cx = s/2, cy = s/2;
  ctx.beginPath(); ctx.moveTo(cx-14, cy+4); ctx.quadraticCurveTo(cx-14, cy-16, cx, cy-16);
  ctx.quadraticCurveTo(cx+14, cy-16, cx+14, cy+4); ctx.lineTo(cx+16, cy+8);
  ctx.lineTo(cx-16, cy+8); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx-4, cy+8); ctx.quadraticCurveTo(cx, cy+16, cx+4, cy+8); ctx.stroke();
}

function iconLocation(ctx, s) {
  ctx.strokeStyle = '#36B37E'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const cx = s/2, cy = s/2-2;
  ctx.beginPath(); ctx.moveTo(cx, cy+20); ctx.quadraticCurveTo(cx-18, cy, cx-14, cy-8);
  ctx.arc(cx, cy-8, 14, Math.PI, 0); ctx.quadraticCurveTo(cx+18, cy, cx, cy+20); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy-8, 5, 0, Math.PI*2); ctx.stroke();
}

function iconList(ctx, s) {
  ctx.strokeStyle = '#6B778C'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  const cx = s/2;
  [-10, 0, 10].forEach(dy => {
    ctx.beginPath(); ctx.arc(cx-14, s/2+dy, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx-6, s/2+dy); ctx.lineTo(cx+16, s/2+dy); ctx.stroke();
  });
}

function iconWallet(ctx, s) {
  ctx.strokeStyle = '#36B37E'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const cx = s/2, cy = s/2;
  ctx.beginPath(); ctx.rect(cx-18, cy-12, 36, 24); ctx.stroke();
  ctx.beginPath(); ctx.rect(cx+8, cy-4, 12, 8); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx+14, cy, 2, 0, Math.PI*2); ctx.fillStyle = '#36B37E'; ctx.fill();
}

function iconStar(ctx, s) {
  ctx.fillStyle = '#FFD700'; ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1;
  const cx = s/2, cy = s/2;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 72 - 90) * Math.PI / 180;
    const innerAngle = ((i * 72 + 36) - 90) * Math.PI / 180;
    const outerR = 16, innerR = 7;
    if (i === 0) ctx.moveTo(cx + outerR * Math.cos(angle), cy + outerR * Math.sin(angle));
    else ctx.lineTo(cx + outerR * Math.cos(angle), cy + outerR * Math.sin(angle));
    ctx.lineTo(cx + innerR * Math.cos(innerAngle), cy + innerR * Math.sin(innerAngle));
  }
  ctx.closePath(); ctx.fill();
}

function iconStarEmpty(ctx, s) {
  ctx.strokeStyle = '#DDD'; ctx.lineWidth = 2;
  const cx = s/2, cy = s/2;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 72 - 90) * Math.PI / 180;
    const innerAngle = ((i * 72 + 36) - 90) * Math.PI / 180;
    const outerR = 16, innerR = 7;
    if (i === 0) ctx.moveTo(cx + outerR * Math.cos(angle), cy + outerR * Math.sin(angle));
    else ctx.lineTo(cx + outerR * Math.cos(angle), cy + outerR * Math.sin(angle));
    ctx.lineTo(cx + innerR * Math.cos(innerAngle), cy + innerR * Math.sin(innerAngle));
  }
  ctx.closePath(); ctx.stroke();
}

function iconKey(ctx, s) {
  ctx.strokeStyle = '#6B778C'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const cx = s/2, cy = s/2;
  ctx.beginPath(); ctx.arc(cx-8, cy-6, 8, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy-6); ctx.lineTo(cx+18, cy-6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx+18, cy-6); ctx.lineTo(cx+18, cy+2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx+12, cy-6); ctx.lineTo(cx+12, cy); ctx.stroke();
}

function iconChat(ctx, s) {
  ctx.strokeStyle = '#0084FF'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const cx = s/2, cy = s/2;
  ctx.beginPath();
  ctx.moveTo(cx-16, cy-12); ctx.lineTo(cx+16, cy-12); ctx.quadraticCurveTo(cx+20, cy-12, cx+20, cy-8);
  ctx.lineTo(cx+20, cy+4); ctx.quadraticCurveTo(cx+20, cy+8, cx+16, cy+8);
  ctx.lineTo(cx-4, cy+8); ctx.lineTo(cx-10, cy+16); ctx.lineTo(cx-10, cy+8);
  ctx.lineTo(cx-16, cy+8); ctx.quadraticCurveTo(cx-20, cy+8, cx-20, cy+4);
  ctx.lineTo(cx-20, cy-8); ctx.quadraticCurveTo(cx-20, cy-12, cx-16, cy-12);
  ctx.stroke();
}

function iconChart(ctx, s) {
  ctx.strokeStyle = '#36B37E'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  const cx = s/2, cy = s/2;
  ctx.beginPath(); ctx.moveTo(cx-16, cy+14); ctx.lineTo(cx-16, cy-14); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx-16, cy+14); ctx.lineTo(cx+16, cy+14); ctx.stroke();
  ctx.fillStyle = '#36B37E';
  ctx.fillRect(cx-12, cy+2, 6, 12);
  ctx.fillStyle = '#0084FF';
  ctx.fillRect(cx-3, cy-6, 6, 20);
  ctx.fillStyle = '#FF9500';
  ctx.fillRect(cx+6, cy-2, 6, 16);
}

function iconAnnounce(ctx, s) {
  ctx.strokeStyle = '#FF9500'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const cx = s/2, cy = s/2;
  ctx.beginPath(); ctx.moveTo(cx-16, cy-8); ctx.lineTo(cx+8, cy-16); ctx.lineTo(cx+8, cy+8);
  ctx.lineTo(cx-16, cy); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx+8, cy-8); ctx.lineTo(cx+16, cy-8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx+8, cy); ctx.lineTo(cx+16, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx+8, cy-4); ctx.lineTo(cx+18, cy-4); ctx.stroke();
}

const icons = [
  { name: 'pickup', fn: iconPickup },
  { name: 'send', fn: iconSend },
  { name: 'buy', fn: iconBuy },
  { name: 'market', fn: iconMarket },
  { name: 'search', fn: iconSearch },
  { name: 'bell', fn: iconBell },
  { name: 'location', fn: iconLocation },
  { name: 'list', fn: iconList },
  { name: 'wallet', fn: iconWallet },
  { name: 'star', fn: iconStar },
  { name: 'star-empty', fn: iconStarEmpty },
  { name: 'key', fn: iconKey },
  { name: 'chat', fn: iconChat },
  { name: 'chart', fn: iconChart },
  { name: 'announce', fn: iconAnnounce },
];

icons.forEach(icon => {
  drawIcon(s, 'transparent', icon.fn, path.join(iconsDir, `${icon.name}.png`));
  console.log(`Generated: ${icon.name}.png`);
});

console.log(`\nAll ${icons.length} icons generated in ${iconsDir}`);
