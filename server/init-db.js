const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'root',
  charset: 'utf8mb4',
  multipleStatements: true
};

async function initDB() {
  const conn = await mysql.createConnection(config);
  const IMG = 'http://localhost:3000/images';

  await conn.query('CREATE DATABASE IF NOT EXISTS campus_errand DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci');
  await conn.query('USE campus_errand');
  console.log('✓ 数据库 campus_errand 已创建');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      openid VARCHAR(100) UNIQUE,
      phone VARCHAR(20),
      password VARCHAR(100),
      nickname VARCHAR(50) DEFAULT '微信用户',
      avatar VARCHAR(500) DEFAULT '',
      campus VARCHAR(100) DEFAULT '',
      dormitory VARCHAR(100) DEFAULT '',
      role ENUM('user','merchant','admin') DEFAULT 'user',
      balance DECIMAL(10,2) DEFAULT 0.00,
      credit_score INT DEFAULT 100,
      status TINYINT DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS merchants (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      shop_name VARCHAR(100) NOT NULL,
      category VARCHAR(50),
      contact VARCHAR(50),
      qualification VARCHAR(500),
      announcement TEXT,
      business_hours VARCHAR(100),
      delivery_range VARCHAR(200),
      rating DECIMAL(2,1) DEFAULT 5.0,
      status ENUM('pending','approved','rejected','disabled') DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      runner_id INT DEFAULT NULL,
      type ENUM('express_pickup','express_send','help_buy') NOT NULL,
      status ENUM('pending','accepted','delivering','completed','cancelled') DEFAULT 'pending',
      reward DECIMAL(10,2) NOT NULL,
      express_point VARCHAR(200),
      pickup_code VARCHAR(50),
      sender_address VARCHAR(300),
      receiver_name VARCHAR(50),
      receiver_phone VARCHAR(20),
      receiver_address VARCHAR(300),
      goods_desc VARCHAR(500),
      buy_location VARCHAR(200),
      budget DECIMAL(10,2),
      delivery_address VARCHAR(300),
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS second_hand_goods (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      original_price DECIMAL(10,2),
      category VARCHAR(50),
      images TEXT,
      contact VARCHAR(100),
      status ENUM('pending','on_sale','sold','off_shelf') DEFAULT 'on_sale',
      view_count INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS merchant_products (
      id INT PRIMARY KEY AUTO_INCREMENT,
      merchant_id INT NOT NULL,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      stock INT DEFAULT 0,
      category VARCHAR(50),
      images TEXT,
      sales INT DEFAULT 0,
      status TINYINT DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INT PRIMARY KEY AUTO_INCREMENT,
      order_no VARCHAR(50),
      task_id INT,
      merchant_id INT,
      user_id INT NOT NULL,
      product_id INT,
      product_name VARCHAR(200),
      quantity INT DEFAULT 1,
      total_amount DECIMAL(10,2),
      status ENUM('pending','preparing','ready','completed','cancelled') DEFAULT 'pending',
      address VARCHAR(500) DEFAULT '',
      phone VARCHAR(20) DEFAULT '',
      remark VARCHAR(500) DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INT PRIMARY KEY AUTO_INCREMENT,
      task_id INT,
      reviewer_id INT NOT NULL,
      reviewee_id INT,
      merchant_id INT,
      rating TINYINT NOT NULL,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      name VARCHAR(50) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      campus VARCHAR(100),
      dormitory VARCHAR(100),
      detail VARCHAR(300),
      is_default TINYINT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      type ENUM('system','task','order','review') DEFAULT 'system',
      title VARCHAR(200),
      content TEXT,
      related_id INT,
      is_read TINYINT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS wallet_records (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      type ENUM('income','expense','recharge','withdraw') NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      balance_after DECIMAL(10,2),
      description VARCHAR(200),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS banners (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(100),
      image_url VARCHAR(500) NOT NULL,
      link VARCHAR(500),
      sort_order INT DEFAULT 0,
      status TINYINT DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(200) NOT NULL,
      content TEXT,
      status TINYINT DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(50) NOT NULL,
      icon VARCHAR(500),
      type ENUM('service','goods','second_hand') NOT NULL,
      sort_order INT DEFAULT 0,
      status TINYINT DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      setting_key VARCHAR(100) UNIQUE NOT NULL,
      setting_value TEXT,
      description VARCHAR(200)
    );

    CREATE TABLE IF NOT EXISTS admin_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      admin_id INT NOT NULL,
      action VARCHAR(100),
      detail TEXT,
      ip VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS goods_comments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      goods_id INT NOT NULL,
      user_id INT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✓ 所有数据表已创建');

  // 清空旧数据重新插入
  const tables = ['admin_logs','goods_comments','system_settings','categories','announcements','banners',
    'messages','wallet_records','reviews','orders','addresses','second_hand_goods','tasks',
    'merchant_products','merchants','users'];
  for (const t of tables) {
    await conn.query(`DELETE FROM ${t}`);
    await conn.query(`ALTER TABLE ${t} AUTO_INCREMENT = 1`);
  }
  console.log('✓ 旧数据已清空');

  // ============ 插入示例数据 ============

  // 用户数据
  await conn.query(`
    INSERT IGNORE INTO users (id, openid, phone, password, nickname, avatar, campus, dormitory, role, balance, credit_score) VALUES
    (1, 'admin_openid', 'admin', 'admin123', '系统管理员', '${IMG}/avatars/admin.png', '主校区', '', 'admin', 999.00, 100),
    (2, 'user_openid_1', '13800001111', '123456', '李同学', '${IMG}/avatars/li.png', '主校区', '梅园1号楼', 'user', 128.50, 98),
    (3, 'user_openid_2', '13800002222', '123456', '王小明', '${IMG}/avatars/wang.png', '主校区', '竹园3号楼', 'user', 56.00, 95),
    (4, 'user_openid_3', '13800003333', '123456', '张小红', '${IMG}/avatars/zhang.png', '东校区', '兰园2号楼', 'user', 200.00, 100),
    (5, 'user_openid_4', '13800004444', '123456', '赵同学', '${IMG}/avatars/zhao.png', '主校区', '松园5号楼', 'merchant', 350.00, 97),
    (6, 'user_openid_5', '13800005555', '123456', '刘小雨', '${IMG}/avatars/liu.png', '东校区', '菊园1号楼', 'merchant', 680.00, 100),
    (7, 'user_openid_6', '13800006666', '123456', '陈同学', '${IMG}/avatars/chen.png', '主校区', '梅园4号楼', 'user', 45.00, 92),
    (8, 'user_openid_7', '13800007777', '123456', '孙小梅', '${IMG}/avatars/sun.png', '东校区', '兰园5号楼', 'user', 89.00, 96)
  `);
  console.log('✓ 用户数据已插入');

  // 商家数据
  await conn.query(`
    INSERT IGNORE INTO merchants (id, user_id, shop_name, category, contact, announcement, business_hours, delivery_range, rating, status) VALUES
    (1, 5, '校园零食铺', '零食饮料', '13800004444', '新学期大优惠，满20减5！', '08:00-22:00', '主校区全覆盖', 4.8, 'approved'),
    (2, 6, '学霸文具店', '文具用品', '13800005555', '开学季文具特卖，全场8折', '09:00-21:00', '两校区均可配送', 4.9, 'approved')
  `);
  console.log('✓ 商家数据已插入');

  // 商品数据
  await conn.query(`
    INSERT IGNORE INTO merchant_products (id, merchant_id, name, description, price, stock, category, images, sales) VALUES
    (1, 1, '百事可乐 330ml', '冰镇百事可乐，夏日解渴必备', 3.00, 200, '饮料', '["${IMG}/goods/pepsi.jpg"]', 156),
    (2, 1, '乐事薯片 原味', '经典原味薯片，追剧必备', 6.50, 150, '零食', '["${IMG}/goods/lays.jpg"]', 89),
    (3, 1, '康师傅方便面 红烧牛肉', '深夜食堂首选', 4.50, 300, '速食', '["${IMG}/goods/noodle.jpg"]', 234),
    (4, 1, '农夫山泉 550ml', '天然饮用水', 2.00, 500, '饮料', '["${IMG}/goods/water.jpg"]', 320),
    (5, 2, '晨光中性笔 0.5mm黑色', '书写流畅，学生必备', 2.50, 400, '笔类', '["${IMG}/goods/pen.jpg"]', 276),
    (6, 2, 'A4笔记本 80页', '优质纸张，不透墨', 5.00, 200, '本册', '["${IMG}/goods/notebook.jpg"]', 145),
    (7, 2, '得力订书机套装', '含订书针一盒', 12.00, 80, '办公', '["${IMG}/goods/stapler.jpg"]', 56),
    (8, 2, '马克笔24色套装', '双头设计，色彩鲜艳', 28.00, 60, '画材', '["${IMG}/goods/marker.jpg"]', 38)
  `);
  console.log('✓ 商品数据已插入');

  // 任务数据
  await conn.query(`
    INSERT IGNORE INTO tasks (id, user_id, runner_id, type, status, reward, express_point, pickup_code, delivery_address, remark, created_at) VALUES
    (1, 2, 3, 'express_pickup', 'completed', 5.00, '菜鸟驿站（南门）', '8-2-5516', '梅园1号楼302室', '快递比较大，可能需要两只手', '2026-04-14 10:30:00'),
    (2, 3, NULL, 'express_pickup', 'pending', 3.00, '京东快递柜（食堂旁）', '78-123', '竹园3号楼518室', '普通大小的包裹', '2026-04-15 14:20:00'),
    (3, 4, 2, 'express_send', 'delivering', 8.00, NULL, NULL, NULL, '易碎物品请轻拿轻放', '2026-04-15 09:00:00'),
    (4, 7, NULL, 'help_buy', 'pending', 6.00, NULL, NULL, '梅园4号楼201室', '要冰的，谢谢', '2026-04-15 16:00:00'),
    (5, 8, 4, 'express_pickup', 'accepted', 4.00, '中通快递点（西门）', '取件码 6677', '兰园5号楼103室', '', '2026-04-16 08:30:00'),
    (6, 2, NULL, 'help_buy', 'pending', 5.00, NULL, NULL, '梅园1号楼302室', '要常温的', '2026-04-16 09:00:00'),
    (7, 4, NULL, 'express_pickup', 'pending', 3.50, '圆通快递点（北门）', 'YT-8899', '兰园2号楼405室', '下午5点前送到', '2026-04-16 10:00:00'),
    (8, 3, 7, 'express_pickup', 'completed', 4.00, '菜鸟驿站（南门）', '3-1-4423', '竹园3号楼518室', '', '2026-04-13 11:00:00')
  `);

  await conn.query(`
    UPDATE tasks SET sender_address = '兰园2号楼405室', receiver_name = '李妈妈', receiver_phone = '13900001234', receiver_address = '北京市朝阳区xx路xx号' WHERE id = 3;
    UPDATE tasks SET goods_desc = '一杯奶茶（珍珠少糖）', buy_location = '学校西门蜜雪冰城', budget = 15.00 WHERE id = 4;
    UPDATE tasks SET goods_desc = '两瓶农夫山泉+一包辣条', buy_location = '校园超市', budget = 10.00 WHERE id = 6;
  `);
  console.log('✓ 任务数据已插入');

  // 二手商品数据
  await conn.query(`
    INSERT IGNORE INTO second_hand_goods (id, user_id, title, description, price, original_price, category, images, contact, status, view_count, created_at) VALUES
    (1, 2, '高等数学同济第七版', '九成新，无笔记无划线，考研必备', 18.00, 46.00, '教材书籍', '["${IMG}/goods/math-book.jpg"]', '微信：lixue_2024', 'on_sale', 156, '2026-04-10 10:00:00'),
    (2, 3, 'iPad Air 5 64G WiFi版', '去年购入，带Apple Pencil和键盘壳，成色95新', 2800.00, 4799.00, '数码产品', '["${IMG}/goods/ipad.jpg"]', '手机：13800002222', 'on_sale', 342, '2026-04-11 15:00:00'),
    (3, 4, '罗技K380蓝牙键盘', '黑色款，用了半年，手感很好', 89.00, 199.00, '数码产品', '["${IMG}/goods/keyboard.jpg"]', '微信：zhangxh', 'on_sale', 88, '2026-04-12 09:00:00'),
    (4, 7, '四级英语真题全套2020-2025', '包含听力音频，答案详解', 12.00, 35.00, '教材书籍', '["${IMG}/goods/english-book.jpg"]', '微信：chentong', 'on_sale', 203, '2026-04-12 14:00:00'),
    (5, 8, '小米台灯Pro', '护眼台灯，功能完好，自提优先', 45.00, 169.00, '生活用品', '["${IMG}/goods/desk-lamp.jpg"]', '手机：13800007777', 'on_sale', 67, '2026-04-13 11:00:00'),
    (6, 2, '耐克Air Force 1 白色 42码', '穿了几次，鞋底干净，配件齐全', 320.00, 799.00, '服饰鞋帽', '["${IMG}/goods/nike.jpg"]', '微信：lixue_2024', 'on_sale', 178, '2026-04-14 16:00:00'),
    (7, 4, '考研英语词汇红宝书', '全新未拆封，多买了一本', 25.00, 42.00, '教材书籍', '["${IMG}/goods/vocab-book.jpg"]', '微信：zhangxh', 'on_sale', 45, '2026-04-15 10:00:00'),
    (8, 3, '索尼WH-1000XM4头戴耳机', '黑色，降噪效果好，原装配件齐全', 980.00, 2299.00, '数码产品', '["${IMG}/goods/headphone.jpg"]', '手机：13800002222', 'on_sale', 256, '2026-04-15 14:00:00')
  `);
  console.log('✓ 二手商品数据已插入');

  // 地址数据
  await conn.query(`
    INSERT IGNORE INTO addresses (id, user_id, name, phone, campus, dormitory, detail, is_default) VALUES
    (1, 2, '李同学', '13800001111', '主校区', '梅园1号楼', '302室', 1),
    (2, 2, '李同学', '13800001111', '主校区', '图书馆', '一楼大厅', 0),
    (3, 3, '王小明', '13800002222', '主校区', '竹园3号楼', '518室', 1),
    (4, 4, '张小红', '13800003333', '东校区', '兰园2号楼', '405室', 1),
    (5, 7, '陈同学', '13800006666', '主校区', '梅园4号楼', '201室', 1),
    (6, 8, '孙小梅', '13800007777', '东校区', '兰园5号楼', '103室', 1)
  `);
  console.log('✓ 地址数据已插入');

  // 评价数据
  await conn.query(`
    INSERT IGNORE INTO reviews (id, task_id, reviewer_id, reviewee_id, rating, content, created_at) VALUES
    (1, 1, 2, 3, 5, '速度很快，态度也很好，下次还找你！', '2026-04-14 12:00:00'),
    (2, 1, 3, 2, 5, '发布者很有礼貌，好评', '2026-04-14 12:05:00'),
    (3, 8, 3, 7, 4, '送达速度可以，包裹完好', '2026-04-13 13:00:00'),
    (4, 8, 7, 3, 5, '任务描述清晰，位置好找', '2026-04-13 13:10:00')
  `);
  console.log('✓ 评价数据已插入');

  // 留言数据
  await conn.query(`
    INSERT IGNORE INTO goods_comments (id, goods_id, user_id, content, created_at) VALUES
    (1, 2, 7, '成色怎么样？有没有磕碰？', '2026-04-12 10:00:00'),
    (2, 2, 3, '成色很好的，边框没有磕碰', '2026-04-12 10:30:00'),
    (3, 1, 4, '还在吗？想买', '2026-04-11 14:00:00'),
    (4, 6, 8, '能便宜点吗？300可以吗？', '2026-04-15 09:00:00'),
    (5, 8, 2, '耳机电池续航怎么样？', '2026-04-15 16:00:00'),
    (6, 8, 3, '续航很好的，充满能用30小时左右', '2026-04-15 16:30:00')
  `);
  console.log('✓ 留言数据已插入');

  // 钱包记录
  await conn.query(`
    INSERT IGNORE INTO wallet_records (id, user_id, type, amount, balance_after, description, created_at) VALUES
    (1, 2, 'recharge', 100.00, 100.00, '余额充值', '2026-04-10 10:00:00'),
    (2, 2, 'expense', 5.00, 95.00, '发布取快递任务#1', '2026-04-14 10:30:00'),
    (3, 3, 'income', 5.00, 56.00, '完成跑腿任务#1获得赏金', '2026-04-14 12:00:00'),
    (4, 2, 'recharge', 50.00, 145.00, '余额充值', '2026-04-15 08:00:00'),
    (5, 7, 'income', 4.00, 45.00, '完成跑腿任务#8获得赏金', '2026-04-13 13:00:00'),
    (6, 4, 'recharge', 200.00, 200.00, '余额充值', '2026-04-12 09:00:00')
  `);
  console.log('✓ 钱包记录已插入');

  // 消息数据
  await conn.query(`
    INSERT IGNORE INTO messages (id, user_id, type, title, content, related_id, is_read, created_at) VALUES
    (1, 2, 'task', '任务已完成', '您的取快递任务#1已确认完成', 1, 1, '2026-04-14 12:00:00'),
    (2, 3, 'task', '赏金到账', '完成任务#1获得赏金5.00元', 1, 1, '2026-04-14 12:00:00'),
    (3, 4, 'task', '任务已被接单', '您的寄快递任务#3已有人接单', 3, 0, '2026-04-15 09:30:00'),
    (4, 2, 'system', '欢迎使用校园跑腿', '欢迎加入校园跑腿平台！发布或接取任务，赚取赏金', NULL, 1, '2026-04-10 10:00:00'),
    (5, 5, 'system', '入驻审核通过', '恭喜！您的店铺「校园零食铺」已通过审核', NULL, 1, '2026-04-09 10:00:00'),
    (6, 3, 'order', '新留言', '您的二手商品收到新留言', 2, 0, '2026-04-12 10:00:00'),
    (7, 8, 'system', '欢迎使用校园跑腿', '欢迎加入校园跑腿平台！', NULL, 0, '2026-04-13 11:00:00')
  `);
  console.log('✓ 消息数据已插入');

  // 轮播图
  await conn.query(`
    INSERT IGNORE INTO banners (id, title, image_url, link, sort_order) VALUES
    (1, '新学期跑腿服务上线', '${IMG}/banners/banner1.jpg', '/pages/hall/hall', 1),
    (2, '二手市场开张啦', '${IMG}/banners/banner2.jpg', '/pages/market/market', 2),
    (3, '邀请好友得奖励', '${IMG}/banners/banner3.jpg', '', 3)
  `);
  console.log('✓ 轮播图数据已插入');

  // 公告
  await conn.query(`
    INSERT IGNORE INTO announcements (id, title, content) VALUES
    (1, '平台使用须知', '请在使用过程中遵守校园规范，诚信交易，如有纠纷请联系客服处理。'),
    (2, '跑腿赏金调整公告', '即日起，平台最低赏金调整为2元，感谢大家的理解与支持。'),
    (3, '五一假期配送说明', '五一假期期间（5月1日-5月5日），校园快递点正常开放，跑腿服务照常。')
  `);
  console.log('✓ 公告数据已插入');

  // 分类
  await conn.query(`
    INSERT IGNORE INTO categories (id, name, icon, type, sort_order) VALUES
    (1, '取快递', '/images/icon-pickup.png', 'service', 1),
    (2, '寄快递', '/images/icon-send.png', 'service', 2),
    (3, '帮买服务', '/images/icon-buy.png', 'service', 3),
    (4, '二手市场', '/images/icon-market.png', 'service', 4),
    (5, '教材书籍', '', 'second_hand', 1),
    (6, '数码产品', '', 'second_hand', 2),
    (7, '生活用品', '', 'second_hand', 3),
    (8, '服饰鞋帽', '', 'second_hand', 4),
    (9, '运动户外', '', 'second_hand', 5),
    (10, '其他', '', 'second_hand', 6)
  `);
  console.log('✓ 分类数据已插入');

  // 系统设置
  await conn.query(`
    INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
    ('platform_name', '校园跑腿', '平台名称'),
    ('min_reward', '2', '最低赏金（元）'),
    ('commission_rate', '0.1', '平台抽成比例'),
    ('contact_phone', '400-123-4567', '客服电话'),
    ('contact_email', 'support@campus-errand.com', '客服邮箱')
  `);
  console.log('✓ 系统设置已插入');

  // 订单数据
  await conn.query(`
    INSERT IGNORE INTO orders (id, task_id, merchant_id, user_id, product_id, product_name, quantity, total_amount, status, created_at) VALUES
    (1, NULL, 1, 2, 1, '百事可乐 330ml', 2, 6.00, 'completed', '2026-04-13 15:00:00'),
    (2, NULL, 1, 3, 3, '康师傅方便面 红烧牛肉', 3, 13.50, 'completed', '2026-04-14 20:00:00'),
    (3, NULL, 2, 4, 5, '晨光中性笔 0.5mm黑色', 5, 12.50, 'completed', '2026-04-14 10:00:00'),
    (4, NULL, 1, 7, 2, '乐事薯片 原味', 1, 6.50, 'preparing', '2026-04-16 09:00:00'),
    (5, NULL, 2, 8, 6, 'A4笔记本 80页', 2, 10.00, 'ready', '2026-04-16 10:00:00')
  `);
  console.log('✓ 订单数据已插入');

  console.log('\n========================================');
  console.log('  数据库初始化完成！');
  console.log('  管理员账号: admin / admin123');
  console.log('  普通用户: 13800001111 / 123456');
  console.log('  商家用户: 13800004444 / 123456');
  console.log('========================================\n');

  await conn.end();
}

initDB().catch(err => {
  console.error('数据库初始化失败:', err);
  process.exit(1);
});
