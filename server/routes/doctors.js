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
    dp.license_number,
    dp.experience_years,
    dp.qualification,
    dp.biography,
    dp.status,
    specialty_data.specialty_names,
    h.id AS hospital_id,
    h.name AS hospital_name,
    h.address AS hospital_address,
    primary_dh.room_number,
    primary_dh.consultation_fee
  FROM doctor_profiles dp
  JOIN users u ON u.id = dp.user_id
  LEFT JOIN (
    SELECT ds.doctor_id, GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') AS specialty_names
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

  return {
    id: row.id,
    user_id: row.user_id,
    full_name: row.full_name,
    avatar: row.avatar,
    phone: row.phone,
    email: row.email,
    license_number: row.license_number,
    qualification: row.qualification,
    experience_years: row.experience_years,
    biography: row.biography,
    status: row.status,
    specialty: specialties.length ? specialties.join(', ') : null,
    specialties,
    hospital_id: row.hospital_id,
    hospital_name: row.hospital_name,
    hospital_address: row.hospital_address,
    room_number: row.room_number,
    consultation_fee: row.consultation_fee === null ? null : Number(row.consultation_fee),
  };
};

// GET /api/doctors (Tìm kiếm theo tên, chuyên khoa hoặc bệnh viện)
router.get('/', async (req, res) => {
  try {
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.trim() : '';
    const specialty = typeof req.query.specialty === 'string' ? req.query.specialty.trim() : '';
    const hospitalId = typeof req.query.hospital_id === 'string' ? req.query.hospital_id.trim() : '';
    const conditions = ["dp.status = 'ACTIVE'", 'u.is_active = 1'];
    const params = hospitalId ? [hospitalId] : [];

    if (keyword) {
      conditions.push(`(
        u.full_name LIKE ?
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
      params.push(pattern, pattern, pattern, pattern);
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

    if (hospitalId) {
      conditions.push(`EXISTS (
        SELECT 1
        FROM doctor_hospitals filter_dh
        WHERE filter_dh.doctor_id = dp.id AND filter_dh.hospital_id = ?
      )`);
      params.push(hospitalId);
    }

    const [rows] = await pool.query(
      `${getDoctorSelect(hospitalId)}
       WHERE ${conditions.join(' AND ')}
       ORDER BY dp.id ASC`,
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
       WHERE dp.id = ? AND u.is_active = 1
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

module.exports = router;
