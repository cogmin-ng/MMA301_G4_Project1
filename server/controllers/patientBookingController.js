const crypto = require('crypto');
const pool = require('../db');

const sendError = (res, error) => {
  console.error('[patient-booking]', error);
  if (error?.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Khung giờ này đã được đặt.' });
  return res.status(500).json({ message: 'Lỗi máy chủ.' });
};

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function isFuture(date, time) {
  const timestamp = Date.parse(`${date}T${time}:00+07:00`);
  return Number.isFinite(timestamp) && timestamp > Date.now();
}

const timeToMinutes = (value) => {
  const [hours, minutes] = String(value).split(':').map(Number);
  return hours * 60 + minutes;
};
const minutesToTime = (value) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}:00`;

// GET /api/patient/hospitals
exports.hospitals = async (_req, res) => {
  try {
    const [rows] = await pool.query(`SELECT id,name,address,phone,email,image_url,description
      FROM hospitals WHERE status='ACTIVE' ORDER BY name ASC`);
    res.json({ data: rows });
  } catch (error) { sendError(res, error); }
};

// GET /api/patient/hospitals/:hospitalId/doctors
exports.doctors = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT dp.id,u.full_name AS name,dp.experience_years,dp.qualification,
        dp.biography,u.avatar,dh.consultation_fee,
        GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') AS specialty
      FROM doctor_hospitals dh
      JOIN doctor_profiles dp ON dp.id=dh.doctor_id AND dp.status='ACTIVE'
      JOIN users u ON u.id=dp.user_id AND u.is_active=1
      LEFT JOIN doctor_specialties ds ON ds.doctor_id=dp.id
      LEFT JOIN specialties s ON s.id=ds.specialty_id
      WHERE dh.hospital_id=? GROUP BY dp.id,u.full_name,dp.experience_years,dp.qualification,dp.biography,u.avatar,dh.consultation_fee
      ORDER BY u.full_name ASC`, [req.params.hospitalId]);
    res.json({ data: rows });
  } catch (error) { sendError(res, error); }
};

// GET /api/patient/doctors/:doctorId/slots?hospitalId=...&date=YYYY-MM-DD
exports.slots = async (req, res) => {
  try {
    const { date } = req.query;
    const hospitalId = req.query.hospitalId;
    if (!validDate(date) || !hospitalId) return res.status(400).json({ message: 'Ngày và cơ sở khám không hợp lệ.' });
    const [schedules] = await pool.query(`SELECT start_time,end_time,slot_duration FROM doctor_schedules
      WHERE doctor_id=? AND hospital_id=? AND day_of_week=WEEKDAY(?) + 1 AND is_active=1 ORDER BY start_time`,
    [req.params.doctorId,hospitalId,date]);
    const [timeOffs] = await pool.query(`SELECT start_datetime,end_datetime FROM doctor_time_offs
      WHERE doctor_id=? AND hospital_id=? AND start_datetime < DATE_ADD(?, INTERVAL 1 DAY) AND end_datetime > ?`,
    [req.params.doctorId,hospitalId,date,date]);
    const [appointments] = await pool.query(`SELECT start_time,end_time FROM appointments
      WHERE doctor_id=? AND hospital_id=? AND appointment_date=? AND status IN ('PENDING','CONFIRMED')`,
    [req.params.doctorId,hospitalId,date]);
    const [slotRows] = await pool.query(`SELECT start_time,status FROM appointment_slots
      WHERE doctor_id=? AND hospital_id=? AND slot_date=?`, [req.params.doctorId,hospitalId,date]);
    const registered = new Map(slotRows.map((row) => [String(row.start_time).slice(0,5), row.status]));
    const busyTimes = appointments.map((row) => ({ start: timeToMinutes(row.start_time), end: timeToMinutes(row.end_time) }));
    const unavailable = timeOffs.map((row) => ({ start: new Date(row.start_datetime), end: new Date(row.end_datetime) }));
    const result = [];
    for (const schedule of schedules) {
      const duration = Number(schedule.slot_duration);
      for (let start = timeToMinutes(schedule.start_time), finish = timeToMinutes(schedule.end_time); start + duration <= finish; start += duration) {
        const end = start + duration;
        const time = minutesToTime(start).slice(0,5);
        const localStart = new Date(`${date}T${minutesToTime(start)}+07:00`);
        const localEnd = new Date(`${date}T${minutesToTime(end)}+07:00`);
        const stored = registered.get(time);
        const clashesWithAppointment = busyTimes.some((busy) => busy.start < end && busy.end > start);
        const clashesWithTimeOff = unavailable.some((busy) => busy.start < localEnd && busy.end > localStart);
        result.push({ time, available: isFuture(date,time) && !clashesWithAppointment && !clashesWithTimeOff && stored !== 'BOOKED' && stored !== 'BLOCKED' });
      }
    }
    res.json({ data: result });
  } catch (error) { sendError(res, error); }
};

// POST /api/patient/appointments
exports.create = async (req, res) => {
  const { hospitalId, doctorId, date, time, note = '' } = req.body || {};
  if (!hospitalId || !doctorId || !validDate(date) || typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || !isFuture(date,time)) {
    return res.status(400).json({ message: 'Dữ liệu đặt lịch không hợp lệ hoặc thời gian đã qua.' });
  }
  if (typeof note !== 'string' || note.length > 500) return res.status(400).json({ message: 'Ghi chú tối đa 500 ký tự.' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const userId = req.user.id;
    const [[patient]] = await conn.query(`SELECT u.full_name,u.phone,pp.date_of_birth,pp.gender
      FROM users u LEFT JOIN patient_profiles pp ON pp.user_id=u.id WHERE u.id=?`, [userId]);
    if (!patient) { await conn.rollback(); return res.status(404).json({ message: 'Không tìm thấy hồ sơ bệnh nhân.' }); }
    if (!patient.phone) { await conn.rollback(); return res.status(400).json({ message: 'Vui lòng cập nhật số điện thoại trước khi đặt lịch.' }); }

    const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay() || 7;
    const [[schedule]] = await conn.query(`SELECT id,start_time,end_time,slot_duration FROM doctor_schedules
      WHERE doctor_id=? AND hospital_id=? AND day_of_week=? AND is_active=1 ORDER BY start_time LIMIT 1 FOR UPDATE`, [doctorId,hospitalId,dayOfWeek]);
    const start = timeToMinutes(time);
    if (!schedule || start < timeToMinutes(schedule.start_time) || start + Number(schedule.slot_duration) > timeToMinutes(schedule.end_time) || (start-timeToMinutes(schedule.start_time)) % Number(schedule.slot_duration) !== 0) {
      await conn.rollback(); return res.status(409).json({ message: 'Khung giờ này không nằm trong lịch làm việc của bác sĩ.' });
    }
    const end = start + Number(schedule.slot_duration);
    const startTime = minutesToTime(start); const endTime = minutesToTime(end);
    const [[timeOff]] = await conn.query(`SELECT id FROM doctor_time_offs WHERE doctor_id=? AND hospital_id=?
      AND start_datetime < ? AND end_datetime > ? LIMIT 1`, [doctorId,hospitalId,`${date} ${endTime}`,`${date} ${startTime}`]);
    if (timeOff) { await conn.rollback(); return res.status(409).json({ message: 'Bác sĩ bận trong khoảng thời gian này.' }); }
    const [[appointment]] = await conn.query(`SELECT id FROM appointments WHERE doctor_id=? AND hospital_id=? AND appointment_date=?
      AND status IN ('PENDING','CONFIRMED') AND start_time < ? AND end_time > ? LIMIT 1 FOR UPDATE`, [doctorId,hospitalId,date,endTime,startTime]);
    if (appointment) { await conn.rollback(); return res.status(409).json({ message: 'Khung giờ này đã được đặt.' }); }
    const [[slot]] = await conn.query(`SELECT id,status FROM appointment_slots WHERE doctor_id=? AND hospital_id=? AND slot_date=? AND start_time=? FOR UPDATE`, [doctorId,hospitalId,date,startTime]);
    if (slot && slot.status !== 'AVAILABLE') { await conn.rollback(); return res.status(409).json({ message: 'Khung giờ này hiện không còn trống.' }); }

    const [[doctor]] = await conn.query(`SELECT dh.consultation_fee FROM doctor_hospitals dh JOIN doctor_profiles dp ON dp.id=dh.doctor_id
      JOIN users u ON u.id=dp.user_id WHERE dh.doctor_id=? AND dh.hospital_id=? AND dp.status='ACTIVE' AND u.is_active=1`, [doctorId,hospitalId]);
    if (!doctor) { await conn.rollback(); return res.status(404).json({ message: 'Bác sĩ không khám tại cơ sở đã chọn.' }); }
    const code = `MED-${date.replaceAll('-','')}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const [created] = await conn.query(`INSERT INTO appointments
      (appointment_code,patient_id,doctor_id,hospital_id,appointment_date,start_time,end_time,patient_name,patient_phone,patient_dob,patient_gender,symptoms,consultation_fee,status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'PENDING')`, [code,userId,doctorId,hospitalId,date,startTime,endTime,patient.full_name,patient.phone,patient.date_of_birth,patient.gender,note.trim() || null,Number(doctor.consultation_fee || 0)]);
    if (slot) {
      await conn.query(`UPDATE appointment_slots SET status='BOOKED',appointment_id=? WHERE id=?`, [created.insertId,slot.id]);
    } else {
      await conn.query(`INSERT INTO appointment_slots (doctor_id,hospital_id,slot_date,start_time,end_time,status,appointment_id)
        VALUES (?,?,?,?,?,'BOOKED',?)`, [doctorId,hospitalId,date,startTime,endTime,created.insertId]);
    }
    await conn.query(`INSERT INTO appointment_status_history (appointment_id,old_status,new_status,changed_by,note)
      VALUES (?,NULL,'PENDING',?,'Đặt lịch qua ứng dụng')`, [created.insertId,userId]);
    await conn.commit();
    const [[appointmentRow]] = await pool.query(`SELECT a.id,a.appointment_code,a.appointment_date,a.start_time,a.end_time,a.status,
      h.name AS hospital_name,du.full_name AS doctor_name FROM appointments a JOIN hospitals h ON h.id=a.hospital_id
      JOIN doctor_profiles dp ON dp.id=a.doctor_id JOIN users du ON du.id=dp.user_id WHERE a.id=?`, [created.insertId]);
    res.status(201).json({ message: 'Đặt lịch thành công, đang chờ xác nhận.', data: appointmentRow });
  } catch (error) {
    await conn.rollback(); sendError(res,error);
  } finally { conn.release(); }
};

// GET /api/patient/appointments
exports.history = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT a.id,a.appointment_code,a.appointment_date,a.start_time,a.end_time,a.status,a.symptoms,
      a.patient_name,a.patient_phone,a.consultation_fee,h.id AS hospital_id,h.name AS hospital_name,h.address AS hospital_address,
      dp.id AS doctor_id,du.full_name AS doctor_name,
      GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') AS doctor_specialty
      FROM appointments a JOIN hospitals h ON h.id=a.hospital_id JOIN doctor_profiles dp ON dp.id=a.doctor_id JOIN users du ON du.id=dp.user_id
      LEFT JOIN doctor_specialties ds ON ds.doctor_id=dp.id LEFT JOIN specialties s ON s.id=ds.specialty_id
      WHERE a.patient_id=? GROUP BY a.id,a.appointment_code,a.appointment_date,a.start_time,a.end_time,a.status,a.symptoms,a.patient_name,a.patient_phone,a.consultation_fee,h.id,h.name,h.address,dp.id,du.full_name
      ORDER BY a.appointment_date DESC,a.start_time DESC`, [req.user.id]);
    res.json({ data: rows });
  } catch (error) { sendError(res,error); }
};

// PATCH /api/patient/appointments/:id/cancel
exports.cancel = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[appointment]] = await conn.query(`SELECT id,status FROM appointments WHERE id=? AND patient_id=? FOR UPDATE`, [req.params.id,req.user.id]);
    if (!appointment || !['PENDING','CONFIRMED'].includes(appointment.status)) {
      await conn.rollback(); return res.status(404).json({ message: 'Không tìm thấy lịch có thể hủy.' });
    }
    await conn.query(`UPDATE appointments SET status='CANCELLED' WHERE id=?`, [appointment.id]);
    await conn.query(`UPDATE appointment_slots SET status='AVAILABLE',appointment_id=NULL WHERE appointment_id=?`, [appointment.id]);
    await conn.query(`INSERT INTO appointment_status_history (appointment_id,old_status,new_status,changed_by,note) VALUES (?,?,'CANCELLED',?,'Bệnh nhân hủy lịch')`, [appointment.id,appointment.status,req.user.id]);
    await conn.commit();
    res.json({ message: 'Đã hủy lịch.' });
  } catch (error) { await conn.rollback(); sendError(res,error); }
  finally { conn.release(); }
};
