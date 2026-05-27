const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// 商家入驻申请
router.post('/apply', authMiddleware, async (req, res) => {
  try {
    const { shop_name, category, contact, qualification, business_hours, delivery_range } = req.body;
    const [exist] = await pool.query('SELECT id FROM merchants WHERE user_id = ?', [req.user.id]);
    if (exist.length > 0) return res.json({ code: 400, msg: '您已提交过入驻申请' });
    const [result] = await pool.query(
      'INSERT INTO merchants (user_id, shop_name, category, contact, qualification, business_hours, delivery_range) VALUES (?,?,?,?,?,?,?)',
      [req.user.id, shop_name, category, contact, qualification || '', business_hours || '', delivery_range || '']
    );
    res.json({ code: 200, data: { id: result.insertId }, msg: '申请已提交，等待审核' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 商家信息
router.get('/info', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT m.*, u.nickname, u.avatar FROM merchants m LEFT JOIN users u ON m.user_id = u.id WHERE m.user_id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.json({ code: 404, msg: '未找到商家信息' });
    res.json({ code: 200, data: rows[0] });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 更新店铺信息
router.put('/info', authMiddleware, async (req, res) => {
  try {
    const { shop_name, announcement, business_hours, delivery_range, contact } = req.body;
    await pool.query(
      'UPDATE merchants SET shop_name=?, announcement=?, business_hours=?, delivery_range=?, contact=? WHERE user_id=?',
      [shop_name, announcement, business_hours, delivery_range, contact, req.user.id]
    );
    res.json({ code: 200, msg: '更新成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 商品列表
router.get('/products', authMiddleware, async (req, res) => {
  try {
    const [merchant] = await pool.query('SELECT id FROM merchants WHERE user_id = ?', [req.user.id]);
    if (merchant.length === 0) return res.json({ code: 400, msg: '非商家用户' });
    const { status, keyword } = req.query;
    let sql = 'SELECT * FROM merchant_products WHERE merchant_id = ?';
    const params = [merchant[0].id];
    if (status !== undefined) { sql += ' AND status = ?'; params.push(parseInt(status)); }
    if (keyword) { sql += ' AND name LIKE ?'; params.push(`%${keyword}%`); }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(sql, params);
    const processed = rows.map(r => ({ ...r, images: r.images ? JSON.parse(r.images) : [] }));
    res.json({ code: 200, data: processed });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 添加商品
router.post('/products', authMiddleware, async (req, res) => {
  try {
    const [merchant] = await pool.query('SELECT id FROM merchants WHERE user_id = ? AND status = "approved"', [req.user.id]);
    if (merchant.length === 0) return res.json({ code: 400, msg: '商家未通过审核' });
    const { name, description, price, stock, category, images } = req.body;
    const [result] = await pool.query(
      'INSERT INTO merchant_products (merchant_id, name, description, price, stock, category, images) VALUES (?,?,?,?,?,?,?)',
      [merchant[0].id, name, description, price, stock || 0, category, JSON.stringify(images || [])]
    );
    res.json({ code: 200, data: { id: result.insertId }, msg: '添加成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 编辑商品
router.put('/products/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, price, stock, category, images, status } = req.body;
    await pool.query(
      'UPDATE merchant_products SET name=?, description=?, price=?, stock=?, category=?, images=?, status=? WHERE id=?',
      [name, description, price, stock, category, JSON.stringify(images || []), status, req.params.id]
    );
    res.json({ code: 200, msg: '更新成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 删除商品
router.delete('/products/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM merchant_products WHERE id = ?', [req.params.id]);
    res.json({ code: 200, msg: '删除成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 商家上架/下架商品
router.put('/products/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE merchant_products SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ code: 200, msg: '更新成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// ========== 用户端：浏览商家 & 下单 ==========

// 商家列表（用户端浏览）
router.get('/shops', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.*, u.nickname, u.avatar FROM merchants m
       LEFT JOIN users u ON m.user_id = u.id WHERE m.status = 'approved' ORDER BY m.rating DESC`
    );
    res.json({ code: 200, data: rows });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 商家店铺详情 + 商品列表（用户端）
router.get('/shops/:id', async (req, res) => {
  try {
    const [merchant] = await pool.query(
      `SELECT m.*, u.nickname, u.avatar FROM merchants m
       LEFT JOIN users u ON m.user_id = u.id WHERE m.id = ? AND m.status = 'approved'`,
      [req.params.id]
    );
    if (merchant.length === 0) return res.json({ code: 404, msg: '店铺不存在' });
    const [products] = await pool.query(
      'SELECT * FROM merchant_products WHERE merchant_id = ? AND status = 1 ORDER BY sales DESC',
      [req.params.id]
    );
    const processed = products.map(r => ({ ...r, images: r.images ? JSON.parse(r.images) : [] }));
    res.json({ code: 200, data: { shop: merchant[0], products: processed } });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 商品详情（用户端）
router.get('/product/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, m.shop_name, m.id as merchant_id, m.rating as shop_rating, m.business_hours, m.delivery_range
       FROM merchant_products p LEFT JOIN merchants m ON p.merchant_id = m.id WHERE p.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.json({ code: 404, msg: '商品不存在' });
    const product = rows[0];
    product.images = product.images ? JSON.parse(product.images) : [];
    res.json({ code: 200, data: product });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 用户下单
router.post('/place-order', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { product_id, quantity, address, phone, remark } = req.body;
    // 查商品
    const [products] = await conn.query('SELECT * FROM merchant_products WHERE id = ? AND status = 1', [product_id]);
    if (products.length === 0) { await conn.rollback(); conn.release(); return res.json({ code: 400, msg: '商品不存在或已下架' }); }
    const product = products[0];
    const qty = parseInt(quantity) || 1;
    if (product.stock < qty) { await conn.rollback(); conn.release(); return res.json({ code: 400, msg: '库存不足' }); }
    const totalAmount = (product.price * qty).toFixed(2);
    // 检查余额
    const [users] = await conn.query('SELECT balance FROM users WHERE id = ?', [req.user.id]);
    if (parseFloat(users[0].balance) < parseFloat(totalAmount)) {
      await conn.rollback(); conn.release();
      return res.json({ code: 400, msg: '余额不足，请先充值' });
    }
    // 扣余额
    await conn.query('UPDATE users SET balance = balance - ? WHERE id = ?', [totalAmount, req.user.id]);
    // 扣库存 + 加销量
    await conn.query('UPDATE merchant_products SET stock = stock - ?, sales = sales + ? WHERE id = ?', [qty, qty, product_id]);
    // 创建订单
    const orderNo = 'ORD' + Date.now() + Math.floor(Math.random() * 1000);
    const [result] = await conn.query(
      `INSERT INTO orders (order_no, merchant_id, user_id, product_id, product_name, quantity, total_amount, status, address, phone, remark)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [orderNo, product.merchant_id, req.user.id, product_id, product.name, qty, totalAmount, 'pending', address || '', phone || '', remark || '']
    );
    // 记录钱包流水
    const [balRow] = await conn.query('SELECT balance FROM users WHERE id = ?', [req.user.id]);
    await conn.query(
      'INSERT INTO wallet_records (user_id, type, amount, balance_after, description, related_id) VALUES (?,?,?,?,?,?)',
      [req.user.id, 'payment', -totalAmount, balRow[0].balance, `购买商品：${product.name} x${qty}`, result.insertId]
    );
    // 通知商家
    const [merchantUser] = await conn.query('SELECT user_id FROM merchants WHERE id = ?', [product.merchant_id]);
    if (merchantUser.length) {
      await conn.query(
        'INSERT INTO messages (user_id, type, title, content, related_id) VALUES (?,?,?,?,?)',
        [merchantUser[0].user_id, 'order', '新订单通知', `您有新订单：${product.name} x${qty}，金额 ¥${totalAmount}`, result.insertId]
      );
    }
    await conn.commit();
    conn.release();
    res.json({ code: 200, data: { id: result.insertId, order_no: orderNo }, msg: '下单成功' });
  } catch (e) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 用户订单列表
router.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `SELECT o.*, m.shop_name FROM orders o
      LEFT JOIN merchants m ON o.merchant_id = m.id WHERE o.user_id = ?`;
    const params = [req.user.id];
    if (status) { sql += ' AND o.status = ?'; params.push(status); }
    sql += ' ORDER BY o.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ code: 200, data: rows });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 订单详情（用户和商家都可查看）
router.get('/order/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.*, m.shop_name, u.nickname as buyer_name, u.phone as buyer_phone,
        p.images as product_images
       FROM orders o
       LEFT JOIN merchants m ON o.merchant_id = m.id
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN merchant_products p ON o.product_id = p.id
       WHERE o.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.json({ code: 404, msg: '订单不存在' });
    const order = rows[0];
    try { order.product_images = order.product_images ? JSON.parse(order.product_images) : []; } catch(e) { order.product_images = []; }
    res.json({ code: 200, data: order });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 商家订单列表
router.get('/orders', authMiddleware, async (req, res) => {
  try {
    const [merchant] = await pool.query('SELECT id FROM merchants WHERE user_id = ?', [req.user.id]);
    if (merchant.length === 0) return res.json({ code: 400, msg: '非商家用户' });
    const { status } = req.query;
    let sql = `SELECT o.*, u.nickname, u.avatar, u.phone FROM orders o
      LEFT JOIN users u ON o.user_id = u.id WHERE o.merchant_id = ?`;
    const params = [merchant[0].id];
    if (status) { sql += ' AND o.status = ?'; params.push(status); }
    sql += ' ORDER BY o.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ code: 200, data: rows });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 更新订单状态
router.put('/orders/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    const [order] = await pool.query('SELECT user_id FROM orders WHERE id = ?', [req.params.id]);
    if (order.length) {
      const statusText = { preparing: '备货中', ready: '待取货', completed: '已完成' };
      await pool.query(
        'INSERT INTO messages (user_id, type, title, content, related_id) VALUES (?,?,?,?,?)',
        [order[0].user_id, 'order', '订单状态更新', `您的订单状态已更新为：${statusText[status] || status}`, req.params.id]
      );
    }
    res.json({ code: 200, msg: '更新成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 商家数据统计
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [merchant] = await pool.query('SELECT id FROM merchants WHERE user_id = ?', [req.user.id]);
    if (merchant.length === 0) return res.json({ code: 400, msg: '非商家用户' });
    const mid = merchant[0].id;
    const [[todayOrders]] = await pool.query(
      'SELECT COUNT(*) as count, IFNULL(SUM(total_amount),0) as amount FROM orders WHERE merchant_id = ? AND DATE(created_at) = CURDATE()', [mid]
    );
    const [[weekOrders]] = await pool.query(
      'SELECT COUNT(*) as count, IFNULL(SUM(total_amount),0) as amount FROM orders WHERE merchant_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)', [mid]
    );
    const [[monthOrders]] = await pool.query(
      'SELECT COUNT(*) as count, IFNULL(SUM(total_amount),0) as amount FROM orders WHERE merchant_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)', [mid]
    );
    const [[totalOrders]] = await pool.query(
      'SELECT COUNT(*) as count, IFNULL(SUM(total_amount),0) as amount FROM orders WHERE merchant_id = ?', [mid]
    );
    const [hotProducts] = await pool.query(
      'SELECT * FROM merchant_products WHERE merchant_id = ? ORDER BY sales DESC LIMIT 10', [mid]
    );
    const [dailyStats] = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as orders, IFNULL(SUM(total_amount),0) as amount
        FROM orders WHERE merchant_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at) ORDER BY date`, [mid]
    );
    res.json({
      code: 200,
      data: { today: todayOrders, week: weekOrders, month: monthOrders, total: totalOrders, hotProducts, dailyStats }
    });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 商家评价
router.get('/reviews', authMiddleware, async (req, res) => {
  try {
    const [merchant] = await pool.query('SELECT id FROM merchants WHERE user_id = ?', [req.user.id]);
    if (merchant.length === 0) return res.json({ code: 400, msg: '非商家用户' });
    const [rows] = await pool.query(
      'SELECT r.*, u.nickname, u.avatar FROM reviews r LEFT JOIN users u ON r.reviewer_id = u.id WHERE r.merchant_id = ? ORDER BY r.created_at DESC',
      [merchant[0].id]
    );
    res.json({ code: 200, data: rows });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 商家消息列表
router.get('/messages', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json({ code: 200, data: rows });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 订单详情
router.get('/order/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.*, m.shop_name FROM orders o
       LEFT JOIN merchants m ON o.merchant_id = m.id WHERE o.id = ? AND o.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.json({ code: 404, msg: '订单不存在' });
    res.json({ code: 200, data: rows[0] });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

module.exports = router;
