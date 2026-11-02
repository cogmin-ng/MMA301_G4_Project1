const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/hospitals (Tìm kiếm, lọc tỉnh thành, trạng thái)
router.get('/', async (req, res) => {
  try {
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.trim() : '';
    const province = typeof req.query.province === 'string' ? req.query.province : '';
    const status = typeof req.query.status === 'string' ? req.query.status : '';

    const conditions = ['1 = 1'];
    const params = [];

    if (keyword) {
      conditions.push('(h.name LIKE ? OR h.address LIKE ? OR h.district LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }

    if (province && province !== 'Tất cả' && province !== 'ALL') {
      conditions.push('h.province = ?');
      params.push(province);
    }

    if (status && status !== 'ALL') {
      conditions.push('h.status = ?');
      params.push(status);
    }

    const [rows] = await pool.query(
      `SELECT
         h.*,
         (SELECT COUNT(DISTINCT dh.doctor_id)
          FROM doctor_hospitals dh
          WHERE dh.hospital_id = h.id) AS doctor_count,
         (SELECT GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ')
          FROM doctor_hospitals dh
          JOIN doctor_profiles dp ON dp.id = dh.doctor_id AND dp.status = 'ACTIVE'
          JOIN users u ON u.id = dp.user_id AND u.is_active = 1
          JOIN doctor_specialties ds ON ds.doctor_id = dp.id
          JOIN specialties s ON s.id = ds.specialty_id
          WHERE dh.hospital_id = h.id) AS specialty_names
       FROM hospitals h
       WHERE ${conditions.join(' AND ')}
       ORDER BY h.id DESC`,
      params
    );
    return res.json(rows.map((hospital) => ({
      ...hospital,
      doctor_count: Number(hospital.doctor_count),
      specialties: hospital.specialty_names
        ? hospital.specialty_names.split(', ').filter(Boolean)
        : [],
    })));
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
      `SELECT
         h.*,
         (SELECT COUNT(DISTINCT dh.doctor_id)
          FROM doctor_hospitals dh
          WHERE dh.hospital_id = h.id) AS doctor_count
       FROM hospitals h
       WHERE h.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bệnh viện trên MySQL.' });
    }

    const hospital = rows[0];

    // Lấy danh sách bác sĩ thuộc bệnh viện này
    const [doctors] = await pool.query(
      `SELECT
        dp.id,
        dp.user_id,
        u.full_name,
        u.avatar,
        u.phone,
        u.email,
        dp.qualification,
        dp.experience_years,
        dp.biography,
        dp.status,
        (SELECT GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ')
         FROM doctor_specialties ds
         JOIN specialties s ON s.id = ds.specialty_id
         WHERE ds.doctor_id = dp.id) AS specialty_names,
        dh.room_number,
        dh.consultation_fee
       FROM doctor_hospitals dh
       JOIN doctor_profiles dp ON dh.doctor_id = dp.id
       JOIN users u ON dp.user_id = u.id
       WHERE dh.hospital_id = ? AND dp.status = 'ACTIVE' AND u.is_active = 1
       ORDER BY dp.id`,
      [id]
    );

    const [specialties] = await pool.query(
      `SELECT DISTINCT s.name
       FROM doctor_hospitals dh
       JOIN doctor_profiles dp ON dp.id = dh.doctor_id AND dp.status = 'ACTIVE'
       JOIN users u ON u.id = dp.user_id AND u.is_active = 1
       JOIN doctor_specialties ds ON ds.doctor_id = dp.id
       JOIN specialties s ON s.id = ds.specialty_id
       WHERE dh.hospital_id = ?
       ORDER BY s.name`,
      [id]
    );
    const [workingHours] = await pool.query(
      `SELECT day_of_week, open_time, close_time, is_closed
       FROM hospital_working_hours
       WHERE hospital_id = ?
       ORDER BY day_of_week`,
      [id]
    );

    hospital.doctor_count = Number(hospital.doctor_count);
    hospital.doctors = doctors.map((d) => ({
      id: d.id,
      user_id: d.user_id,
      full_name: d.full_name,
      avatar: d.avatar,
      phone: d.phone,
      email: d.email,
      qualification: d.qualification,
      experience_years: d.experience_years,
      biography: d.biography,
      status: d.status,
      specialty: d.specialty_names || null,
      specialties: d.specialty_names ? d.specialty_names.split(', ').filter(Boolean) : [],
      room_number: d.room_number,
      consultation_fee: d.consultation_fee === null ? null : Number(d.consultation_fee),
    }));
    hospital.specialties = specialties.map((specialty) => specialty.name);
    hospital.working_hours = workingHours;

    return res.json(hospital);
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
