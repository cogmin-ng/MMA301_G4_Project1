require('dotenv').config();
const pool = require('./db');

async function seedDoctors() {
  const conn = await pool.getConnection();
  try {
    const [u] = await conn.query('SELECT * FROM users WHERE email = ?', ['thai.tran@youmed.vn']);
    if (u.length === 0) {
      console.log('Seeding doctors and specialties...');
      await conn.query(`
        INSERT INTO users (full_name, email, phone, password, role, is_active, avatar) VALUES
        ('Trần Cao Thái', 'thai.tran@youmed.vn', '0912334455', '123456', 'DOCTOR', TRUE, 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300'),
        ('Phan Ngọc Thuận', 'thuan.phan@youmed.vn', '0912445566', '123456', 'DOCTOR', TRUE, 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300'),
        ('Trần Minh Anh', 'minhanh.tran@youmed.vn', '0912556677', '123456', 'DOCTOR', TRUE, 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300'),
        ('Nguyễn Hoàng Lan', 'hoanglan.nguyen@youmed.vn', '0912667788', '123456', 'DOCTOR', TRUE, 'https://images.unsplash.com/photo-1594824813511-20902f83d957?w=300')
      `);

      const [users] = await conn.query('SELECT id, full_name FROM users WHERE role = "DOCTOR"');
      for (const d of users) {
        if (d.full_name.includes('Thái')) {
          await conn.query('INSERT INTO doctor_profiles (user_id, license_number, experience_years, qualification, biography, status) VALUES (?, ?, ?, ?, ?, ?)', [d.id, 'CCHN-THAI-01', 16, 'BS. CKII', '16 năm kinh nghiệm chuyên khoa Nhi, tận tâm chăm sóc sức khỏe trẻ em.', 'ACTIVE']);
        } else if (d.full_name.includes('Thuận')) {
          await conn.query('INSERT INTO doctor_profiles (user_id, license_number, experience_years, qualification, biography, status) VALUES (?, ?, ?, ?, ?, ?)', [d.id, 'CCHN-THUAN-02', 1, 'Bác sĩ', 'Bác sĩ trẻ năng động, chuyên khám và điều trị Nội tổng quát.', 'ACTIVE']);
        } else if (d.full_name.includes('Minh Anh')) {
          await conn.query('INSERT INTO doctor_profiles (user_id, license_number, experience_years, qualification, biography, status) VALUES (?, ?, ?, ?, ?, ?)', [d.id, 'CCHN-MANH-03', 15, 'BS. CKII', 'Hơn 15 năm kinh nghiệm chuyên sâu tim mạch can thiệp, đào tạo tại ĐH Y Dược TP.HCM.', 'ACTIVE']);
        } else if (d.full_name.includes('Hoàng Lan')) {
          await conn.query('INSERT INTO doctor_profiles (user_id, license_number, experience_years, qualification, biography, status) VALUES (?, ?, ?, ?, ?, ?)', [d.id, 'CCHN-LAN-04', 10, 'BS. CKII', '10 năm kinh nghiệm nhi khoa lâm sàng và điều trị dinh dưỡng trẻ nhỏ.', 'ACTIVE']);
        }
      }

      await conn.query(`
        INSERT INTO specialties (name, description) VALUES
        ('Nhi khoa', 'Khám, điều trị và chăm sóc sức khỏe toàn diện cho trẻ sơ sinh và trẻ nhỏ'),
        ('Nội tổng quát', 'Khám, phát hiện và tư vấn bệnh lý nội khoa đa hệ cơ quan'),
        ('Tim mạch', 'Chuyên sâu chẩn đoán và can thiệp điều trị bệnh lý mạch vành, huyết áp'),
        ('Da liễu', 'Thăm khám, xét nghiệm và điều trị các vấn đề về da, tóc, móng'),
        ('Tai Mũi Họng', 'Chẩn đoán và phẫu thuật điều trị các bệnh lý vùng tai, mũi, họng')
      `);

      const [docProfiles] = await conn.query('SELECT dp.id, u.full_name FROM doctor_profiles dp JOIN users u ON dp.user_id = u.id');
      const [allSpecs] = await conn.query('SELECT id, name FROM specialties');
      const specMap = {};
      allSpecs.forEach(s => specMap[s.name] = s.id);

      for (const dp of docProfiles) {
        if (dp.full_name.includes('Thái') && specMap['Nhi khoa']) {
          await conn.query('INSERT IGNORE INTO doctor_specialties (doctor_id, specialty_id) VALUES (?, ?)', [dp.id, specMap['Nhi khoa']]);
          await conn.query('INSERT IGNORE INTO doctor_hospitals (doctor_id, hospital_id, room_number, consultation_fee) VALUES (?, 4, "P.201 Khoa Nhi", 200000)', [dp.id]);
        } else if (dp.full_name.includes('Thuận') && specMap['Nội tổng quát']) {
          await conn.query('INSERT IGNORE INTO doctor_specialties (doctor_id, specialty_id) VALUES (?, ?)', [dp.id, specMap['Nội tổng quát']]);
          await conn.query('INSERT IGNORE INTO doctor_hospitals (doctor_id, hospital_id, room_number, consultation_fee) VALUES (?, 2, "P.104 Nội soi", 180000)', [dp.id]);
        } else if (dp.full_name.includes('Minh Anh') && specMap['Tim mạch']) {
          await conn.query('INSERT IGNORE INTO doctor_specialties (doctor_id, specialty_id) VALUES (?, ?)', [dp.id, specMap['Tim mạch']]);
          await conn.query('INSERT IGNORE INTO doctor_hospitals (doctor_id, hospital_id, room_number, consultation_fee) VALUES (?, 1, "P.302 Tim Mạch", 300000)', [dp.id]);
        } else if (dp.full_name.includes('Hoàng Lan') && specMap['Nhi khoa']) {
          await conn.query('INSERT IGNORE INTO doctor_specialties (doctor_id, specialty_id) VALUES (?, ?)', [dp.id, specMap['Nhi khoa']]);
          await conn.query('INSERT IGNORE INTO doctor_hospitals (doctor_id, hospital_id, room_number, consultation_fee) VALUES (?, 4, "P.108 Sơ sinh", 250000)', [dp.id]);
        }
      }
      console.log('✅ Seeded doctors and specialties successfully.');
    } else {
      console.log('Doctors already exist.');
    }
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seedDoctors();
