const express = require('express');
const router = express.Router();
const pool = require('../db');

const getDoctorSelect = (hospitalId = '') => `
  SELECT
    dp.id,
    dp.user_id,
    u.full_name,
    u.avatar,
    u.phone,
    u.email,
    u.is_active AS user_active,
    dp.license_number,
    dp.experience_years,
    dp.qualification,
    dp.biography,
    dp.status,
    specialty_data.specialty_names,
    specialty_data.specialty_ids,
    h.id AS hospital_id,
    h.name AS hospital_name,
    h.address AS hospital_address,
    primary_dh.room_number,
    primary_dh.consultation_fee
  FROM doctor_profiles dp
  JOIN users u ON u.id = dp.user_id
  LEFT JOIN (
    SELECT 
      ds.doctor_id, 
      GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') AS specialty_names,
      GROUP_CONCAT(DISTINCT ds.specialty_id ORDER BY ds.specialty_id SEPARATOR ',') AS specialty_ids
    FROM doctor_specialties ds
    JOIN specialties s ON s.id = ds.specialty_id
    GROUP BY ds.doctor_id
  ) specialty_data ON specialty_data.doctor_id = dp.id
  LEFT JOIN doctor_hospitals primary_dh
    ON primary_dh.doctor_id = dp.id
    AND primary_dh.hospital_id = (
      SELECT MIN(dh.hospital_id)
      FROM doctor_hospitals dh
      WHERE dh.doctor_id = dp.id ${hospitalId ? 'AND dh.hospital_id = ?' : ''}
    )
  LEFT JOIN hospitals h ON h.id = primary_dh.hospital_id
`;

const toDoctor = (row) => {
  const specialties = row.specialty_names
    ? row.specialty_names.split(', ').filter(Boolean)
    : [];
  const specialty_ids = row.specialty_ids
    ? row.specialty_ids.split(',').map((id) => Number(id)).filter(Boolean)
    : [];

  return {
    id: row.id,
    user_id: row.user_id,
    full_name: row.full_name,
    avatar: row.avatar,
    phone: row.phone,
    email: row.email,
    is_active: Boolean(row.user_active),
    license_number: row.license_number,
    qualification: row.qualification,
    experience_years: row.experience_years,
    biography: row.biography,
    status: row.status,
    specialty: specialties.length ? specialties.join(', ') : null,
    specialties,
    specialty_ids,
    hospital_id: row.hospital_id,
    hospital_name: row.hospital_name,
    hospital_address: row.hospital_address,
    room_number: row.room_number,
    consultation_fee: row.consultation_fee === null ? null : Number(row.consultation_fee),
  };
};

// GET /api/doctors/meta/specialties (Danh sách tất cả chuyên khoa)
router.get('/meta/specialties', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, description, image_url FROM specialties ORDER BY name ASC'
    );
    return res.json(rows);
  } catch (err) {
    console.error('Lỗi lấy danh sách chuyên khoa:', err);
    return res.status(500).json({ error: 'Lỗi truy vấn chuyên khoa từ MySQL.' });
  }
});

// GET /api/doctors (Tìm kiếm theo tên, chuyên khoa, bệnh viện, trạng thái)
router.get('/', async (req, res) => {
  try {
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.trim() : '';
    const specialty = typeof req.query.specialty === 'string' ? req.query.specialty.trim() : '';
    const hospitalId = typeof req.query.hospital_id === 'string' ? req.query.hospital_id.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const isAdmin = req.query.admin === 'true' || req.query.admin === true;

    const conditions = ['1 = 1'];
    const params = hospitalId ? [hospitalId] : [];

    // Lọc theo trạng thái
    if (status && status !== 'ALL') {
      conditions.push('dp.status = ?');
      params.push(status);
    } else if (!isAdmin && status !== 'ALL') {
      conditions.push("dp.status = 'ACTIVE'", 'u.is_active = 1');
    }

    if (keyword) {
      conditions.push(`(
        u.full_name LIKE ?
        OR u.phone LIKE ?
        OR u.email LIKE ?
        OR dp.license_number LIKE ?
        OR dp.qualification LIKE ?
        OR EXISTS (
          SELECT 1
          FROM doctor_specialties search_ds
          JOIN specialties search_s ON search_s.id = search_ds.specialty_id
          WHERE search_ds.doctor_id = dp.id AND search_s.name LIKE ?
        )
        OR EXISTS (
          SELECT 1
          FROM doctor_hospitals search_dh
          JOIN hospitals search_h ON search_h.id = search_dh.hospital_id
          WHERE search_dh.doctor_id = dp.id AND search_h.name LIKE ?
        )
      )`);
      const pattern = `%${keyword}%`;
      params.push(pattern, pattern, pattern, pattern, pattern, pattern, pattern);
    }

    if (specialty && specialty !== 'Tất cả') {
      conditions.push(`EXISTS (
        SELECT 1
        FROM doctor_specialties filter_ds
        JOIN specialties filter_s ON filter_s.id = filter_ds.specialty_id
        WHERE filter_ds.doctor_id = dp.id AND filter_s.name LIKE ?
      )`);
      params.push(`%${specialty}%`);
    }

    if (hospitalId && hospitalId !== 'ALL') {
      conditions.push(`EXISTS (
        SELECT 1
        FROM doctor_hospitals filter_dh
        WHERE filter_dh.doctor_id = dp.id AND filter_dh.hospital_id = ?
      )`);
      params.push(hospitalId);
    }

    const [rows] = await pool.query(
      `${getDoctorSelect(hospitalId && hospitalId !== 'ALL' ? hospitalId : '')}
       WHERE ${conditions.join(' AND ')}
       ORDER BY dp.id DESC`,
      params
    );

    return res.json(rows.map(toDoctor));
  } catch (err) {
    console.error('Lỗi lấy danh sách bác sĩ:', err);
    return res.status(500).json({ error: 'Lỗi truy vấn danh sách bác sĩ từ MySQL.' });
  }
});

// GET /api/doctors/:id (Chi tiết bác sĩ)
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `${getDoctorSelect()}
       WHERE dp.id = ?
       LIMIT 1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bác sĩ trong hệ thống.' });
    }

    const doctor = toDoctor(rows[0]);
    const [hospitals] = await pool.query(
      `SELECT
         h.id AS hospital_id,
         h.name AS hospital_name,
         h.address AS hospital_address,
         h.phone AS hospital_phone,
         dh.room_number,
         dh.consultation_fee
       FROM doctor_hospitals dh
       JOIN hospitals h ON h.id = dh.hospital_id
       WHERE dh.doctor_id = ?
       ORDER BY h.id ASC`,
      [req.params.id]
    );
    const [schedules] = await pool.query(
      `SELECT hospital_id, day_of_week, start_time, end_time, slot_duration
       FROM doctor_schedules
       WHERE doctor_id = ? AND is_active = 1
       ORDER BY hospital_id, day_of_week, start_time`,
      [req.params.id]
    );

    doctor.hospitals = hospitals.map((hospital) => ({
      ...hospital,
      consultation_fee:
        hospital.consultation_fee === null ? null : Number(hospital.consultation_fee),
      schedules: schedules.filter((schedule) => schedule.hospital_id === hospital.hospital_id),
    }));

    return res.json(doctor);
  } catch (err) {
    console.error('Lỗi lấy chi tiết bác sĩ:', err);
    return res.status(500).json({ error: 'Lỗi truy vấn chi tiết bác sĩ từ MySQL.' });
  }
});

// POST /api/doctors (Tạo mới bác sĩ - Admin CRUD)
router.post('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      full_name,
      email,
      phone,
      password,
      avatar,
      license_number,
      experience_years,
      qualification,
      biography,
      status,
      hospital_id,
      room_number,
      consultation_fee,
      specialty_ids,
    } = req.body;

    if (!full_name || !full_name.trim()) {
      await conn.rollback();
      return res.status(400).json({ error: 'Họ và tên bác sĩ không được để trống.' });
    }

    if (!email || !email.trim()) {
      await conn.rollback();
      return res.status(400).json({ error: 'Email bác sĩ không được để trống.' });
    }

    // Kiểm tra trùng email
    const [existingUsers] = await conn.query('SELECT id FROM users WHERE email = ?', [email.trim()]);
    if (existingUsers.length > 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Email này đã tồn tại trong hệ thống.' });
    }

    // 1. Tạo bản ghi users
    const [userResult] = await conn.query(
      `INSERT INTO users (full_name, email, phone, password, role, avatar, is_active)
       VALUES (?, ?, ?, ?, 'DOCTOR', ?, ?)`,
      [
        full_name.trim(),
        email.trim(),
        phone ? phone.trim() : null,
        password ? password.trim() : '123456',
        avatar ? avatar.trim() : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300',
        status === 'INACTIVE' ? 0 : 1,
      ]
    );
    const userId = userResult.insertId;

    // 2. Tạo bản ghi doctor_profiles
    const [profileResult] = await conn.query(
      `INSERT INTO doctor_profiles (user_id, license_number, experience_years, qualification, biography, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        license_number ? license_number.trim() : null,
        Number(experience_years) || 0,
        qualification ? qualification.trim() : 'Bác sĩ',
        biography ? biography.trim() : null,
        status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      ]
    );
    const doctorId = profileResult.insertId;

    // 3. Liên kết bệnh viện nếu có
    if (hospital_id) {
      await conn.query(
        `INSERT INTO doctor_hospitals (doctor_id, hospital_id, room_number, consultation_fee)
         VALUES (?, ?, ?, ?)`,
        [
          doctorId,
          hospital_id,
          room_number ? room_number.trim() : null,
          consultation_fee ? Number(consultation_fee) : 200000,
        ]
      );
    }

    // 4. Liên kết chuyên khoa nếu có
    if (Array.isArray(specialty_ids) && specialty_ids.length > 0) {
      for (const specId of specialty_ids) {
        await conn.query(
          `INSERT IGNORE INTO doctor_specialties (doctor_id, specialty_id)
           VALUES (?, ?)`,
          [doctorId, specId]
        );
      }
    }

    await conn.commit();

    // Lấy thông tin bác sĩ hoàn chỉnh trả về
    const [createdRows] = await pool.query(
      `${getDoctorSelect()} WHERE dp.id = ? LIMIT 1`,
      [doctorId]
    );

    return res.status(201).json({
      message: 'Thêm mới bác sĩ thành công.',
      doctor: toDoctor(createdRows[0]),
    });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi thêm bác sĩ:', err);
    return res.status(500).json({ error: 'Không thể tạo mới bác sĩ trên MySQL: ' + err.message });
  } finally {
    conn.release();
  }
});

// PUT /api/doctors/:id (Cập nhật thông tin bác sĩ - Admin CRUD)
router.put('/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const doctorId = req.params.id;

    const [existingProfile] = await conn.query(
      'SELECT id, user_id FROM doctor_profiles WHERE id = ?',
      [doctorId]
    );

    if (existingProfile.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ bác sĩ.' });
    }

    const userId = existingProfile[0].user_id;
    const {
      full_name,
      email,
      phone,
      avatar,
      license_number,
      experience_years,
      qualification,
      biography,
      status,
      hospital_id,
      room_number,
      consultation_fee,
      specialty_ids,
    } = req.body;

    if (!full_name || !full_name.trim()) {
      await conn.rollback();
      return res.status(400).json({ error: 'Họ và tên bác sĩ không được để trống.' });
    }

    // 1. Cập nhật bảng users
    await conn.query(
      `UPDATE users 
       SET full_name = ?, phone = ?, avatar = COALESCE(?, avatar), is_active = ?
       WHERE id = ?`,
      [
        full_name.trim(),
        phone ? phone.trim() : null,
        avatar ? avatar.trim() : null,
        status === 'INACTIVE' ? 0 : 1,
        userId,
      ]
    );

    // 2. Cập nhật bảng doctor_profiles
    await conn.query(
      `UPDATE doctor_profiles
       SET license_number = ?, experience_years = ?, qualification = ?, biography = ?, status = ?
       WHERE id = ?`,
      [
        license_number ? license_number.trim() : null,
        Number(experience_years) || 0,
        qualification ? qualification.trim() : 'Bác sĩ',
        biography ? biography.trim() : null,
        status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
        doctorId,
      ]
    );

    // 3. Cập nhật liên kết bệnh viện
    if (hospital_id) {
      await conn.query(
        `INSERT INTO doctor_hospitals (doctor_id, hospital_id, room_number, consultation_fee)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE room_number = VALUES(room_number), consultation_fee = VALUES(consultation_fee)`,
        [
          doctorId,
          hospital_id,
          room_number ? room_number.trim() : null,
          consultation_fee ? Number(consultation_fee) : 200000,
        ]
      );
    }

    // 4. Cập nhật chuyên khoa
    if (Array.isArray(specialty_ids)) {
      await conn.query('DELETE FROM doctor_specialties WHERE doctor_id = ?', [doctorId]);
      for (const specId of specialty_ids) {
        await conn.query(
          `INSERT IGNORE INTO doctor_specialties (doctor_id, specialty_id)
           VALUES (?, ?)`,
          [doctorId, specId]
        );
      }
    }

    await conn.commit();

    const [updatedRows] = await pool.query(
      `${getDoctorSelect()} WHERE dp.id = ? LIMIT 1`,
      [doctorId]
    );

    return res.json({
      message: 'Cập nhật bác sĩ thành công.',
      doctor: toDoctor(updatedRows[0]),
    });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi cập nhật bác sĩ:', err);
    return res.status(500).json({ error: 'Không thể cập nhật bác sĩ trên MySQL: ' + err.message });
  } finally {
    conn.release();
  }
});

// PATCH /api/doctors/:id/status (Bật / Tắt trạng thái Hoạt động)
router.patch('/:id/status', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const doctorId = req.params.id;

    const [rows] = await conn.query(
      'SELECT id, user_id, status FROM doctor_profiles WHERE id = ?',
      [doctorId]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ bác sĩ.' });
    }

    const currentStatus = rows[0].status;
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const newActiveFlag = newStatus === 'ACTIVE' ? 1 : 0;

    await conn.query('UPDATE doctor_profiles SET status = ? WHERE id = ?', [newStatus, doctorId]);
    await conn.query('UPDATE users SET is_active = ? WHERE id = ?', [newActiveFlag, rows[0].user_id]);

    await conn.commit();

    return res.json({
      message: `Đã đổi trạng thái bác sĩ sang ${newStatus === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngưng'}`,
      status: newStatus,
    });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi đổi trạng thái bác sĩ:', err);
    return res.status(500).json({ error: 'Không thể đổi trạng thái bác sĩ.' });
  } finally {
    conn.release();
  }
});

// DELETE /api/doctors/:id (Xóa bác sĩ)
router.delete('/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const doctorId = req.params.id;

    // Kiểm tra xem bác sĩ có lịch hẹn khám chưa
    const [apps] = await conn.query(
      'SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ?',
      [doctorId]
    );

    if (apps[0].count > 0) {
      return res.status(400).json({
        error: `Bác sĩ đã có ${apps[0].count} lịch hẹn khám trong hệ thống. Không thể xóa dữ liệu vĩnh viễn, vui lòng chuyển trạng thái sang Tạm ngưng (INACTIVE).`,
      });
    }

    await conn.beginTransaction();

    const [profiles] = await conn.query('SELECT user_id FROM doctor_profiles WHERE id = ?', [doctorId]);
    if (profiles.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Không tìm thấy bác sĩ để xóa.' });
    }

    const userId = profiles[0].user_id;

    // Xóa liên kết
    await conn.query('DELETE FROM doctor_specialties WHERE doctor_id = ?', [doctorId]);
    await conn.query('DELETE FROM doctor_hospitals WHERE doctor_id = ?', [doctorId]);
    await conn.query('DELETE FROM doctor_schedules WHERE doctor_id = ?', [doctorId]);
    await conn.query('DELETE FROM doctor_time_offs WHERE doctor_id = ?', [doctorId]);
    await conn.query('DELETE FROM doctor_profiles WHERE id = ?', [doctorId]);
    await conn.query('DELETE FROM users WHERE id = ?', [userId]);

    await conn.commit();
    return res.json({ message: 'Đã xóa bác sĩ khỏi hệ thống thành công.' });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi xóa bác sĩ:', err);
    return res.status(500).json({ error: 'Lỗi khi xóa bác sĩ: ' + err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
