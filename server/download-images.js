const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const goodsDir = path.join(__dirname, 'public/images/goods');
const bannersDir = path.join(__dirname, 'public/images/banners');
const avatarsDir = path.join(__dirname, 'public/images/avatars');

function download(url, dest, maxRedirects = 8) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'image/*,*/*' },
      timeout: 20000
    }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode)) {
        let loc = res.headers.location;
        if (loc && !loc.startsWith('http')) loc = new URL(loc, url).href;
        res.resume();
        return download(loc, dest, maxRedirects - 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}`)); }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
      file.on('error', reject);
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}

const items = [
  // 商家商品 - 使用 Pexels/Unsplash 真实商品图
  { url: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=400&fit=crop', dest: path.join(goodsDir, 'pepsi.jpg'), name: '百事可乐' },
  { url: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400&h=400&fit=crop', dest: path.join(goodsDir, 'lays.jpg'), name: '乐事薯片' },
  { url: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=400&fit=crop', dest: path.join(goodsDir, 'noodle.jpg'), name: '方便面' },
  { url: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop', dest: path.join(goodsDir, 'water.jpg'), name: '矿泉水' },
  { url: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400&h=400&fit=crop', dest: path.join(goodsDir, 'pen.jpg'), name: '中性笔' },
  { url: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400&h=400&fit=crop', dest: path.join(goodsDir, 'notebook.jpg'), name: '笔记本' },
  { url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&h=400&fit=crop', dest: path.join(goodsDir, 'stapler.jpg'), name: '订书机' },
  { url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&h=400&fit=crop', dest: path.join(goodsDir, 'marker.jpg'), name: '马克笔' },
  // 二手商品
  { url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=400&fit=crop', dest: path.join(goodsDir, 'math-book.jpg'), name: '高等数学' },
  { url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop', dest: path.join(goodsDir, 'ipad.jpg'), name: 'iPad' },
  { url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop', dest: path.join(goodsDir, 'keyboard.jpg'), name: '蓝牙键盘' },
  { url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=400&fit=crop', dest: path.join(goodsDir, 'english-book.jpg'), name: '英语真题' },
  { url: 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400&h=400&fit=crop', dest: path.join(goodsDir, 'desk-lamp.jpg'), name: '台灯' },
  { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', dest: path.join(goodsDir, 'nike.jpg'), name: '耐克鞋' },
  { url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=400&fit=crop', dest: path.join(goodsDir, 'vocab-book.jpg'), name: '词汇书' },
  { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', dest: path.join(goodsDir, 'headphone.jpg'), name: '索尼耳机' },
  // 默认图
  { url: 'https://placehold.co/400x400/EEEEEE/999999.png?text=No+Image', dest: path.join(goodsDir, 'default.png'), name: '默认图' },
  // Banners - 校园/配送主题
  { url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=750&h=340&fit=crop', dest: path.join(bannersDir, 'banner1.jpg'), name: 'Banner-校园' },
  { url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=750&h=340&fit=crop', dest: path.join(bannersDir, 'banner2.jpg'), name: 'Banner-市场' },
  { url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=750&h=340&fit=crop', dest: path.join(bannersDir, 'banner3.jpg'), name: 'Banner-团队' },
  // Avatars - 使用 ui-avatars
  { url: 'https://ui-avatars.com/api/?name=Admin&size=200&background=36B37E&color=fff&bold=true', dest: path.join(avatarsDir, 'admin.png'), name: 'Avatar-admin' },
  { url: 'https://ui-avatars.com/api/?name=Li&size=200&background=0084FF&color=fff&bold=true', dest: path.join(avatarsDir, 'li.png'), name: 'Avatar-li' },
  { url: 'https://ui-avatars.com/api/?name=Wang&size=200&background=FF9500&color=fff&bold=true', dest: path.join(avatarsDir, 'wang.png'), name: 'Avatar-wang' },
  { url: 'https://ui-avatars.com/api/?name=Zhang&size=200&background=CF1322&color=fff&bold=true', dest: path.join(avatarsDir, 'zhang.png'), name: 'Avatar-zhang' },
  { url: 'https://ui-avatars.com/api/?name=Zhao&size=200&background=7B68EE&color=fff&bold=true', dest: path.join(avatarsDir, 'zhao.png'), name: 'Avatar-zhao' },
  { url: 'https://ui-avatars.com/api/?name=Liu&size=200&background=FA8C16&color=fff&bold=true', dest: path.join(avatarsDir, 'liu.png'), name: 'Avatar-liu' },
  { url: 'https://ui-avatars.com/api/?name=Chen&size=200&background=52C41A&color=fff&bold=true', dest: path.join(avatarsDir, 'chen.png'), name: 'Avatar-chen' },
  { url: 'https://ui-avatars.com/api/?name=Sun&size=200&background=1890FF&color=fff&bold=true', dest: path.join(avatarsDir, 'sun.png'), name: 'Avatar-sun' },
  { url: 'https://ui-avatars.com/api/?name=Default&size=200&background=CCCCCC&color=fff', dest: path.join(avatarsDir, 'default.png'), name: 'Avatar-default' },
];

async function main() {
  let ok = 0, fail = 0;
  for (const item of items) {
    try {
      await download(item.url, item.dest);
      const stat = fs.statSync(item.dest);
      if (stat.size < 500) {
        console.log(`WARN: ${item.name} - too small (${stat.size}B)`);
        fail++;
      } else {
        console.log(`OK: ${item.name} (${(stat.size/1024).toFixed(0)}KB)`);
        ok++;
      }
    } catch (e) {
      console.log(`FAIL: ${item.name} - ${e.message}`);
      fail++;
    }
  }
  console.log(`\nDone: ${ok} ok, ${fail} fail`);
}

main();
