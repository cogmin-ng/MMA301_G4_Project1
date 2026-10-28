import { API_BASE_URL } from './api-config';

const readResponse = async (response, defaultMessage) => {
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(defaultMessage);
  }

  if (!response.ok) {
    throw new Error(data?.error || defaultMessage);
  }

  return data;
};

// Initial realistic fallback appointments matching MySQL seed
const INITIAL_APPOINTMENTS = [
  {
    id: 1,
    appointment_code: 'MED-20261016-001',
    patient_id: 3,
    doctor_id: 1,
    hospital_id: 1,
    appointment_date: '2026-10-28',
    start_time: '08:30',
    end_time: '09:00',
    patient_name: 'Trần Công Minh',
    patient_phone: '0987654321',
    patient_dob: '2000-05-15',
    patient_gender: 'MALE',
    symptoms: 'Thường xuyên tức ngực trái khi vận động nhẹ, khó thở về đêm.',
    doctor_note: 'Yêu cầu đo điện tâm đồ và siêu âm Doppler tim.',
    consultation_fee: 250000,
    status: 'CONFIRMED',
    cancellation_reason: null,
    created_at: '2026-10-26 09:15:00',
    updated_at: '2026-10-26 10:00:00',
    doctor_name: 'BS. CKII Lê Hoàng Giang',
    doctor_avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300',
    doctor_qualification: 'Bác sĩ Chuyên khoa II',
    hospital_name: 'Bệnh viện Đại học Y Dược TP.HCM',
    hospital_address: '215 Hồng Bàng, Phường 11, Quận 5',
    room_number: 'P.102',
    doctor_specialties: ['Nội tổng quát', 'Tim mạch'],
    history: [
      {
        id: 1,
        old_status: null,
        new_status: 'PENDING',
        changer_name: 'Trần Công Minh',
        note: 'Đăng ký lịch hẹn trực tuyến qua ứng dụng',
        created_at: '2026-10-26 09:15:00',
      },
      {
        id: 2,
        old_status: 'PENDING',
        new_status: 'CONFIRMED',
        changer_name: 'Nguyễn Văn Sáng (Admin)',
        note: 'Đã gọi điện xác nhận và kiểm tra thông tin hợp lệ',
        created_at: '2026-10-26 10:00:00',
      },
    ],
  },
  {
    id: 2,
    appointment_code: 'MED-20261016-002',
    patient_id: 4,
    doctor_id: 2,
    hospital_id: 4,
    appointment_date: '2026-10-28',
    start_time: '09:30',
    end_time: '10:00',
    patient_name: 'Phạm Thanh Hải',
    patient_phone: '0977889900',
    patient_dob: '1998-09-20',
    patient_gender: 'MALE',
    symptoms: 'Bé ho nhiều về đêm, sốt nhẹ 38 độ kèm biếng ăn 2 ngày.',
    doctor_note: null,
    consultation_fee: 200000,
    status: 'PENDING',
    cancellation_reason: null,
    created_at: '2026-10-27 14:20:00',
    updated_at: '2026-10-27 14:20:00',
    doctor_name: 'PGS. TS Trần Cao Thái',
    doctor_avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300',
    doctor_qualification: 'BS. CKII, Phó Giáo sư',
    hospital_name: 'Bệnh viện Nhi Đồng 1',
    hospital_address: '341 Sư Vạn Hạnh, Phường 10, Quận 10',
    room_number: 'P.201 Khoa Nhi',
    doctor_specialties: ['Nhi khoa'],
    history: [
      {
        id: 3,
        old_status: null,
        new_status: 'PENDING',
        changer_name: 'Phạm Thanh Hải',
        note: 'Đăng ký khám Nhi khoa',
        created_at: '2026-10-27 14:20:00',
      },
    ],
  },
  {
    id: 3,
    appointment_code: 'MED-20261015-003',
    patient_id: 3,
    doctor_id: 3,
    hospital_id: 2,
    appointment_date: '2026-10-27',
    start_time: '14:00',
    end_time: '14:30',
    patient_name: 'Nguyễn Thị Bích Ngọc',
    patient_phone: '0938123456',
    patient_dob: '1995-12-10',
    patient_gender: 'FEMALE',
    symptoms: 'Đau thượng vị âm ỉ, ợ chua sau khi ăn đồ cay nóng.',
    doctor_note: 'Nội soi dạ dày kết luận viêm hang vị nhẹ. Đã kê đơn thuốc 14 ngày.',
    consultation_fee: 180000,
    status: 'COMPLETED',
    cancellation_reason: null,
    created_at: '2026-10-25 11:00:00',
    updated_at: '2026-10-27 14:45:00',
    doctor_name: 'BS Phan Ngọc Thuận',
    doctor_avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300',
    doctor_qualification: 'Bác sĩ Đa khoa',
    hospital_name: 'Bệnh viện Chợ Rẫy',
    hospital_address: '201B Nguyễn Chí Thanh, Phường 12, Quận 5',
    room_number: 'P.104 Nội soi',
    doctor_specialties: ['Nội tổng quát'],
    history: [
      {
        id: 4,
        old_status: null,
        new_status: 'PENDING',
        changer_name: 'Nguyễn Thị Bích Ngọc',
        note: 'Tạo lịch khám tiêu hóa',
        created_at: '2026-10-25 11:00:00',
      },
      {
        id: 5,
        old_status: 'PENDING',
        new_status: 'CONFIRMED',
        changer_name: 'Admin',
        note: 'Đã xác nhận',
        created_at: '2026-10-25 11:30:00',
      },
      {
        id: 6,
        old_status: 'CONFIRMED',
        new_status: 'COMPLETED',
        changer_name: 'BS Phan Ngọc Thuận',
        note: 'Bệnh nhân đã hoàn thành buổi khám và nhận thuốc.',
        created_at: '2026-10-27 14:45:00',
      },
    ],
  },
  {
    id: 4,
    appointment_code: 'MED-20261014-004',
    patient_id: 4,
    doctor_id: 4,
    hospital_id: 1,
    appointment_date: '2026-10-26',
    start_time: '10:00',
    end_time: '10:30',
    patient_name: 'Hoàng Văn Dũng',
    patient_phone: '0903998877',
    patient_dob: '1982-03-24',
    patient_gender: 'MALE',
    symptoms: 'Chóng mặt, huyết áp dao động không ổn định khi đổi tư thế.',
    doctor_note: null,
    consultation_fee: 300000,
    status: 'CANCELLED',
    cancellation_reason: 'Bệnh nhân có việc gia đình đột xuất xin dời lịch tuần sau.',
    created_at: '2026-10-24 08:00:00',
    updated_at: '2026-10-25 16:30:00',
    doctor_name: 'ThS. BS Trần Minh Anh',
    doctor_avatar: 'https://images.unsplash.com/photo-1594824813511-20902f83d957?w=300',
    doctor_qualification: 'Thạc sĩ, BS. CKII',
    hospital_name: 'Bệnh viện Đại học Y Dược TP.HCM',
    hospital_address: '215 Hồng Bàng, Phường 11, Quận 5',
    room_number: 'P.302 Tim Mạch',
    doctor_specialties: ['Tim mạch'],
    history: [
      {
        id: 7,
        old_status: 'PENDING',
        new_status: 'CANCELLED',
        changer_name: 'Nguyễn Văn Sáng (Admin)',
        note: 'Bệnh nhân có việc gia đình đột xuất xin dời lịch tuần sau.',
        created_at: '2026-10-25 16:30:00',
      },
    ],
  },
  {
    id: 5,
    appointment_code: 'MED-20261016-005',
    patient_id: 3,
    doctor_id: 1,
    hospital_id: 1,
    appointment_date: '2026-10-29',
    start_time: '15:00',
    end_time: '15:30',
    patient_name: 'Lê Thu Trang',
    patient_phone: '0918765432',
    patient_dob: '1992-08-18',
    patient_gender: 'FEMALE',
    symptoms: 'Khám sức khỏe tổng quát định kỳ và tư vấn chỉ số mỡ máu.',
    doctor_note: null,
    consultation_fee: 250000,
    status: 'PENDING',
    cancellation_reason: null,
    created_at: '2026-10-27 16:00:00',
    updated_at: '2026-10-27 16:00:00',
    doctor_name: 'BS. CKII Lê Hoàng Giang',
    doctor_avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300',
    doctor_qualification: 'Bác sĩ Chuyên khoa II',
    hospital_name: 'Bệnh viện Đại học Y Dược TP.HCM',
    hospital_address: '215 Hồng Bàng, Phường 11, Quận 5',
    room_number: 'P.102',
    doctor_specialties: ['Nội tổng quát', 'Tim mạch'],
    history: [
      {
        id: 8,
        old_status: null,
        new_status: 'PENDING',
        changer_name: 'Lê Thu Trang',
        note: 'Đăng ký qua YouMed Care',
        created_at: '2026-10-27 16:00:00',
      },
    ],
  },
];

let localAppointments = [...INITIAL_APPOINTMENTS];

class AppointmentService {
  async getAppointments(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.keyword) query.append('keyword', params.keyword);
      if (params.status && params.status !== 'ALL') query.append('status', params.status);
      if (params.hospital_id && params.hospital_id !== 'ALL') {
        query.append('hospital_id', String(params.hospital_id));
      }
      if (params.doctor_id && params.doctor_id !== 'ALL') {
        query.append('doctor_id', String(params.doctor_id));
      }
      if (params.date) query.append('date', params.date);

      const response = await fetch(`${API_BASE_URL}/appointments?${query.toString()}`);
      const data = await readResponse(response, 'Không thể tải danh sách lịch hẹn từ máy chủ.');
      localAppointments = data;
      return data;
    } catch {
      // Local fallback filter
      let result = [...localAppointments];
      if (params.status && params.status !== 'ALL') {
        result = result.filter((a) => a.status === params.status);
      }
      if (params.hospital_id && params.hospital_id !== 'ALL') {
        result = result.filter((a) => String(a.hospital_id) === String(params.hospital_id));
      }
      if (params.doctor_id && params.doctor_id !== 'ALL') {
        result = result.filter((a) => String(a.doctor_id) === String(params.doctor_id));
      }
      if (params.keyword) {
        const kw = params.keyword.toLowerCase();
        result = result.filter(
          (a) =>
            a.appointment_code?.toLowerCase().includes(kw) ||
            a.patient_name?.toLowerCase().includes(kw) ||
            a.patient_phone?.toLowerCase().includes(kw) ||
            a.doctor_name?.toLowerCase().includes(kw) ||
            a.hospital_name?.toLowerCase().includes(kw)
        );
      }
      return result;
    }
  }

  async getAppointmentStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/stats`);
      return await readResponse(response, 'Không thể tải thống kê lịch hẹn.');
    } catch {
      const total = localAppointments.length;
      const pending = localAppointments.filter((a) => a.status === 'PENDING').length;
      const confirmed = localAppointments.filter((a) => a.status === 'CONFIRMED').length;
      const completed = localAppointments.filter((a) => a.status === 'COMPLETED').length;
      const cancelled = localAppointments.filter((a) => a.status === 'CANCELLED').length;
      const rejected = localAppointments.filter((a) => a.status === 'REJECTED').length;
      const no_show = localAppointments.filter((a) => a.status === 'NO_SHOW').length;
      return { total, pending, confirmed, completed, cancelled, rejected, no_show, today: 2 };
    }
  }

  async getAppointmentById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${encodeURIComponent(id)}`);
      return await readResponse(response, 'Không thể tải thông tin lịch hẹn từ máy chủ.');
    } catch {
      const app = localAppointments.find((a) => String(a.id) === String(id));
      if (!app) throw new Error('Không tìm thấy lịch hẹn.');
      return app;
    }
  }

  async confirmAppointment(id, note = '', adminId = 1) {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${id}/confirm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, admin_id: adminId }),
      });
      const result = await readResponse(response, 'Lỗi xác nhận lịch hẹn.');
      return result.appointment;
    } catch {
      const index = localAppointments.findIndex((a) => String(a.id) === String(id));
      if (index !== -1) {
        const historyEntry = {
          id: Date.now(),
          old_status: localAppointments[index].status,
          new_status: 'CONFIRMED',
          changer_name: 'Quản trị viên (Admin)',
          note: note || 'Quản trị viên đã xác nhận lịch hẹn.',
          created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
        };
        const updated = {
          ...localAppointments[index],
          status: 'CONFIRMED',
          history: [...(localAppointments[index].history || []), historyEntry],
        };
        localAppointments[index] = updated;
        return updated;
      }
      throw new Error('Không tìm thấy lịch hẹn cần xác nhận.');
    }
  }

  async cancelAppointment(id, reason, statusType = 'CANCELLED', adminId = 1, note = '') {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          statusType,
          admin_id: adminId,
          note: note || reason,
        }),
      });
      const result = await readResponse(response, 'Lỗi hủy lịch hẹn.');
      return result.appointment;
    } catch {
      const index = localAppointments.findIndex((a) => String(a.id) === String(id));
      if (index !== -1) {
        const historyEntry = {
          id: Date.now(),
          old_status: localAppointments[index].status,
          new_status: statusType,
          changer_name: 'Quản trị viên (Admin)',
          note: reason,
          created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
        };
        const updated = {
          ...localAppointments[index],
          status: statusType,
          cancellation_reason: reason,
          history: [...(localAppointments[index].history || []), historyEntry],
        };
        localAppointments[index] = updated;
        return updated;
      }
      throw new Error('Không tìm thấy lịch hẹn cần hủy.');
    }
  }

  async updateAppointmentStatus(id, status, note = '', adminId = 1) {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note, admin_id: adminId }),
      });
      const result = await readResponse(response, 'Lỗi cập nhật trạng thái lịch hẹn.');
      return result.appointment;
    } catch {
      const index = localAppointments.findIndex((a) => String(a.id) === String(id));
      if (index !== -1) {
        const historyEntry = {
          id: Date.now(),
          old_status: localAppointments[index].status,
          new_status: status,
          changer_name: 'Quản trị viên (Admin)',
          note: note || `Đổi trạng thái sang ${status}`,
          created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
        };
        const updated = {
          ...localAppointments[index],
          status,
          history: [...(localAppointments[index].history || []), historyEntry],
        };
        localAppointments[index] = updated;
        return updated;
      }
      throw new Error('Không tìm thấy lịch hẹn.');
    }
  }

  async createAppointment(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await readResponse(response, 'Lỗi đặt lịch hẹn.');
      return result.appointment;
    } catch {
      const newId = localAppointments.length > 0 ? Math.max(...localAppointments.map((a) => a.id)) + 1 : 1;
      const code = `MED-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
      const newApp = {
        id: newId,
        appointment_code: code,
        patient_id: data.patient_id || 3,
        doctor_id: data.doctor_id,
        hospital_id: data.hospital_id,
        appointment_date: data.appointment_date,
        start_time: data.start_time,
        end_time: data.end_time,
        patient_name: data.patient_name,
        patient_phone: data.patient_phone,
        patient_dob: data.patient_dob || '1995-01-01',
        patient_gender: data.patient_gender || 'MALE',
        symptoms: data.symptoms || '',
        doctor_note: null,
        consultation_fee: Number(data.consultation_fee) || 250000,
        status: 'PENDING',
        cancellation_reason: null,
        created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
        updated_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
        doctor_name: data.doctor_name || 'Bác sĩ chuyên khoa',
        doctor_avatar: data.doctor_avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300',
        doctor_qualification: 'BS. CKII',
        hospital_name: data.hospital_name || 'Bệnh viện Đa khoa Quốc tế',
        hospital_address: data.hospital_address || 'TP. Hồ Chí Minh',
        room_number: data.room_number || 'P.101',
        doctor_specialties: data.doctor_specialties || ['Nội tổng quát'],
        history: [
          {
            id: Date.now(),
            old_status: null,
            new_status: 'PENDING',
            changer_name: data.patient_name,
            note: 'Đăng ký lịch khám mới',
            created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
          },
        ],
      };
      localAppointments = [newApp, ...localAppointments];
      return newApp;
    }
  }

  async deleteAppointment(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
        method: 'DELETE',
      });
      return await readResponse(response, 'Lỗi xóa lịch hẹn.');
    } catch {
      localAppointments = localAppointments.filter((a) => String(a.id) !== String(id));
      return { message: 'Đã xóa lịch hẹn thành công.' };
    }
  }
}

export const appointmentService = new AppointmentService();
