const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/admin/dashboard (Lấy toàn bộ số liệu KPI & thống kê từ CSDL MySQL)
router.get('/stats', async (req, res) => {
  try {
    // 1. Thống kê bệnh viện
    const [hospStats] = await pool.query(`
      SELECT 
        COUNT(*) AS totalHospitals,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS activeHospitals,
        SUM(CASE WHEN status = 'INACTIVE' THEN 1 ELSE 0 END) AS inactiveHospitals
      FROM hospitals
    `);

    // 2. Thống kê bác sĩ
    const [docStats] = await pool.query(`
      SELECT COUNT(*) AS totalDoctors FROM doctor_profiles WHERE status = 'ACTIVE'
    `);

    // 3. Thống kê bệnh nhân
    const [patStats] = await pool.query(`
      SELECT COUNT(*) AS totalPatients FROM users WHERE role = 'PATIENT'
    `);

    // 4. Thống kê lịch hẹn & doanh thu
    const [appStats] = await pool.query(`
      SELECT 
        COUNT(*) AS totalAppointments,
        COALESCE(SUM(consultation_fee), 0) AS totalRevenue
      FROM appointments
    `);

    // 5. Thống kê số lượng theo từng trạng thái
    const [statusRows] = await pool.query(`
      SELECT status, COUNT(*) AS count 
      FROM appointments 
      GROUP BY status
    `);

    const statusCounts = {
      PENDING: 0,
      CONFIRMED: 0,
      REJECTED: 0,
      CANCELLED: 0,
      COMPLETED: 0,
      NO_SHOW: 0,
    };

    statusRows.forEach((r) => {
      if (statusCounts[r.status] !== undefined) {
        statusCounts[r.status] = Number(r.count);
      }
    });

    // 6. Bệnh viện mới cập nhật gần đây
    const [recentHospitals] = await pool.query(`
      SELECT id, name, address, province, phone, status, image_url 
      FROM hospitals 
      ORDER BY id DESC 
      LIMIT 4
    `);

    return res.json({
      totalHospitals: Number(hospStats[0].totalHospitals) || 0,
      activeHospitals: Number(hospStats[0].activeHospitals) || 0,
      inactiveHospitals: Number(hospStats[0].inactiveHospitals) || 0,
      totalDoctors: Number(docStats[0].totalDoctors) || 0,
      totalPatients: Number(patStats[0].totalPatients) || 0,
      totalAppointments: Number(appStats[0].totalAppointments) || 0,
      totalRevenue: Number(appStats[0].totalRevenue) || 0,
      statusCounts,
      recentHospitals,
    });
  } catch (err) {
    console.error('Lỗi tính toán Dashboard stats:', err);
    return res.status(500).json({ error: 'Lỗi truy vấn số liệu thống kê Dashboard từ MySQL.' });
  }
});

module.exports = router;
