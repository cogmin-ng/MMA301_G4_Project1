const pool = require('../db');

/**
 * Middleware xác thực người dùng từ Bearer token hoặc chuỗi jwt-
 * Token format từ auth.js: jwt-{userId}-{role}-{timestamp}
 */
module.exports = async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Chưa đăng nhập hoặc thiếu token xác thực.' });
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : authHeader.trim();

    let userId = null;
    if (token.startsWith('jwt-')) {
      const parts = token.split('-');
      if (parts.length >= 2 && !isNaN(parts[1])) {
        userId = parts[1];
      }
    } else if (!isNaN(token)) {
      userId = token;
    }

    if (!userId) {
      return res.status(401).json({ error: 'Token xác thực không hợp lệ.' });
    }

    const [rows] = await pool.query(
      `SELECT id, full_name, email, phone, role, avatar, is_active 
       FROM users 
       WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Người dùng không tồn tại trong hệ thống.' });
    }

    const user = rows[0];
    if (!user.is_active) {
      return res.status(403).json({ error: 'Tài khoản đã bị tạm khóa.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Lỗi middleware authenticate:', err);
    return res.status(500).json({ error: 'Lỗi xác thực token trên máy chủ.' });
  }
};

