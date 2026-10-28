const express = require('express');
const router = express.Router();
const pool = require('../db');
const { signToken, authenticate, requireRole, verifyPassword, hashPassword } = require('../auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Vui lòng cung cấp email hoặc số điện thoại.' });
    }

    const cleanId = identifier.trim().toLowerCase();
    const [rows] = await pool.query(
      `SELECT id, full_name, email, phone, password, role, avatar, is_active, created_at, updated_at
       FROM users 
       WHERE LOWER(email) = ? OR phone = ? LIMIT 1`,
      [cleanId, identifier.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại trong hệ thống MySQL.' });
    }

    const user = rows[0];
    if (!user.is_active) {
      return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.' });
    }
    if (!password || !(await verifyPassword(password, user.password))) {
      return res.status(401).json({ error: 'Email, số điện thoại hoặc mật khẩu không chính xác.' });
    }
    if (!user.password.startsWith('scrypt$')) {
      await pool.query('UPDATE users SET password=? WHERE id=?', [await hashPassword(password), user.id]);
    }
    const token = signToken(user);
    delete user.password;
    return res.json({
      message: 'Đăng nhập thành công từ MySQL',
      token,
      user,
    });
  } catch (err) {
    console.error('Lỗi login:', err);
    return res.status(500).json({ error: 'Lỗi máy chủ kết nối CSDL MySQL.' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;
    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ họ tên, email và mật khẩu.' });
    }

    // Kiểm tra trùng email
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = ? OR (phone IS NOT NULL AND phone = ?) LIMIT 1',
      [email.trim().toLowerCase(), phone?.trim() || '']
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email hoặc số điện thoại đã tồn tại trên MySQL.' });
    }

    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, phone, password, role, is_active, avatar) 
       VALUES (?, ?, ?, ?, 'PATIENT', TRUE, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150')`,
      [full_name.trim(), email.trim().toLowerCase(), phone?.trim() || null, await hashPassword(password)]
    );

    const newUserId = result.insertId;

    // Tự động thêm hồ sơ bệnh nhân
    await pool.query('INSERT INTO patient_profiles (user_id) VALUES (?)', [newUserId]);

    const [createdUser] = await pool.query(
      'SELECT id, full_name, email, phone, role, avatar, is_active FROM users WHERE id = ?',
      [newUserId]
    );

    return res.status(201).json({
      message: 'Đăng ký thành công tài khoản Bệnh nhân vào MySQL',
      user: createdUser[0],
    });
  } catch (err) {
    console.error('Lỗi register:', err);
    return res.status(500).json({ error: 'Không thể tạo tài khoản trên MySQL.' });
  }
});

// Role preview is limited to an authenticated administrator and returns a signed session.
router.post('/switch-role', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['ADMIN', 'DOCTOR', 'PATIENT'].includes(role)) return res.status(400).json({ error: 'Vai trò không hợp lệ.' });
    const [users] = await pool.query('SELECT id,full_name,email,phone,role,avatar,is_active FROM users WHERE role=? AND is_active=1 ORDER BY id LIMIT 1', [role]);
    if (!users.length) return res.status(404).json({ error: `Không tìm thấy tài khoản ${role} đang hoạt động.` });
    res.json({ user: users[0], token: signToken(users[0]) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/switch-user', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id,full_name,email,phone,role,avatar,is_active FROM users WHERE id=? AND is_active=1 LIMIT 1', [req.body.user_id]);
    if (!users.length) return res.status(404).json({ error: 'Không tìm thấy tài khoản đang hoạt động.' });
    res.json({ user: users[0], token: signToken(users[0]) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/auth/users (Lấy danh sách người dùng & phân quyền)
router.get('/users', async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = 'SELECT id, full_name, email, phone, role, avatar, is_active, created_at FROM users WHERE 1=1';
    const params = [];

    if (role && role !== 'ALL') {
      query += ' AND role = ?';
      params.push(role);
    }
    if (search && search.trim()) {
      query += ' AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const keyword = `%${search.trim()}%`;
      params.push(keyword, keyword, keyword);
    }

    query += ' ORDER BY id ASC';
    const [rows] = await pool.query(query, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/auth/users/:id/role (Phân quyền vai trò: ADMIN, DOCTOR, PATIENT)
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'DOCTOR', 'PATIENT'].includes(role)) {
      return res.status(400).json({ error: 'Vai trò không hợp lệ. Phải là ADMIN, DOCTOR hoặc PATIENT.' });
    }

    await pool.query('UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?', [role, id]);

    // Nếu đổi thành DOCTOR và chưa có profile, khởi tạo profile
    if (role === 'DOCTOR') {
      const [docProfile] = await pool.query('SELECT id FROM doctor_profiles WHERE user_id = ?', [id]);
      if (docProfile.length === 0) {
        await pool.query(
          `INSERT INTO doctor_profiles (user_id, license_number, experience_years, qualification, biography, status)
           VALUES (?, CONCAT('CCHN-', ?), 5, 'Bác sĩ Đa khoa', 'Bác sĩ được cấp quyền bởi Quản trị viên.', 'ACTIVE')`,
          [id, id]
        );
      }
    }

    // Nếu đổi thành PATIENT và chưa có profile
    if (role === 'PATIENT') {
      const [patProfile] = await pool.query('SELECT id FROM patient_profiles WHERE user_id = ?', [id]);
      if (patProfile.length === 0) {
        await pool.query('INSERT INTO patient_profiles (user_id) VALUES (?)', [id]);
      }
    }

    const [updated] = await pool.query('SELECT id, full_name, email, phone, role, is_active FROM users WHERE id = ?', [id]);
    return res.json({ message: 'Cập nhật phân quyền vai trò thành công trong MySQL.', user: updated[0] });
  } catch (err) {
    console.error('Lỗi cập nhật role:', err);
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/auth/users/:id/status (Khóa / Kích hoạt tài khoản)
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const [current] = await pool.query('SELECT is_active FROM users WHERE id = ?', [id]);
    if (current.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng trong MySQL.' });
    }

    const newStatus = !current[0].is_active;
    await pool.query('UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?', [newStatus, id]);

    return res.json({
      message: newStatus ? 'Đã kích hoạt tài khoản thành công.' : 'Đã khóa tài khoản thành công.',
      is_active: newStatus,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/users (Tạo tài khoản mới và chỉ định vai trò bởi Admin)
router.post('/users', async (req, res) => {
  try {
    const { full_name, email, phone, password, role, avatar } = req.body;
    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ error: 'Vui lòng cung cấp họ tên, email, mật khẩu và vai trò.' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1', [email.trim().toLowerCase()]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email này đã tồn tại trong CSDL.' });
    }

    const defaultAvatar = avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';

    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, phone, password, role, is_active, avatar)
       VALUES (?, ?, ?, ?, ?, TRUE, ?)`,
      [full_name.trim(), email.trim().toLowerCase(), phone?.trim() || null, await hashPassword(password), role, defaultAvatar]
    );

    const newId = result.insertId;
    if (role === 'DOCTOR') {
      await pool.query(
        `INSERT INTO doctor_profiles (user_id, license_number, experience_years, qualification, status)
         VALUES (?, CONCAT('CCHN-', ?), 5, 'Bác sĩ Chuyên khoa', 'ACTIVE')`,
        [newId, newId]
      );
    } else if (role === 'PATIENT') {
      await pool.query('INSERT INTO patient_profiles (user_id) VALUES (?)', [newId]);
    }

    const [newUser] = await pool.query('SELECT id, full_name, email, phone, role, avatar, is_active FROM users WHERE id = ?', [newId]);
    return res.status(201).json({ message: 'Tạo tài khoản thành công trong MySQL.', user: newUser[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/auth/users/:id/avatar (Cập nhật ảnh đại diện người dùng)
router.patch('/users/:id/avatar', async (req, res) => {
  try {
    const { id } = req.params;
    const { avatar } = req.body;
    if (!avatar) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đường dẫn ảnh đại diện.' });
    }

    await pool.query('UPDATE users SET avatar = ?, updated_at = NOW() WHERE id = ?', [avatar, id]);
    const [rows] = await pool.query('SELECT id, full_name, email, phone, role, avatar, is_active FROM users WHERE id = ?', [id]);
    return res.json({ message: 'Cập nhật ảnh đại diện thành công.', user: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
