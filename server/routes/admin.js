const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.use(authMiddleware, adminMiddleware);

// ============ 用户管理 ============
router.get('/users', async (req, res) => {
  try {
    const { keyword, status, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;
    let sql = 'SELECT id, openid, phone, nickname, avatar, campus, dormitory, role, balance, credit_score, status, created_at FROM users WHERE 1=1';
    const params = [];
    if (keyword) { sql += ' AND (nickname LIKE ? OR phone LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
    if (status !== undefined) { sql += ' AND status = ?'; params.push(parseInt(status)); }
    const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM');
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);
    const [rows] = await pool.query(sql, params);
    const countParams = params.slice(0, -2);
    const [[{ total }]] = await pool.query(countSql, countParams);
    res.json({ code: 200, data: { list: rows, total } });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

router.put('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    await pool.query('INSERT INTO admin_logs (admin_id, action, detail) VALUES (?,?,?)',
      [req.user.id, '用户管理', `${status === 1 ? '启用' : '禁用'}用户#${req.params.id}`]);
    res.json({ code: 200, msg: '操作成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// ============ 商家管理 ============
router.get('/merchants', async (req, res) => {
  try {
    const { status, keyword } = req.query;
    let sql = 'SELECT m.*, u.nickname, u.phone FROM merchants m LEFT JOIN users u ON m.user_id = u.id WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND m.status = ?'; params.push(status); }
    if (keyword) { sql += ' AND (m.shop_name LIKE ? OR u.nickname LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
    sql += ' ORDER BY m.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ code: 200, data: rows });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

router.put('/merchants/:id/audit', async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE merchants SET status = ? WHERE id = ?', [status, req.params.id]);
    const [merchant] = await pool.query('SELECT user_id, shop_name FROM merchants WHERE id = ?', [req.params.id]);
    if (merchant.length) {
      if (status === 'approved') {
        await pool.query('UPDATE users SET role = "merchant" WHERE id = ?', [merchant[0].user_id]);
      }
      await pool.query('INSERT INTO messages (user_id, type, title, content) VALUES (?,?,?,?)',
        [merchant[0].user_id, 'system', '入驻审核结果', `您的店铺「${merchant[0].shop_name}」${status === 'approved' ? '已通过审核' : '审核未通过'}`]);
      await pool.query('INSERT INTO admin_logs (admin_id, action, detail) VALUES (?,?,?)',
        [req.user.id, '商家审核', `${status === 'approved' ? '通过' : '拒绝'}商家#${req.params.id}`]);
    }
    res.json({ code: 200, msg: '操作成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

router.put('/merchants/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE merchants SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ code: 200, msg: '操作成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// ============ 任务管理 ============
router.get('/tasks', async (req, res) => {
  try {
    const { type, status, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;
    let sql = `SELECT t.*, u.nickname as user_name, r.nickname as runner_name FROM tasks t
      LEFT JOIN users u ON t.user_id = u.id LEFT JOIN users r ON t.runner_id = r.id WHERE 1=1`;
    const params = [];
    if (type) { sql += ' AND t.type = ?'; params.push(type); }
    if (status) { sql += ' AND t.status = ?'; params.push(status); }
    const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM');
    sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);
    const [rows] = await pool.query(sql, params);
    const countParams = params.slice(0, -2);
    const [[{ total }]] = await pool.query(countSql, countParams);
    res.json({ code: 200, data: { list: rows, total } });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

router.put('/tasks/:id/cancel', async (req, res) => {
  try {
    await pool.query('UPDATE tasks SET status = "cancelled" WHERE id = ?', [req.params.id]);
    await pool.query('INSERT INTO admin_logs (admin_id, action, detail) VALUES (?,?,?)',
      [req.user.id, '任务管理', `取消任务#${req.params.id}`]);
    res.json({ code: 200, msg: '已取消' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// ============ 二手市场管理 ============
router.get('/market', async (req, res) => {
  try {
    const { status, keyword } = req.query;
    let sql = 'SELECT g.*, u.nickname FROM second_hand_goods g LEFT JOIN users u ON g.user_id = u.id WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND g.status = ?'; params.push(status); }
    if (keyword) { sql += ' AND g.title LIKE ?'; params.push(`%${keyword}%`); }
    sql += ' ORDER BY g.created_at DESC';
    const [rows] = await pool.query(sql, params);
    const processed = rows.map(r => ({ ...r, images: r.images ? JSON.parse(r.images) : [] }));
    res.json({ code: 200, data: processed });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

router.put('/market/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE second_hand_goods SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ code: 200, msg: '操作成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// ============ 内容管理 ============
router.get('/banners', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM banners ORDER BY sort_order ASC, id DESC');
    res.json({ code: 200, data: rows });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

router.post('/banners', async (req, res) => {
  try {
    const { title, image_url, link, sort_order } = req.body;
    await pool.query('INSERT INTO banners (title, image_url, link, sort_order) VALUES (?,?,?,?)',
      [title, image_url, link || '', sort_order || 0]);
    res.json({ code: 200, msg: '添加成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

router.put('/banners/:id', async (req, res) => {
  try {
    const { title, image_url, link, sort_order, status } = req.body;
    if (status !== undefined && title === undefined) {
      await pool.query('UPDATE banners SET status=? WHERE id=?', [status, req.params.id]);
    } else {
      await pool.query('UPDATE banners SET title=?, image_url=?, link=?, sort_order=?, status=? WHERE id=?',
        [title, image_url, link, sort_order, status !== undefined ? status : 1, req.params.id]);
    }
    res.json({ code: 200, msg: '更新成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

router.delete('/banners/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM banners WHERE id = ?', [req.params.id]);
    res.json({ code: 200, msg: '删除成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 公告
router.get('/announcements', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
    res.json({ code: 200, data: rows });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

router.post('/announcements', async (req, res) => {
  try {
    const { title, content } = req.body;
    await pool.query('INSERT INTO announcements (title, content) VALUES (?,?)', [title, content]);
    res.json({ code: 200, msg: '发布成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    res.json({ code: 200, msg: '删除成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 分类管理
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY sort_order ASC');
    res.json({ code: 200, data: rows });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const { name, icon, type, sort_order } = req.body;
    await pool.query('INSERT INTO categories (name, icon, type, sort_order) VALUES (?,?,?,?)',
      [name, icon || '', type, sort_order || 0]);
    res.json({ code: 200, msg: '添加成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const { name, icon, type, sort_order, status } = req.body;
    if (status !== undefined) {
      await pool.query('UPDATE categories SET status = ? WHERE id = ?', [status, req.params.id]);
    } else {
      await pool.query('UPDATE categories SET name=?, icon=?, type=?, sort_order=? WHERE id=?',
        [name, icon||'', type, sort_order||0, req.params.id]);
    }
    res.json({ code: 200, msg: '更新成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ code: 200, msg: '删除成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// ============ 订单流水（管理员专用） ============
router.get('/orders', async (req, res) => {
  try {
    const { type, page = 1, pageSize = 50 } = req.query;
    const offset = (page - 1) * pageSize;
    let taskRows = [];
    let merchantRows = [];

    if (!type || type === 'task') {
      const [rows] = await pool.query(
        `SELECT t.id, t.type, t.reward as amount, t.status, t.created_at,
          u.nickname as user_name, r.nickname as runner_name
        FROM tasks t LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN users r ON t.runner_id = r.id
        ORDER BY t.created_at DESC`
      );
      taskRows = rows.map(r => ({ ...r, order_type: 'task' }));
    }

    if (!type || type === 'merchant') {
      const [rows] = await pool.query(
        `SELECT o.id, o.product_name, o.quantity, o.total_amount as amount, o.status, o.created_at,
          u.nickname as user_name, m.shop_name as merchant_name
        FROM orders o LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN merchants m ON o.merchant_id = m.id
        ORDER BY o.created_at DESC`
      );
      merchantRows = rows.map(r => ({ ...r, order_type: 'merchant' }));
    }

    const all = [...taskRows, ...merchantRows].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({ code: 200, data: { list: all.slice(offset, offset + parseInt(pageSize)), total: all.length } });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// ============ 数据统计 ============
router.get('/stats', async (req, res) => {
  try {
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) as totalUsers FROM users');
    const [[{ activeUsers }]] = await pool.query('SELECT COUNT(*) as activeUsers FROM users WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)');
    const [[{ totalTasks }]] = await pool.query('SELECT COUNT(*) as totalTasks FROM tasks');
    const [[{ completedTasks }]] = await pool.query('SELECT COUNT(*) as completedTasks FROM tasks WHERE status = "completed"');
    const [[{ totalAmount }]] = await pool.query('SELECT IFNULL(SUM(reward),0) as totalAmount FROM tasks WHERE status = "completed"');
    const [[{ totalGoods }]] = await pool.query('SELECT COUNT(*) as totalGoods FROM second_hand_goods');
    const [[{ totalMerchants }]] = await pool.query('SELECT COUNT(*) as totalMerchants FROM merchants WHERE status = "approved"');
    const [taskTrend] = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count FROM tasks
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY DATE(created_at) ORDER BY date`
    );
    const [taskTypeStats] = await pool.query(
      'SELECT type, COUNT(*) as count FROM tasks GROUP BY type'
    );
    const [merchantRank] = await pool.query(
      `SELECT m.shop_name, IFNULL(SUM(o.total_amount),0) as revenue, COUNT(o.id) as order_count
        FROM merchants m LEFT JOIN orders o ON m.id = o.merchant_id WHERE m.status = 'approved'
        GROUP BY m.id ORDER BY revenue DESC LIMIT 10`
    );

    const [[{ onSaleGoods }]] = await pool.query("SELECT COUNT(*) as onSaleGoods FROM second_hand_goods WHERE status = 'on_sale'");
    const [[{ soldGoods }]] = await pool.query("SELECT COUNT(*) as soldGoods FROM second_hand_goods WHERE status = 'sold'");
    const [[{ merchantOrderAmount }]] = await pool.query('SELECT IFNULL(SUM(total_amount),0) as merchantOrderAmount FROM orders WHERE status = "completed"');
    const [[{ merchantOrderCount }]] = await pool.query('SELECT COUNT(*) as merchantOrderCount FROM orders');

    const [amountTrend] = await pool.query(
      `SELECT DATE(created_at) as date, IFNULL(SUM(reward),0) as amount, COUNT(*) as count
        FROM tasks WHERE status = 'completed' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at) ORDER BY date`
    );

    res.json({
      code: 200,
      data: {
        totalUsers, activeUsers, totalTasks, completedTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0,
        totalAmount, totalGoods, totalMerchants, taskTrend, taskTypeStats, merchantRank,
        onSaleGoods, soldGoods, merchantOrderAmount, merchantOrderCount, amountTrend
      }
    });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// ============ 系统设置 ============
router.get('/settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM system_settings');
    res.json({ code: 200, data: rows });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const { settings } = req.body;
    for (const s of settings) {
      await pool.query('UPDATE system_settings SET setting_value = ? WHERE setting_key = ?', [s.value, s.key]);
    }
    res.json({ code: 200, msg: '保存成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 操作日志
router.get('/logs', async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.query(
      'SELECT l.*, u.nickname FROM admin_logs l LEFT JOIN users u ON l.admin_id = u.id ORDER BY l.created_at DESC LIMIT ? OFFSET ?',
      [parseInt(pageSize), offset]
    );
    res.json({ code: 200, data: rows });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

module.exports = router;
