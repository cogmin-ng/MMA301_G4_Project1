const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate, requireRole } = require('../auth');

router.use(authenticate, requireRole('DOCTOR'));

async function doctorId(userId) {
  const [rows] = await pool.query('SELECT id FROM doctor_profiles WHERE user_id=?', [userId]);
  return rows[0]?.id;
}

router.get('/profile', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT dp.id,dp.user_id,dp.license_number,dp.experience_years,dp.qualification,dp.biography,dp.status,
      u.full_name,u.email,u.phone,u.avatar FROM doctor_profiles dp JOIN users u ON u.id=dp.user_id WHERE dp.user_id=?`, [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Không tìm thấy hồ sơ bác sĩ.' });
    const id = rows[0].id;
    const [[hospitals], [specialties]] = await Promise.all([
      pool.query(`SELECT dh.hospital_id,h.name AS hospital_name,h.address,dh.room_number,dh.consultation_fee FROM doctor_hospitals dh JOIN hospitals h ON h.id=dh.hospital_id WHERE dh.doctor_id=? ORDER BY h.name`, [id]),
      pool.query('SELECT s.id,s.name FROM doctor_specialties ds JOIN specialties s ON s.id=ds.specialty_id WHERE ds.doctor_id=? ORDER BY s.name', [id]),
    ]);
    res.json({ ...rows[0], hospitals, specialties });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/profile', async (req, res) => {
  const { full_name, phone, avatar, license_number, experience_years, qualification, biography } = req.body;
  if (experience_years !== undefined && (!Number.isInteger(Number(experience_years)) || Number(experience_years) < 0)) return res.status(400).json({ error: 'Số năm kinh nghiệm không hợp lệ.' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('UPDATE users SET full_name=COALESCE(?,full_name),phone=COALESCE(?,phone),avatar=COALESCE(?,avatar) WHERE id=?', [full_name?.trim() || null, phone?.trim() || null, avatar || null, req.user.id]);
    await conn.query(`UPDATE doctor_profiles SET license_number=COALESCE(?,license_number),experience_years=COALESCE(?,experience_years),
      qualification=COALESCE(?,qualification),biography=COALESCE(?,biography) WHERE user_id=?`, [license_number ?? null, experience_years ?? null, qualification?.trim() || null, biography ?? null, req.user.id]);
    await conn.commit();
    const [rows] = await pool.query(`SELECT dp.id,dp.user_id,dp.license_number,dp.experience_years,dp.qualification,dp.biography,dp.status,u.full_name,u.email,u.phone,u.avatar
      FROM doctor_profiles dp JOIN users u ON u.id=dp.user_id WHERE dp.user_id=?`, [req.user.id]);
    res.json(rows[0]);
  } catch (err) { await conn.rollback(); res.status(err.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ error: err.code === 'ER_DUP_ENTRY' ? 'Số điện thoại hoặc chứng chỉ đã được sử dụng.' : err.message }); }
  finally { conn.release(); }
});

router.get('/appointments', async (req, res) => {
  try {
    const id = await doctorId(req.user.id);
    if (!id) return res.status(404).json({ error: 'Không tìm thấy hồ sơ bác sĩ.' });
    const filters = ['a.doctor_id=?']; const params = [id];
    if (req.query.status && req.query.status !== 'ALL') { filters.push('a.status=?'); params.push(req.query.status); }
    if (req.query.date) { filters.push('a.appointment_date=?'); params.push(req.query.date); }
    const [rows] = await pool.query(`SELECT a.*,h.name AS hospital_name,h.address AS hospital_address FROM appointments a JOIN hospitals h ON h.id=a.hospital_id
      WHERE ${filters.join(' AND ')} ORDER BY a.appointment_date DESC,a.start_time DESC`, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/appointments/:id', async (req, res) => {
  const { status, doctor_note } = req.body;
  if (!['CONFIRMED','REJECTED'].includes(status)) return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const id = await doctorId(req.user.id);
    const [rows] = await conn.query('SELECT id,status,patient_id FROM appointments WHERE id=? AND doctor_id=? FOR UPDATE', [req.params.id,id]);
    if (!rows.length) { await conn.rollback(); return res.status(404).json({ error: 'Không tìm thấy lịch hẹn.' }); }
    if (rows[0].status !== 'PENDING') { await conn.rollback(); return res.status(409).json({ error: 'Chỉ có thể xử lý lịch hẹn đang chờ.' }); }
    await conn.query('UPDATE appointments SET status=?,doctor_note=COALESCE(?,doctor_note) WHERE id=?', [status,doctor_note?.trim() || null,rows[0].id]);
    await conn.query('INSERT INTO appointment_status_history (appointment_id,old_status,new_status,changed_by,note) VALUES (?,\'PENDING\',?,?,?)', [rows[0].id,status,req.user.id,doctor_note?.trim() || null]);
    if (status === 'REJECTED') await conn.query("UPDATE appointment_slots SET status='AVAILABLE',appointment_id=NULL WHERE appointment_id=?", [rows[0].id]);
    await conn.query('INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,?)', [rows[0].patient_id,status === 'CONFIRMED' ? 'Lịch hẹn đã được xác nhận' : 'Lịch hẹn bị từ chối',`Bác sĩ đã ${status === 'CONFIRMED' ? 'xác nhận' : 'từ chối'} lịch hẹn của bạn.`,'APPOINTMENT']);
    await conn.commit(); res.json({ status });
  } catch (err) { await conn.rollback(); res.status(500).json({ error: err.message }); }
  finally { conn.release(); }
});

router.get('/schedules', async (req, res) => {
  try {
    const id = await doctorId(req.user.id);
    if (!id) return res.status(404).json({ error: 'Không tìm thấy hồ sơ bác sĩ.' });
    const [[schedules],[timeOffs]] = await Promise.all([
      pool.query('SELECT ds.*,h.name AS hospital_name FROM doctor_schedules ds JOIN hospitals h ON h.id=ds.hospital_id WHERE ds.doctor_id=? ORDER BY ds.day_of_week,ds.start_time',[id]),
      pool.query('SELECT t.*,h.name AS hospital_name FROM doctor_time_offs t JOIN hospitals h ON h.id=t.hospital_id WHERE t.doctor_id=? AND t.end_datetime>=NOW() ORDER BY t.start_datetime',[id]),
    ]);
    res.json({ schedules, timeOffs });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/schedules', async (req, res) => {
  const { hospital_id,day_of_week,start_time,end_time,slot_duration=30 } = req.body;
  if (!hospital_id || !Number.isInteger(Number(day_of_week)) || Number(day_of_week)<1 || Number(day_of_week)>7 || !start_time || !end_time || start_time>=end_time || !Number.isInteger(Number(slot_duration)) || Number(slot_duration)<1) return res.status(400).json({ error: 'Thông tin khung giờ không hợp lệ.' });
  try {
    const id = await doctorId(req.user.id);
    const [result] = await pool.query('INSERT INTO doctor_schedules (doctor_id,hospital_id,day_of_week,start_time,end_time,slot_duration) VALUES (?,?,?,?,?,?)',[id,hospital_id,day_of_week,start_time,end_time,slot_duration]);
    const [rows] = await pool.query('SELECT ds.*,h.name AS hospital_name FROM doctor_schedules ds JOIN hospitals h ON h.id=ds.hospital_id WHERE ds.id=?',[result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(err.code === 'ER_SIGNAL_EXCEPTION' ? 409 : 500).json({ error: err.sqlMessage || err.message }); }
});

router.delete('/schedules/:id', async (req, res) => {
  try {
    const id = await doctorId(req.user.id);
    const [result] = await pool.query('DELETE FROM doctor_schedules WHERE id=? AND doctor_id=?',[req.params.id,id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Không tìm thấy khung giờ.' });
    res.json({ message: 'Đã xóa khung giờ.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/time-offs', async (req, res) => {
  const { hospital_id,start_datetime,end_datetime,reason } = req.body;
  if (!hospital_id || !start_datetime || !end_datetime || Number.isNaN(Date.parse(start_datetime)) || Number.isNaN(Date.parse(end_datetime)) || Date.parse(start_datetime)>=Date.parse(end_datetime)) return res.status(400).json({ error: 'Khoảng thời gian bận không hợp lệ.' });
  try {
    const id = await doctorId(req.user.id);
    const [result] = await pool.query('INSERT INTO doctor_time_offs (doctor_id,hospital_id,start_datetime,end_datetime,reason) VALUES (?,?,?,?,?)',[id,hospital_id,start_datetime,end_datetime,reason?.trim() || null]);
    const [rows] = await pool.query('SELECT t.*,h.name AS hospital_name FROM doctor_time_offs t JOIN hospitals h ON h.id=t.hospital_id WHERE t.id=?',[result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(err.code === 'ER_SIGNAL_EXCEPTION' ? 409 : 500).json({ error: err.sqlMessage || err.message }); }
});

router.delete('/time-offs/:id', async (req, res) => {
  try {
    const id = await doctorId(req.user.id);
    const [result] = await pool.query('DELETE FROM doctor_time_offs WHERE id=? AND doctor_id=?',[req.params.id,id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Không tìm thấy thời gian bận.' });
    res.json({ message: 'Đã xóa thời gian bận.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
