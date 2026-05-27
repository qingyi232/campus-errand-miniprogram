const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 轮播图
router.get('/banners', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM banners WHERE status = 1 ORDER BY sort_order ASC, id DESC');
    res.json({ code: 200, data: rows });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 公告
router.get('/announcements', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM announcements WHERE status = 1 ORDER BY created_at DESC LIMIT 10');
    res.json({ code: 200, data: rows });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 分类列表
router.get('/categories', async (req, res) => {
  try {
    const { type } = req.query;
    let sql = 'SELECT * FROM categories WHERE status = 1';
    const params = [];
    if (type) { sql += ' AND type = ?'; params.push(type); }
    sql += ' ORDER BY sort_order ASC';
    const [rows] = await pool.query(sql, params);
    res.json({ code: 200, data: rows });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 热门任务
router.get('/hot-tasks', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, u.nickname, u.avatar FROM tasks t LEFT JOIN users u ON t.user_id = u.id
        WHERE t.status = 'pending' ORDER BY t.reward DESC, t.created_at DESC LIMIT 6`
    );
    res.json({ code: 200, data: rows });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 推荐二手商品
router.get('/recommend-goods', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT g.*, u.nickname, u.avatar FROM second_hand_goods g LEFT JOIN users u ON g.user_id = u.id
        WHERE g.status = 'on_sale' ORDER BY g.view_count DESC, g.created_at DESC LIMIT 6`
    );
    const processed = rows.map(r => ({ ...r, images: r.images ? JSON.parse(r.images) : [] }));
    res.json({ code: 200, data: processed });
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message });
  }
});

// 文件上传（模拟）
router.post('/upload', (req, res) => {
  res.json({ code: 200, data: { url: 'http://localhost:3000/images/goods/default.png' }, msg: '上传成功' });
});

module.exports = router;
