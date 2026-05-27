const mysql = require('mysql2/promise');
const https = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { method: 'HEAD', timeout: 8000 }, (res) => {
      resolve({ url, status: res.statusCode });
    }).on('error', (e) => {
      resolve({ url, status: 'ERROR', msg: e.message });
    });
  });
}

(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: 'root', database: 'campus_errand' });

  const [goods] = await c.query('SELECT id, title, images FROM second_hand_goods');
  const [products] = await c.query('SELECT id, name, images FROM merchant_products');
  const [banners] = await c.query('SELECT id, title, image_url FROM banners');

  const checks = [];

  for (const g of goods) {
    const imgs = JSON.parse(g.images || '[]');
    for (const url of imgs) checks.push({ source: `goods#${g.id} ${g.title}`, url });
  }
  for (const p of products) {
    const imgs = JSON.parse(p.images || '[]');
    for (const url of imgs) checks.push({ source: `product#${p.id} ${p.name}`, url });
  }
  for (const b of banners) {
    checks.push({ source: `banner#${b.id} ${b.title}`, url: b.image_url });
  }

  console.log(`Checking ${checks.length} images...\n`);
  const results = await Promise.all(checks.map(async (item) => {
    const r = await checkUrl(item.url);
    return { ...item, status: r.status };
  }));

  for (const r of results) {
    const ok = r.status === 200 || r.status === 301 || r.status === 302;
    console.log(`${ok ? 'OK' : 'FAIL'} [${r.status}] ${r.source}`);
    if (!ok) console.log(`  URL: ${r.url}`);
  }

  await c.end();
})();
