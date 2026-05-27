const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// 发布任务
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type, reward, express_point, pickup_code, sender_address, receiver_name, receiver_phone,
      receiver_address, goods_desc, buy_location, budget, delivery_address, remark } = req.body;
    const [result] = await pool.query(
      `INSERT INTO tasks (user_id, type, reward, express_point, pickup_code, sender_address,
        receiver_name, receiver_phone, receiver_address, goods_desc, buy_location, budget,
        delivery_address, remark) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [req.user.id, type, reward, express_point || null, pickup_code || null,
        sender_address || null, receiver_name || null, receiver_phone || null,
        receiver_address || null, goods_desc || null, buy_location || null,
        budget || null, delivery_address || null, remark || null]
    );
    await pool.query(
      'INSERT INTO messages (user_id, type, title, content, related_id) VALUES (?,?,?,?,?)',
      [req.user.id, 'task', '任务发布成功', `您的${type === 'express_pickup' ? '取快递' : type === 'express_send' ? '寄快递' : '帮买'}任务已发布，等待接单`, result.insertId]
    );
    res.json({ code: 200, data: { id: result.insertId }, msg: '发布成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 接单大厅 — 可接任务列表
router.get('/hall', async (req, res) => {
  try {
    const { type, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;
    let sql = `SELECT t.*, u.nickname, u.avatar, u.campus FROM tasks t
      LEFT JOIN users u ON t.user_id = u.id WHERE t.status = 'pending'`;
    const params = [];
    if (type) { sql += ' AND t.type = ?'; params.push(type); }
    sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);
    const [rows] = await pool.query(sql, params);
    let countSql = "SELECT COUNT(*) as total FROM tasks WHERE status = 'pending'";
    const countParams = [];
    if (type) { countSql += ' AND type = ?'; countParams.push(type); }
    const [[{ total }]] = await pool.query(countSql, countParams);
    res.json({ code: 200, data: { list: rows, total } });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 任务详情
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, u.nickname, u.avatar, u.phone as user_phone, u.campus,
        r.nickname as runner_name, r.avatar as runner_avatar, r.phone as runner_phone
      FROM tasks t LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN users r ON t.runner_id = r.id WHERE t.id = ?`, [req.params.id]
    );
    if (rows.length === 0) return res.json({ code: 404, msg: '任务不存在' });
    const [reviews] = await pool.query(
      `SELECT rv.*, u.nickname, u.avatar FROM reviews rv LEFT JOIN users u ON rv.reviewer_id = u.id WHERE rv.task_id = ?`,
      [req.params.id]
    );
    rows[0].reviews = reviews;
    res.json({ code: 200, data: rows[0] });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 接单
router.post('/:id/accept', authMiddleware, async (req, res) => {
  try {
    const [task] = await pool.query('SELECT * FROM tasks WHERE id = ? AND status = "pending"', [req.params.id]);
    if (task.length === 0) return res.json({ code: 400, msg: '任务不存在或已被接单' });
    if (task[0].user_id === req.user.id) return res.json({ code: 400, msg: '不能接自己发布的任务' });
    await pool.query('UPDATE tasks SET runner_id = ?, status = "accepted" WHERE id = ?', [req.user.id, req.params.id]);
    await pool.query(
      'INSERT INTO messages (user_id, type, title, content, related_id) VALUES (?,?,?,?,?)',
      [task[0].user_id, 'task', '任务已被接单', '您的任务已有人接单，请留意进度更新', req.params.id]
    );
    res.json({ code: 200, msg: '接单成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 更新任务状态（配送中）
router.post('/:id/delivering', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE tasks SET status = "delivering" WHERE id = ? AND runner_id = ?', [req.params.id, req.user.id]);
    const [task] = await pool.query('SELECT user_id FROM tasks WHERE id = ?', [req.params.id]);
    if (task.length) {
      await pool.query(
        'INSERT INTO messages (user_id, type, title, content, related_id) VALUES (?,?,?,?,?)',
        [task[0].user_id, 'task', '任务配送中', '您的任务正在配送中', req.params.id]
      );
    }
    res.json({ code: 200, msg: '状态更新成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 确认完成
router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const [task] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (task.length === 0) return res.json({ code: 404, msg: '任务不存在' });
    if (task[0].user_id !== req.user.id) return res.json({ code: 403, msg: '只有发布者可以确认完成' });
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      await conn.query('UPDATE tasks SET status = "completed" WHERE id = ?', [req.params.id]);
      await conn.query('UPDATE users SET balance = balance + ? WHERE id = ?', [task[0].reward, task[0].runner_id]);
      const [[runner]] = await conn.query('SELECT balance FROM users WHERE id = ?', [task[0].runner_id]);
      await conn.query(
        'INSERT INTO wallet_records (user_id, type, amount, balance_after, description) VALUES (?,?,?,?,?)',
        [task[0].runner_id, 'income', task[0].reward, runner.balance, `完成跑腿任务#${req.params.id}获得赏金`]
      );
      await conn.query(
        'INSERT INTO messages (user_id, type, title, content, related_id) VALUES (?,?,?,?,?)',
        [task[0].runner_id, 'task', '任务已完成', `任务#${req.params.id}已确认完成，赏金${task[0].reward}元已到账`, req.params.id]
      );
      await conn.commit();
      conn.release();
      res.json({ code: 200, msg: '确认完成' });
    } catch (e) {
      await conn.rollback();
      conn.release();
      throw e;
    }
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 取消任务
router.post('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE tasks SET status = "cancelled" WHERE id = ? AND user_id = ? AND status IN ("pending","accepted")', [req.params.id, req.user.id]);
    res.json({ code: 200, msg: '已取消' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 评价任务
router.post('/:id/review', authMiddleware, async (req, res) => {
  try {
    const { rating, content, reviewee_id } = req.body;
    await pool.query(
      'INSERT INTO reviews (task_id, reviewer_id, reviewee_id, rating, content) VALUES (?,?,?,?,?)',
      [req.params.id, req.user.id, reviewee_id, rating, content]
    );
    res.json({ code: 200, msg: '评价成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 我发布的任务
router.get('/my/published', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;
    let sql = 'SELECT t.*, r.nickname as runner_name, r.avatar as runner_avatar FROM tasks t LEFT JOIN users r ON t.runner_id = r.id WHERE t.user_id = ?';
    const params = [req.user.id];
    if (status) { sql += ' AND t.status = ?'; params.push(status); }
    sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);
    const [rows] = await pool.query(sql, params);
    res.json({ code: 200, data: rows });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 我接的任务
router.get('/my/accepted', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;
    let sql = 'SELECT t.*, u.nickname, u.avatar, u.campus FROM tasks t LEFT JOIN users u ON t.user_id = u.id WHERE t.runner_id = ?';
    const params = [req.user.id];
    if (status) { sql += ' AND t.status = ?'; params.push(status); }
    sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);
    const [rows] = await pool.query(sql, params);
    res.json({ code: 200, data: rows });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

module.exports = router;
