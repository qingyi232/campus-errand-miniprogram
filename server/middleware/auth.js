const jwt = require('jsonwebtoken');
const SECRET = 'campus_errand_secret_2024';

function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ code: 401, msg: '请先登录' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (e) {
    res.status(401).json({ code: 401, msg: '登录已过期，请重新登录' });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, msg: '无管理员权限' });
  }
  next();
}

module.exports = { generateToken, authMiddleware, adminMiddleware, SECRET };
