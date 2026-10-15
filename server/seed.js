const pool = require('./db');

async function seed() {
  console.log('🔄 Checking MySQL tables in medical_booking...');
  const conn = await pool.getConnection();
  try {
    // 1. Kiểm tra users
    const [users] = await conn.query('SELECT COUNT(*) as count FROM users');
    if (users[0].count === 0) {
      console.log('🌱 Seeding initial users...');
      await conn.query(`
        INSERT INTO users (id, full_name, email, phone, password, role, is_active, avatar) VALUES
        (1, 'Nguyễn Văn Sáng (Admin)', 'admin@youmed.vn', '0901234567', '123456', 'ADMIN', TRUE, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
        (2, 'BS. CKII Lê Hoàng Giang', 'doctor.giang@youmed.vn', '0912345678', '123456', 'DOCTOR', TRUE, 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150'),
        (3, 'Trần Công Minh (Bệnh nhân)', 'minh.patient@gmail.com', '0987654321', '123456', 'PATIENT', TRUE, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
        (4, 'Phạm Thanh Hải (Bệnh nhân)', 'hai.patient@gmail.com', '0977889900', '123456', 'PATIENT', TRUE, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'),
        (5, 'Nguyễn Anh Tuấn (Admin)', 'tuan.admin@youmed.vn', '0933445566', '123456', 'ADMIN', TRUE, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150');
      `);

      // Tạo patient_profiles tương ứng
      await conn.query(`
        INSERT INTO patient_profiles (user_id, date_of_birth, gender, address) VALUES
        (3, '2000-05-15', 'MALE', 'Quận 1, TP.HCM'),
        (4, '1998-09-20', 'MALE', 'Quận 7, TP.HCM');
      `);

      // Tạo doctor_profiles tương ứng
      await conn.query(`
        INSERT INTO doctor_profiles (id, user_id, license_number, experience_years, qualification, biography, status) VALUES
        (1, 2, 'CCHN-00123-BYT', 12, 'Bác sĩ Chuyên khoa II', 'Hơn 12 năm kinh nghiệm chẩn đoán và điều trị nội tổng quát.', 'ACTIVE');
      `);
      console.log('✅ Users & Profiles seeded successfully.');
    } else {
      console.log(`ℹ️ Users table already has ${users[0].count} records.`);
    }

    // 2. Kiểm tra hospitals
    const [hospitals] = await conn.query('SELECT COUNT(*) as count FROM hospitals');
    if (hospitals[0].count === 0) {
      console.log('🌱 Seeding initial hospitals...');
      await conn.query(`
        INSERT INTO hospitals (id, name, address, province, district, phone, email, description, image_url, status) VALUES
        (1, 'Bệnh viện Đại học Y Dược TP.HCM', '215 Hồng Bàng, Phường 11, Quận 5', 'Hồ Chí Minh', 'Quận 5', '028 3855 4269', 'dhyduoc@umc.edu.vn', 'Bệnh viện tuyến trung ương đa khoa kiểu mẫu, kết hợp đào tạo y khoa và nghiên cứu lâm sàng hiện đại.', 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600', 'ACTIVE'),
        (2, 'Bệnh viện Chợ Rẫy', '201B Nguyễn Chí Thanh, Phường 12, Quận 5', 'Hồ Chí Minh', 'Quận 5', '028 3855 4137', 'bvchoray@choray.vn', 'Bệnh viện đa khoa hạng đặc biệt lớn nhất khu vực phía Nam với đội ngũ chuyên gia đầu ngành.', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600', 'ACTIVE'),
        (3, 'Bệnh viện Bạch Mai', '78 Đường Giải Phóng, Phương Mai, Đống Đa', 'Hà Nội', 'Đống Đa', '024 3869 3731', 'benhvienbachmai@bmh.vn', 'Bệnh viện đa khoa hoàn chỉnh hạng đặc biệt đầu tiên tại Việt Nam.', 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600', 'ACTIVE'),
        (4, 'Bệnh viện Nhi Đồng 1', '341 Sư Vạn Hạnh, Phường 10, Quận 10', 'Hồ Chí Minh', 'Quận 10', '028 3927 1119', 'nhidong1@nhidong.org.vn', 'Bệnh viện chuyên khoa Nhi hàng đầu miền Nam chuyên tiếp nhận cấp cứu và điều trị chuyên sâu.', 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600', 'ACTIVE'),
        (5, 'Bệnh viện Hùng Vương (Phụ sản)', '128 Hồng Bàng, Phường 12, Quận 5', 'Hồ Chí Minh', 'Quận 5', '028 3955 2228', 'bv-hungvuong@med.vn', 'Bệnh viện chuyên khoa Phụ sản hạng I với trang thiết bị theo dõi thai kỳ chất lượng cao.', 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600', 'INACTIVE'),
        (6, 'Bệnh viện Đa khoa Quốc tế Vinmec', '208 Nguyễn Hữu Cảnh, Phường 22, Bình Thạnh', 'Hồ Chí Minh', 'Bình Thạnh', '028 3622 1166', 'info@vinmec.com', 'Bệnh viện đạt chuẩn quốc tế JCI với dịch vụ y tế 5 sao và công nghệ chẩn đoán tiên tiến.', 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600', 'ACTIVE');
      `);

      // Liên kết bác sĩ vào viện
      await conn.query(`
        INSERT INTO doctor_hospitals (doctor_id, hospital_id, room_number, consultation_fee) VALUES
        (1, 1, 'P.102', 250000.00),
        (1, 2, 'P.305', 300000.00);
      `);

      // Thêm appointments mẫu
      await conn.query(`
        INSERT INTO appointments (id, appointment_code, patient_id, doctor_id, hospital_id, appointment_date, start_time, end_time, patient_name, patient_phone, consultation_fee, status) VALUES
        (1, 'MED-20261015-001', 3, 1, 1, '2026-10-16', '08:30:00', '09:00:00', 'Trần Công Minh', '0987654321', 250000.00, 'CONFIRMED'),
        (2, 'MED-20261015-002', 4, 1, 1, '2026-10-16', '09:00:00', '09:30:00', 'Phạm Thanh Hải', '0977889900', 250000.00, 'PENDING'),
        (3, 'MED-20261014-003', 3, 1, 2, '2026-10-14', '14:00:00', '14:30:00', 'Trần Công Minh', '0987654321', 300000.00, 'COMPLETED'),
        (4, 'MED-20261013-004', 4, 1, 1, '2026-10-13', '10:00:00', '10:30:00', 'Phạm Thanh Hải', '0977889900', 250000.00, 'CANCELLED');
      `);
      console.log('✅ Hospitals & Appointments seeded successfully.');
    } else {
      console.log(`ℹ️ Hospitals table already has ${hospitals[0].count} records.`);
    }

    console.log('🎉 Seeding completed successfully!');
  } catch (err) {
    console.error('❌ Error during seeding:', err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed();
