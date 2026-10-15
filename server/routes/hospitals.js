const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/hospitals (Tìm kiếm, lọc tỉnh thành, trạng thái)
router.get('/', async (req, res) => {
  try {
    const { keyword, province, status } = req.query;

    let sql = `
      SELECT h.*, COUNT(dh.doctor_id) AS doctor_count 
      FROM hospitals h 
      LEFT JOIN doctor_hospitals dh ON h.id = dh.hospital_id 
      WHERE 1=1
    `;
    const params = [];

    if (keyword && keyword.trim()) {
      sql += ` AND (h.name LIKE ? OR h.address LIKE ? OR h.district LIKE ?)`;
      const kw = `%${keyword.trim()}%`;
      params.push(kw, kw, kw);
    }

    if (province && province !== 'Tất cả' && province !== 'ALL') {
      sql += ` AND h.province = ?`;
      params.push(province);
    }

    if (status && status !== 'ALL') {
      sql += ` AND h.status = ?`;
      params.push(status);
    }

    sql += ` GROUP BY h.id ORDER BY h.id DESC`;

    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error('Lỗi lấy danh sách bệnh viện:', err);
    return res.status(500).json({ error: 'Lỗi truy vấn danh sách bệnh viện từ MySQL.' });
  }
});

// GET /api/hospitals/provinces (Danh sách tỉnh/thành độc nhất)
router.get('/meta/provinces', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT DISTINCT province FROM hospitals WHERE province IS NOT NULL AND province <> ""'
    );
    const provinces = rows.map((r) => r.province);
    return res.json(provinces);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/hospitals/:id (Xem chi tiết bệnh viện)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT h.*, COUNT(dh.doctor_id) AS doctor_count 
       FROM hospitals h 
       LEFT JOIN doctor_hospitals dh ON h.id = dh.hospital_id 
       WHERE h.id = ? 
       GROUP BY h.id`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bệnh viện trên MySQL.' });
    }

    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/hospitals (Thêm mới bệnh viện - Module Sáng)
router.post('/', async (req, res) => {
  try {
    const { name, address, province, district, phone, email, description, image_url, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tên bệnh viện không được để trống.' });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ error: 'Địa chỉ bệnh viện không được để trống.' });
    }

    const [result] = await pool.query(
      `INSERT INTO hospitals (name, address, province, district, phone, email, description, image_url, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        address.trim(),
        province?.trim() || 'Hồ Chí Minh',
        district?.trim() || null,
        phone?.trim() || null,
        email?.trim() || null,
        description?.trim() || null,
        image_url?.trim() || 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600',
        status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      ]
    );

    const [created] = await pool.query('SELECT * FROM hospitals WHERE id = ?', [result.insertId]);
    return res.status(201).json({
      message: 'Thêm mới bệnh viện vào MySQL thành công',
      hospital: created[0],
    });
  } catch (err) {
    console.error('Lỗi thêm bệnh viện:', err);
    return res.status(500).json({ error: 'Không thể thêm bệnh viện vào MySQL.' });
  }
});

// PUT /api/hospitals/:id (Cập nhật thông tin bệnh viện)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, province, district, phone, email, description, image_url, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tên bệnh viện không được để trống.' });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ error: 'Địa chỉ không được để trống.' });
    }

    await pool.query(
      `UPDATE hospitals 
       SET name = ?, address = ?, province = ?, district = ?, phone = ?, email = ?, 
           description = ?, image_url = ?, status = ?
       WHERE id = ?`,
      [
        name.trim(),
        address.trim(),
        province?.trim() || null,
        district?.trim() || null,
        phone?.trim() || null,
        email?.trim() || null,
        description?.trim() || null,
        image_url?.trim() || null,
        status || 'ACTIVE',
        id,
      ]
    );

    const [updated] = await pool.query('SELECT * FROM hospitals WHERE id = ?', [id]);
    if (updated.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bệnh viện để cập nhật.' });
    }

    return res.json({
      message: 'Cập nhật thông tin bệnh viện thành công',
      hospital: updated[0],
    });
  } catch (err) {
    console.error('Lỗi update bệnh viện:', err);
    return res.status(500).json({ error: 'Không thể cập nhật bệnh viện trong MySQL.' });
  }
});

// PATCH /api/hospitals/:id/status (Bật / Tắt trạng thái ACTIVE / INACTIVE)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE hospitals SET status = IF(status = 'ACTIVE', 'INACTIVE', 'ACTIVE') WHERE id = ?`,
      [id]
    );

    const [updated] = await pool.query('SELECT * FROM hospitals WHERE id = ?', [id]);
    if (updated.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bệnh viện.' });
    }

    return res.json({
      message: `Đã đổi trạng thái sang ${updated[0].status}`,
      hospital: updated[0],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/hospitals/:id (Xóa bệnh viện)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM hospitals WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bệnh viện để xóa.' });
    }

    return res.json({ message: 'Đã xóa bệnh viện khỏi CSDL MySQL thành công.' });
  } catch (err) {
    console.error('Lỗi xóa bệnh viện:', err);
    return res.status(500).json({
      error: 'Không thể xóa bệnh viện do có dữ liệu liên kết bác sĩ/lịch khám. Vui lòng chuyển sang Tạm ngưng (INACTIVE).',
    });
  }
});

module.exports = router;
