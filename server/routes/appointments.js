const express = require('express');
const router = express.Router();
const pool = require('../db');

const getAppointmentSelect = () => `
  SELECT 
    a.id,
    a.appointment_code,
    a.patient_id,
    a.doctor_id,
    a.hospital_id,
    DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS appointment_date,
    DATE_FORMAT(a.start_time, '%H:%i') AS start_time,
    DATE_FORMAT(a.end_time, '%H:%i') AS end_time,
    a.patient_name,
    a.patient_phone,
    DATE_FORMAT(a.patient_dob, '%Y-%m-%d') AS patient_dob,
    a.patient_gender,
    a.symptoms,
    a.doctor_note,
    a.consultation_fee,
    a.status,
    a.cancellation_reason,
    a.created_at,
    a.updated_at,
    du.full_name AS doctor_name,
    du.avatar AS doctor_avatar,
    dp.qualification AS doctor_qualification,
    h.name AS hospital_name,
    h.address AS hospital_address,
    dh.room_number,
    (
      SELECT GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ')
      FROM doctor_specialties ds
      JOIN specialties s ON s.id = ds.specialty_id
      WHERE ds.doctor_id = dp.id
    ) AS doctor_specialties
  FROM appointments a
  JOIN doctor_profiles dp ON dp.id = a.doctor_id
  JOIN users du ON du.id = dp.user_id
  JOIN hospitals h ON h.id = a.hospital_id
  LEFT JOIN doctor_hospitals dh 
    ON dh.doctor_id = a.doctor_id AND dh.hospital_id = a.hospital_id
`;

const toAppointment = (row) => ({
  id: row.id,
  appointment_code: row.appointment_code,
  patient_id: row.patient_id,
  doctor_id: row.doctor_id,
  hospital_id: row.hospital_id,
  appointment_date: row.appointment_date,
  start_time: row.start_time,
  end_time: row.end_time,
  patient_name: row.patient_name,
  patient_phone: row.patient_phone,
  patient_dob: row.patient_dob,
  patient_gender: row.patient_gender,
  symptoms: row.symptoms,
  doctor_note: row.doctor_note,
  consultation_fee: row.consultation_fee === null ? 0 : Number(row.consultation_fee),
  status: row.status,
  cancellation_reason: row.cancellation_reason,
  created_at: row.created_at,
  updated_at: row.updated_at,
  doctor_name: row.doctor_name,
  doctor_avatar: row.doctor_avatar,
  doctor_qualification: row.doctor_qualification,
  hospital_name: row.hospital_name,
  hospital_address: row.hospital_address,
  room_number: row.room_number,
  doctor_specialties: row.doctor_specialties
    ? row.doctor_specialties.split(', ').filter(Boolean)
    : [],
});

// GET /api/appointments/stats (Thống kê số lượng theo trạng thái)
router.get('/stats', async (req, res) => {
  try {
    const [counts] = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN status = 'NO_SHOW' THEN 1 ELSE 0 END) AS no_show,
        SUM(CASE WHEN appointment_date = CURDATE() THEN 1 ELSE 0 END) AS today
      FROM appointments
    `);

    const result = counts[0] || {};
    return res.json({
      total: Number(result.total) || 0,
      pending: Number(result.pending) || 0,
      confirmed: Number(result.confirmed) || 0,
      completed: Number(result.completed) || 0,
      cancelled: Number(result.cancelled) || 0,
      rejected: Number(result.rejected) || 0,
      no_show: Number(result.no_show) || 0,
      today: Number(result.today) || 0,
    });
  } catch (err) {
    console.error('Lỗi tính thống kê lịch hẹn:', err);
    return res.status(500).json({ error: 'Lỗi truy vấn thống kê lịch hẹn từ MySQL.' });
  }
});

// GET /api/appointments (Danh sách lịch hẹn - Admin List)
router.get('/', async (req, res) => {
  try {
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const hospitalId = typeof req.query.hospital_id === 'string' ? req.query.hospital_id.trim() : '';
    const doctorId = typeof req.query.doctor_id === 'string' ? req.query.doctor_id.trim() : '';
    const dateFilter = typeof req.query.date === 'string' ? req.query.date.trim() : '';

    const conditions = ['1 = 1'];
    const params = [];

    if (status && status !== 'ALL') {
      conditions.push('a.status = ?');
      params.push(status);
    }

    if (hospitalId && hospitalId !== 'ALL') {
      conditions.push('a.hospital_id = ?');
      params.push(hospitalId);
    }

    if (doctorId && doctorId !== 'ALL') {
      conditions.push('a.doctor_id = ?');
      params.push(doctorId);
    }

    if (keyword) {
      conditions.push(`(
        a.appointment_code LIKE ?
        OR a.patient_name LIKE ?
        OR a.patient_phone LIKE ?
        OR du.full_name LIKE ?
        OR h.name LIKE ?
      )`);
      const pattern = `%${keyword}%`;
      params.push(pattern, pattern, pattern, pattern, pattern);
    }

    if (dateFilter === 'today') {
      conditions.push('a.appointment_date = CURDATE()');
    } else if (dateFilter === 'upcoming') {
      conditions.push('a.appointment_date >= CURDATE()');
    } else if (dateFilter && dateFilter !== 'all') {
      conditions.push('a.appointment_date = ?');
      params.push(dateFilter);
    }

    const [rows] = await pool.query(
      `${getAppointmentSelect()}
       WHERE ${conditions.join(' AND ')}
       ORDER BY a.appointment_date DESC, a.start_time DESC, a.id DESC`,
      params
    );

    return res.json(rows.map(toAppointment));
  } catch (err) {
    console.error('Lỗi lấy danh sách lịch hẹn:', err);
    return res.status(500).json({ error: 'Lỗi truy vấn lịch hẹn từ MySQL.' });
  }
});

// GET /api/appointments/:id (Chi tiết lịch hẹn & lịch sử trạng thái)
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `${getAppointmentSelect()} WHERE a.id = ? LIMIT 1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy lịch hẹn trên hệ thống.' });
    }

    const appointment = toAppointment(rows[0]);

    // Lấy lịch sử chuyển trạng thái
    const [historyRows] = await pool.query(
      `SELECT 
         ash.id,
         ash.old_status,
         ash.new_status,
         ash.changed_by,
         ash.note,
         ash.created_at,
         u.full_name AS changer_name,
         u.role AS changer_role
       FROM appointment_status_history ash
       LEFT JOIN users u ON u.id = ash.changed_by
       WHERE ash.appointment_id = ?
       ORDER BY ash.created_at ASC`,
      [req.params.id]
    );

    appointment.history = historyRows;
    return res.json(appointment);
  } catch (err) {
    console.error('Lỗi lấy chi tiết lịch hẹn:', err);
    return res.status(500).json({ error: 'Lỗi truy vấn chi tiết lịch hẹn từ MySQL.' });
  }
});

// PATCH /api/appointments/:id/confirm (Admin Xác nhận lịch hẹn)
router.patch('/:id/confirm', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const appointmentId = req.params.id;
    const changedBy = req.body.admin_id || 1; // Default to admin ID 1
    const note = req.body.note || 'Quản trị viên đã xác nhận lịch hẹn.';

    const [rows] = await conn.query('SELECT * FROM appointments WHERE id = ?', [appointmentId]);
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Không tìm thấy lịch hẹn.' });
    }

    const currentAppointment = rows[0];
    const oldStatus = currentAppointment.status;

    // Cập nhật trạng thái
    await conn.query(
      `UPDATE appointments 
       SET status = 'CONFIRMED', updated_at = NOW() 
       WHERE id = ?`,
      [appointmentId]
    );

    // Ghi nhật ký thay đổi trạng thái
    await conn.query(
      `INSERT INTO appointment_status_history (appointment_id, old_status, new_status, changed_by, note)
       VALUES (?, ?, 'CONFIRMED', ?, ?)`,
      [appointmentId, oldStatus, changedBy, note]
    );

    // Gửi thông báo đến người bệnh
    if (currentAppointment.patient_id) {
      await conn.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, 'Lịch hẹn đã được xác nhận', ?, 'APPOINTMENT')`,
        [
          currentAppointment.patient_id,
          `Lịch hẹn mã ${currentAppointment.appointment_code} khám ngày ${currentAppointment.appointment_date} đã được duyệt thành công. Vui lòng đến đúng giờ.`,
        ]
      );
    }

    await conn.commit();

    const [updatedRows] = await pool.query(
      `${getAppointmentSelect()} WHERE a.id = ? LIMIT 1`,
      [appointmentId]
    );

    return res.json({
      message: 'Đã xác nhận lịch hẹn khám thành công.',
      appointment: toAppointment(updatedRows[0]),
    });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi xác nhận lịch hẹn:', err);
    return res.status(500).json({ error: 'Không thể xác nhận lịch hẹn: ' + err.message });
  } finally {
    conn.release();
  }
});

// PATCH /api/appointments/:id/cancel (Admin Hủy / Từ chối lịch hẹn)
router.patch('/:id/cancel', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const appointmentId = req.params.id;
    const reason = req.body.reason ? req.body.reason.trim() : 'Quản trị viên đã hủy lịch hẹn.';
    const statusType = req.body.statusType === 'REJECTED' ? 'REJECTED' : 'CANCELLED';
    const changedBy = req.body.admin_id || 1;
    const note = req.body.note || reason;

    const [rows] = await conn.query('SELECT * FROM appointments WHERE id = ?', [appointmentId]);
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Không tìm thấy lịch hẹn.' });
    }

    const currentAppointment = rows[0];
    const oldStatus = currentAppointment.status;

    // Cập nhật trạng thái và lý do hủy
    await conn.query(
      `UPDATE appointments 
       SET status = ?, cancellation_reason = ?, updated_at = NOW() 
       WHERE id = ?`,
      [statusType, reason, appointmentId]
    );

    // Ghi nhật ký thay đổi trạng thái
    await conn.query(
      `INSERT INTO appointment_status_history (appointment_id, old_status, new_status, changed_by, note)
       VALUES (?, ?, ?, ?, ?)`,
      [appointmentId, oldStatus, statusType, changedBy, note]
    );

    // Gửi thông báo đến người bệnh
    if (currentAppointment.patient_id) {
      await conn.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, ?, ?, 'APPOINTMENT')`,
        [
          currentAppointment.patient_id,
          statusType === 'REJECTED' ? 'Lịch hẹn bị từ chối' : 'Lịch hẹn đã bị hủy',
          `Lịch hẹn mã ${currentAppointment.appointment_code} đã chuyển sang trạng thái ${statusType}. Lý do: ${reason}`,
        ]
      );
    }

    await conn.commit();

    const [updatedRows] = await pool.query(
      `${getAppointmentSelect()} WHERE a.id = ? LIMIT 1`,
      [appointmentId]
    );

    return res.json({
      message: `Đã ${statusType === 'REJECTED' ? 'từ chối' : 'hủy'} lịch hẹn thành công.`,
      appointment: toAppointment(updatedRows[0]),
    });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi hủy lịch hẹn:', err);
    return res.status(500).json({ error: 'Không thể hủy lịch hẹn: ' + err.message });
  } finally {
    conn.release();
  }
});

// PATCH /api/appointments/:id/status (Cập nhật trạng thái tổng quát: COMPLETED, NO_SHOW, v.v.)
router.patch('/:id/status', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const appointmentId = req.params.id;
    const { status, note, admin_id } = req.body;

    const allowedStatuses = ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'];
    if (!allowedStatuses.includes(status)) {
      await conn.rollback();
      return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
    }

    const [rows] = await conn.query('SELECT status FROM appointments WHERE id = ?', [appointmentId]);
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Không tìm thấy lịch hẹn.' });
    }

    const oldStatus = rows[0].status;

    await conn.query(
      `UPDATE appointments SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, appointmentId]
    );

    await conn.query(
      `INSERT INTO appointment_status_history (appointment_id, old_status, new_status, changed_by, note)
       VALUES (?, ?, ?, ?, ?)`,
      [appointmentId, oldStatus, status, admin_id || 1, note || `Cập nhật trạng thái sang ${status}`]
    );

    await conn.commit();

    const [updatedRows] = await pool.query(
      `${getAppointmentSelect()} WHERE a.id = ? LIMIT 1`,
      [appointmentId]
    );

    return res.json({
      message: `Đã cập nhật trạng thái lịch hẹn sang ${status}`,
      appointment: toAppointment(updatedRows[0]),
    });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi đổi trạng thái lịch hẹn:', err);
    return res.status(500).json({ error: 'Lỗi cập nhật trạng thái lịch hẹn: ' + err.message });
  } finally {
    conn.release();
  }
});

// POST /api/appointments (Tạo mới lịch hẹn)
router.post('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      patient_id,
      doctor_id,
      hospital_id,
      appointment_date,
      start_time,
      end_time,
      patient_name,
      patient_phone,
      patient_dob,
      patient_gender,
      symptoms,
      consultation_fee,
    } = req.body;

    if (!doctor_id || !hospital_id || !appointment_date || !start_time || !end_time) {
      await conn.rollback();
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin bác sĩ, bệnh viện và thời gian khám.' });
    }

    if (!patient_name || !patient_phone) {
      await conn.rollback();
      return res.status(400).json({ error: 'Vui lòng cung cấp tên và số điện thoại người bệnh.' });
    }

    // Sinh mã lịch hẹn duy nhất
    const dateStr = appointment_date.replace(/-/g, '');
    const randNum = Math.floor(100 + Math.random() * 900);
    const appointment_code = `MED-${dateStr}-${randNum}`;

    const [result] = await conn.query(
      `INSERT INTO appointments (
        appointment_code, patient_id, doctor_id, hospital_id,
        appointment_date, start_time, end_time,
        patient_name, patient_phone, patient_dob, patient_gender,
        symptoms, consultation_fee, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [
        appointment_code,
        patient_id || 3, // Default to demo patient if none provided
        doctor_id,
        hospital_id,
        appointment_date,
        start_time,
        end_time,
        patient_name.trim(),
        patient_phone.trim(),
        patient_dob || null,
        patient_gender || 'MALE',
        symptoms || null,
        consultation_fee ? Number(consultation_fee) : 250000,
      ]
    );

    const appointmentId = result.insertId;

    // Ghi nhận trạng thái khởi tạo
    await conn.query(
      `INSERT INTO appointment_status_history (appointment_id, old_status, new_status, changed_by, note)
       VALUES (?, NULL, 'PENDING', ?, 'Đăng ký lịch hẹn mới')`,
      [appointmentId, patient_id || 1]
    );

    await conn.commit();

    const [createdRows] = await pool.query(
      `${getAppointmentSelect()} WHERE a.id = ? LIMIT 1`,
      [appointmentId]
    );

    return res.status(201).json({
      message: 'Đặt lịch hẹn khám thành công.',
      appointment: toAppointment(createdRows[0]),
    });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi tạo lịch hẹn:', err);
    return res.status(500).json({ error: 'Không thể tạo lịch hẹn: ' + err.message });
  } finally {
    conn.release();
  }
});

// DELETE /api/appointments/:id (Xóa lịch hẹn)
router.delete('/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const appointmentId = req.params.id;

    await conn.query('DELETE FROM appointment_status_history WHERE appointment_id = ?', [appointmentId]);
    await conn.query('UPDATE appointment_slots SET appointment_id = NULL WHERE appointment_id = ?', [appointmentId]);
    const [result] = await conn.query('DELETE FROM appointments WHERE id = ?', [appointmentId]);

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Không tìm thấy lịch hẹn để xóa.' });
    }

    await conn.commit();
    return res.json({ message: 'Đã xóa lịch hẹn thành công.' });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi xóa lịch hẹn:', err);
    return res.status(500).json({ error: 'Không thể xóa lịch hẹn: ' + err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
