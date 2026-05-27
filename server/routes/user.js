const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { generateToken, authMiddleware } = require('../middleware/auth');

// 微信登录（模拟）
router.post('/login', async (req, res) => {
  try {
    const { code, nickName, avatarUrl } = req.body;
    const openid = 'mock_openid_' + (code || Date.now());
    let [rows] = await pool.query('SELECT * FROM users WHERE openid = ?', [openid]);
    let user;
    if (rows.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO users (openid, nickname, avatar) VALUES (?, ?, ?)',
        [openid, nickName || '微信用户', avatarUrl || '']
      );
      [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = rows[0];
    } else {
      user = rows[0];
      if (nickName) {
        await pool.query('UPDATE users SET nickname=?, avatar=? WHERE id=?', [nickName, avatarUrl || '', user.id]);
        user.nickname = nickName;
        user.avatar = avatarUrl || '';
      }
    }
    const token = generateToken(user);
    res.json({ code: 200, data: { token, userInfo: user } });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 账号密码登录（管理员/商家）
router.post('/login/password', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE phone = ? AND password = ?', [username, password]);
    if (rows.length === 0) return res.json({ code: 400, msg: '账号或密码错误' });
    const user = rows[0];
    if (user.status === 0) return res.json({ code: 400, msg: '账号已被禁用' });
    const token = generateToken(user);
    res.json({ code: 200, data: { token, userInfo: user } });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 绑定手机号
router.post('/bindPhone', authMiddleware, async (req, res) => {
  try {
    const { phone } = req.body;
    await pool.query('UPDATE users SET phone = ? WHERE id = ?', [phone, req.user.id]);
    res.json({ code: 200, msg: '绑定成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 获取用户信息
router.get('/info', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.json({ code: 404, msg: '用户不存在' });
    const user = rows[0];
    delete user.password;
    const [merchant] = await pool.query('SELECT * FROM merchants WHERE user_id = ? AND status = "approved"', [req.user.id]);
    user.isMerchant = merchant.length > 0;
    user.merchantId = merchant.length > 0 ? merchant[0].id : null;
    res.json({ code: 200, data: user });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 更新个人信息
router.put('/info', authMiddleware, async (req, res) => {
  try {
    const { nickname, avatar, campus, dormitory } = req.body;
    await pool.query(
      'UPDATE users SET nickname=?, avatar=?, campus=?, dormitory=? WHERE id=?',
      [nickname, avatar, campus, dormitory, req.user.id]
    );
    res.json({ code: 200, msg: '更新成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 地址列表
router.get('/address', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC', [req.user.id]);
    res.json({ code: 200, data: rows });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 添加地址
router.post('/address', authMiddleware, async (req, res) => {
  try {
    const { name, phone, campus, dormitory, detail, is_default } = req.body;
    if (is_default) {
      await pool.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }
    const [result] = await pool.query(
      'INSERT INTO addresses (user_id, name, phone, campus, dormitory, detail, is_default) VALUES (?,?,?,?,?,?,?)',
      [req.user.id, name, phone, campus, dormitory, detail, is_default ? 1 : 0]
    );
    res.json({ code: 200, data: { id: result.insertId }, msg: '添加成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 更新地址
router.put('/address/:id', authMiddleware, async (req, res) => {
  try {
    const { name, phone, campus, dormitory, detail, is_default } = req.body;
    if (is_default) {
      await pool.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }
    await pool.query(
      'UPDATE addresses SET name=?, phone=?, campus=?, dormitory=?, detail=?, is_default=? WHERE id=? AND user_id=?',
      [name, phone, campus, dormitory, detail, is_default ? 1 : 0, req.params.id, req.user.id]
    );
    res.json({ code: 200, msg: '更新成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 删除地址
router.delete('/address/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ code: 200, msg: '删除成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 消息列表
router.get('/messages', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.query(
      'SELECT * FROM messages WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.user.id, parseInt(pageSize), offset]
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM messages WHERE user_id = ?', [req.user.id]);
    res.json({ code: 200, data: { list: rows, total } });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 标记消息已读
router.put('/messages/:id/read', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE messages SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ code: 200, msg: '已读' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 全部标记已读
router.put('/messages/readAll', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE messages SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ code: 200, msg: '全部已读' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 未读消息数
router.get('/messages/unread', authMiddleware, async (req, res) => {
  try {
    const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM messages WHERE user_id = ? AND is_read = 0', [req.user.id]);
    res.json({ code: 200, data: count });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 钱包余额
router.get('/wallet', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT balance FROM users WHERE id = ?', [req.user.id]);
    res.json({ code: 200, data: { balance: rows[0].balance } });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 钱包记录
router.get('/wallet/records', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, type } = req.query;
    const offset = (page - 1) * pageSize;
    let sql = 'SELECT * FROM wallet_records WHERE user_id = ?';
    const params = [req.user.id];
    if (type) { sql += ' AND type = ?'; params.push(type); }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);
    const [rows] = await pool.query(sql, params);
    res.json({ code: 200, data: rows });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 充值
router.post('/wallet/recharge', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      await conn.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, req.user.id]);
      const [[user]] = await conn.query('SELECT balance FROM users WHERE id = ?', [req.user.id]);
      await conn.query(
        'INSERT INTO wallet_records (user_id, type, amount, balance_after, description) VALUES (?,?,?,?,?)',
        [req.user.id, 'recharge', amount, user.balance, '余额充值']
      );
      await conn.commit();
      conn.release();
      res.json({ code: 200, data: { balance: user.balance }, msg: '充值成功' });
    } catch (e) {
      await conn.rollback();
      conn.release();
      throw e;
    }
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

module.exports = router;
