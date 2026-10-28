const crypto = require('crypto');
const { promisify } = require('util');
const scrypt = promisify(crypto.scrypt);
// An ephemeral development key keeps local runs usable. Production must provide a stable secret.
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex');

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters.');
  const now = Math.floor(Date.now() / 1000);
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const body = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: String(user.id), role: user.role, iat: now, exp: now + 60 * 60 * 12 })}`;
  const signature = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function authenticate(req, res, next) {
  try {
    const secret = process.env.JWT_SECRET;
    const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!secret || secret.length < 32 || !token) return res.status(401).json({ error: 'Vui lòng đăng nhập.' });
    const parts = token.split('.');
    if (parts.length !== 3) return res.status(401).json({ error: 'Token không hợp lệ.' });
    const expected = crypto.createHmac('sha256', secret).update(`${parts[0]}.${parts[1]}`).digest();
    const actual = Buffer.from(parts[2], 'base64url');
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return res.status(401).json({ error: 'Token không hợp lệ.' });
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (!payload.sub || !payload.exp || payload.exp <= Date.now() / 1000) return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn.' });
    req.auth = { userId: Number(payload.sub), role: payload.role };
    next();
  } catch { return res.status(401).json({ error: 'Token không hợp lệ.' }); }
}

function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      const pool = require('./db');
      const [rows] = await pool.query('SELECT id, role, is_active FROM users WHERE id=? LIMIT 1', [req.auth.userId]);
      if (!rows.length || !rows[0].is_active) return res.status(401).json({ error: 'Tài khoản không tồn tại hoặc đã bị khóa.' });
      if (!roles.includes(rows[0].role)) return res.status(403).json({ error: 'Bạn không có quyền thực hiện thao tác này.' });
      req.user = rows[0];
      next();
    } catch (err) { next(err); }
  };
}

async function verifyPassword(password, stored) {
  if (stored.startsWith('scrypt$')) {
    const [, salt, hash] = stored.split('$');
    const actual = await scrypt(password, salt, 64);
    const expected = Buffer.from(hash, 'hex');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  }
  return password === stored;
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `scrypt$${salt}$${(await scrypt(password, salt, 64)).toString('hex')}`;
}

module.exports = { signToken, authenticate, requireRole, verifyPassword, hashPassword };
