const pool = require('../db');

const patientId = req => req.user._id || req.user.id;

const sendError = (res, e) => {
  console.error('[patient-booking]', e);
  if (e?.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Khung giờ này đã được đặt' });
  return res.status(500).json({ message: 'Lỗi máy chủ' });
};

function validDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === s;
}

function isFuture(date, time) {
  const appointmentMs = Date.parse(`${date}T${time}:00+07:00`);
  return Number.isFinite(appointmentMs) && appointmentMs > Date.now();
}

// GET /api/patient/hospitals
exports.hospitals = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, address, phone, email, image_url, description, rating
       FROM hospitals WHERE is_active = 1 ORDER BY name ASC`
    );
    res.json({ data: rows });
  } catch (e) { sendError(res, e); }
};

// GET /api/patient/hospitals/:hospitalId/doctors
exports.doctors = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const [rows] = await pool.query(
      `SELECT dp.id, u.full_name AS name, dp.specialty, dp.experience_years, dp.qualification,
              dp.biography, u.avatar, dp.consultation_fee
       FROM doctor_profiles dp
       JOIN users u ON u.id = dp.user_id
       JOIN hospital_doctors hd ON hd.doctor_id = dp.id
       WHERE hd.hospital_id = ? AND dp.status = 'ACTIVE' AND u.is_active = 1
       ORDER BY u.full_name ASC`,
      [hospitalId]
    );
    res.json({ data: rows });
  } catch (e) { sendError(res, e); }
};

// GET /api/patient/doctors/:doctorId/slots?date=YYYY-MM-DD
exports.slots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    if (!validDate(date)) return res.status(400).json({ message: 'Ngày không hợp lệ' });

    // Get taken slots
    const [taken] = await pool.query(
      `SELECT appointment_time FROM appointments
       WHERE doctor_id = ? AND appointment_date = ? AND status IN ('PENDING','CONFIRMED')`,
      [doctorId, date]
    );
    const takenTimes = new Set(taken.map(r => r.appointment_time?.slice(0, 5)));

    // Generate standard slots (08:00 - 17:00, every 30 min)
    const allSlots = [];
    for (let h = 8; h < 17; h++) {
      for (const m of ['00', '30']) {
        const time = `${String(h).padStart(2, '0')}:${m}`;
        allSlots.push({ time, available: !takenTimes.has(time) && isFuture(date, time) });
      }
    }
    res.json({ data: allSlots });
  } catch (e) { sendError(res, e); }
};

// POST /api/patient/appointments
exports.create = async (req, res) => {
  try {
    const { hospitalId, doctorId, date, time, note = '' } = req.body || {};
    if (!hospitalId || !doctorId || !validDate(date) ||
        typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ||
        !isFuture(date, time)) {
      return res.status(400).json({ message: 'Dữ liệu đặt lịch không hợp lệ hoặc thời gian đã qua' });
    }
    if (typeof note !== 'string' || note.length > 500) {
      return res.status(400).json({ message: 'Ghi chú tối đa 500 ký tự' });
    }

    const uid = patientId(req);

    // Get patient_profile id
    const [[profile]] = await pool.query(
      'SELECT id FROM patient_profiles WHERE user_id = ? LIMIT 1', [uid]
    );
    if (!profile) return res.status(404).json({ message: 'Không tìm thấy hồ sơ bệnh nhân' });

    const [result] = await pool.query(
      `INSERT INTO appointments (patient_id, doctor_id, hospital_id, appointment_date, appointment_time, notes, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING', NOW())`,
      [profile.id, doctorId, hospitalId, date, time, note.trim()]
    );

    const [[created]] = await pool.query(
      'SELECT * FROM appointments WHERE id = ?', [result.insertId]
    );
    return res.status(201).json({ message: 'Đặt lịch thành công', data: created });
  } catch (e) { sendError(res, e); }
};

// GET /api/patient/appointments
exports.history = async (req, res) => {
  try {
    const uid = patientId(req);
    const [[profile]] = await pool.query(
      'SELECT id FROM patient_profiles WHERE user_id = ? LIMIT 1', [uid]
    );
    if (!profile) return res.json({ data: [] });

    const [rows] = await pool.query(
      `SELECT a.*, h.name AS hospital_name, h.address AS hospital_address,
              u.full_name AS doctor_name, dp.specialty AS doctor_specialty
       FROM appointments a
       JOIN hospitals h ON h.id = a.hospital_id
       JOIN doctor_profiles dp ON dp.id = a.doctor_id
       JOIN users u ON u.id = dp.user_id
       WHERE a.patient_id = ?
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [profile.id]
    );
    res.json({ data: rows });
  } catch (e) { sendError(res, e); }
};

// PATCH /api/patient/appointments/:id/cancel
exports.cancel = async (req, res) => {
  try {
    const uid = patientId(req);
    const [[profile]] = await pool.query(
      'SELECT id FROM patient_profiles WHERE user_id = ? LIMIT 1', [uid]
    );
    if (!profile) return res.status(404).json({ message: 'Không tìm thấy hồ sơ bệnh nhân' });

    const [result] = await pool.query(
      `UPDATE appointments SET status = 'CANCELLED'
       WHERE id = ? AND patient_id = ? AND status IN ('PENDING','CONFIRMED')`,
      [req.params.id, profile.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch có thể hủy' });
    }
    const [[updated]] = await pool.query('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Đã hủy lịch', data: updated });
  } catch (e) { sendError(res, e); }
};
