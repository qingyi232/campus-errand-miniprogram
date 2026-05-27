const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// 商品列表
router.get('/', async (req, res) => {
  try {
    const { category, keyword, page = 1, pageSize = 20, sort } = req.query;
    const offset = (page - 1) * pageSize;
    let sql = `SELECT g.*, u.nickname, u.avatar, u.campus FROM second_hand_goods g
      LEFT JOIN users u ON g.user_id = u.id WHERE g.status = 'on_sale'`;
    const params = [];
    if (category) { sql += ' AND g.category = ?'; params.push(category); }
    if (keyword) { sql += ' AND (g.title LIKE ? OR g.description LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
    if (sort === 'price_asc') sql += ' ORDER BY g.price ASC';
    else if (sort === 'price_desc') sql += ' ORDER BY g.price DESC';
    else sql += ' ORDER BY g.created_at DESC';
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);
    const [rows] = await pool.query(sql, params);
    let countSql = "SELECT COUNT(*) as total FROM second_hand_goods WHERE status = 'on_sale'";
    const countParams = [];
    if (category) { countSql += ' AND category = ?'; countParams.push(category); }
    if (keyword) { countSql += ' AND (title LIKE ? OR description LIKE ?)'; countParams.push(`%${keyword}%`, `%${keyword}%`); }
    const [[{ total }]] = await pool.query(countSql, countParams);
    const processed = rows.map(r => ({ ...r, images: r.images ? JSON.parse(r.images) : [] }));
    res.json({ code: 200, data: { list: processed, total } });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 商品详情
router.get('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE second_hand_goods SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);
    const [rows] = await pool.query(
      `SELECT g.*, u.nickname, u.avatar, u.campus, u.phone FROM second_hand_goods g
        LEFT JOIN users u ON g.user_id = u.id WHERE g.id = ?`, [req.params.id]
    );
    if (rows.length === 0) return res.json({ code: 404, msg: '商品不存在' });
    rows[0].images = rows[0].images ? JSON.parse(rows[0].images) : [];
    const [comments] = await pool.query(
      'SELECT c.*, u.nickname, u.avatar FROM goods_comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.goods_id = ? ORDER BY c.created_at DESC',
      [req.params.id]
    );
    rows[0].comments = comments;
    res.json({ code: 200, data: rows[0] });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 发布商品
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, price, original_price, category, images, contact } = req.body;
    const [result] = await pool.query(
      'INSERT INTO second_hand_goods (user_id, title, description, price, original_price, category, images, contact) VALUES (?,?,?,?,?,?,?,?)',
      [req.user.id, title, description, price, original_price || null, category, JSON.stringify(images || []), contact || '']
    );
    res.json({ code: 200, data: { id: result.insertId }, msg: '发布成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 更新商品
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, price, original_price, category, images, contact, status } = req.body;
    await pool.query(
      `UPDATE second_hand_goods SET title=?, description=?, price=?, original_price=?,
        category=?, images=?, contact=?, status=? WHERE id=? AND user_id=?`,
      [title, description, price, original_price, category, JSON.stringify(images || []), contact, status || 'on_sale', req.params.id, req.user.id]
    );
    res.json({ code: 200, msg: '更新成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 删除商品
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM second_hand_goods WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ code: 200, msg: '删除成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 我的商品
router.get('/my/list', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM second_hand_goods WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]
    );
    const processed = rows.map(r => ({ ...r, images: r.images ? JSON.parse(r.images) : [] }));
    res.json({ code: 200, data: processed });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 留言
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    await pool.query('INSERT INTO goods_comments (goods_id, user_id, content) VALUES (?,?,?)',
      [req.params.id, req.user.id, content]);
    const [goods] = await pool.query('SELECT user_id FROM second_hand_goods WHERE id = ?', [req.params.id]);
    if (goods.length && goods[0].user_id !== req.user.id) {
      await pool.query(
        'INSERT INTO messages (user_id, type, title, content, related_id) VALUES (?,?,?,?,?)',
        [goods[0].user_id, 'order', '新留言', '您的二手商品收到新留言', req.params.id]
      );
    }
    res.json({ code: 200, msg: '留言成功' });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

module.exports = router;
