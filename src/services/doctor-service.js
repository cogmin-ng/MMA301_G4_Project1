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

// Initial fallback doctors if server is offline
const INITIAL_DOCTORS = [
  {
    id: 1,
    user_id: 2,
    full_name: 'BS. CKII Lê Hoàng Giang',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300',
    phone: '0912345678',
    email: 'doctor.giang@youmed.vn',
    is_active: true,
    license_number: 'CCHN-00123-BYT',
    qualification: 'Bác sĩ Chuyên khoa II',
    experience_years: 12,
    biography: 'Hơn 12 năm kinh nghiệm chẩn đoán và điều trị bệnh lý nội tổng quát tại các bệnh viện lớn.',
    status: 'ACTIVE',
    specialty: 'Nội tổng quát, Tim mạch',
    specialties: ['Nội tổng quát', 'Tim mạch'],
    specialty_ids: [1, 2],
    hospital_id: 1,
    hospital_name: 'Bệnh viện Đại học Y Dược TP.HCM',
    hospital_address: '215 Hồng Bàng, Phường 11, Quận 5',
    room_number: 'P.102',
    consultation_fee: 250000,
  },
  {
    id: 2,
    user_id: 6,
    full_name: 'PGS. TS Trần Cao Thái',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300',
    phone: '0912334455',
    email: 'thai.tran@youmed.vn',
    is_active: true,
    license_number: 'CCHN-THAI-01',
    qualification: 'BS. CKII, Phó Giáo sư',
    experience_years: 16,
    biography: '16 năm kinh nghiệm chuyên khoa Nhi, tận tâm chăm sóc và tư vấn dinh dưỡng cho trẻ nhỏ.',
    status: 'ACTIVE',
    specialty: 'Nhi khoa',
    specialties: ['Nhi khoa'],
    specialty_ids: [3],
    hospital_id: 4,
    hospital_name: 'Bệnh viện Nhi Đồng 1',
    hospital_address: '341 Sư Vạn Hạnh, Phường 10, Quận 10',
    room_number: 'P.201 Khoa Nhi',
    consultation_fee: 200000,
  },
  {
    id: 3,
    user_id: 7,
    full_name: 'BS Phan Ngọc Thuận',
    avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300',
    phone: '0912445566',
    email: 'thuan.phan@youmed.vn',
    is_active: true,
    license_number: 'CCHN-THUAN-02',
    qualification: 'Bác sĩ Đa khoa',
    experience_years: 4,
    biography: 'Bác sĩ trẻ năng động, chuyên khám và điều trị Nội tổng quát kết hợp nội soi tiêu hóa.',
    status: 'ACTIVE',
    specialty: 'Nội tổng quát',
    specialties: ['Nội tổng quát'],
    specialty_ids: [1],
    hospital_id: 2,
    hospital_name: 'Bệnh viện Chợ Rẫy',
    hospital_address: '201B Nguyễn Chí Thanh, Phường 12, Quận 5',
    room_number: 'P.104 Nội soi',
    consultation_fee: 180000,
  },
  {
    id: 4,
    user_id: 8,
    full_name: 'ThS. BS Trần Minh Anh',
    avatar: 'https://images.unsplash.com/photo-1594824813511-20902f83d957?w=300',
    phone: '0912556677',
    email: 'minhanh.tran@youmed.vn',
    is_active: true,
    license_number: 'CCHN-MANH-03',
    qualification: 'Thạc sĩ, BS. CKII',
    experience_years: 15,
    biography: 'Hơn 15 năm kinh nghiệm chuyên sâu tim mạch can thiệp, đào tạo tại ĐH Y Dược TP.HCM.',
    status: 'ACTIVE',
    specialty: 'Tim mạch',
    specialties: ['Tim mạch'],
    specialty_ids: [2],
    hospital_id: 1,
    hospital_name: 'Bệnh viện Đại học Y Dược TP.HCM',
    hospital_address: '215 Hồng Bàng, Phường 11, Quận 5',
    room_number: 'P.302 Tim Mạch',
    consultation_fee: 300000,
  },
  {
    id: 5,
    user_id: 9,
    full_name: 'BS. CKII Nguyễn Hoàng Lan',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300',
    phone: '0912667788',
    email: 'hoanglan.nguyen@youmed.vn',
    is_active: false,
    license_number: 'CCHN-LAN-04',
    qualification: 'BS. CKII',
    experience_years: 10,
    biography: '10 năm kinh nghiệm nhi khoa lâm sàng và điều trị dinh dưỡng sơ sinh.',
    status: 'INACTIVE',
    specialty: 'Nhi khoa',
    specialties: ['Nhi khoa'],
    specialty_ids: [3],
    hospital_id: 4,
    hospital_name: 'Bệnh viện Nhi Đồng 1',
    hospital_address: '341 Sư Vạn Hạnh, Phường 10, Quận 10',
    room_number: 'P.108 Sơ sinh',
    consultation_fee: 250000,
  },
];

const DEFAULT_SPECIALTIES = [
  { id: 1, name: 'Nội tổng quát', description: 'Khám và tư vấn bệnh lý nội đa cơ quan' },
  { id: 2, name: 'Tim mạch', description: 'Chuyên sâu chẩn đoán và can thiệp mạch vành, huyết áp' },
  { id: 3, name: 'Nhi khoa', description: 'Chăm sóc sức khỏe toàn diện cho trẻ sơ sinh và trẻ nhỏ' },
  { id: 4, name: 'Da liễu', description: 'Thăm khám và điều trị các vấn đề về da, tóc, móng' },
  { id: 5, name: 'Tai Mũi Họng', description: 'Chẩn đoán và phẫu thuật điều trị vùng tai mũi họng' },
  { id: 6, name: 'Sản Phụ khoa', description: 'Khám thai, theo dõi thai kỳ và điều trị phụ khoa' },
  { id: 7, name: 'Mắt', description: 'Khám khúc xạ và phẫu thuật điều trị nhãn khoa' },
  { id: 8, name: 'Răng Hàm Mặt', description: 'Nha khoa thẩm mỹ và phẫu thuật chỉnh hình răng' },
];

let localDoctors = [...INITIAL_DOCTORS];

class DoctorService {
  async getDoctors(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.keyword) query.append('keyword', params.keyword);
      if (params.specialty && params.specialty !== 'Tất cả') {
        query.append('specialty', params.specialty);
      }
      if (params.hospital_id) query.append('hospital_id', String(params.hospital_id));
      if (params.status) query.append('status', params.status);
      if (params.admin) query.append('admin', 'true');

      const response = await fetch(`${API_BASE_URL}/doctors?${query.toString()}`);
      const data = await readResponse(response, 'Không thể tải danh sách bác sĩ từ máy chủ.');
      localDoctors = data;
      return data;
    } catch {
      // Offline fallback filter
      let result = [...localDoctors];
      if (params.status && params.status !== 'ALL') {
        result = result.filter((d) => d.status === params.status);
      }
      if (params.hospital_id && params.hospital_id !== 'ALL') {
        result = result.filter((d) => String(d.hospital_id) === String(params.hospital_id));
      }
      if (params.specialty && params.specialty !== 'Tất cả') {
        result = result.filter((d) =>
          d.specialties?.some((s) => s.toLowerCase().includes(params.specialty.toLowerCase()))
        );
      }
      if (params.keyword) {
        const kw = params.keyword.toLowerCase();
        result = result.filter(
          (d) =>
            d.full_name?.toLowerCase().includes(kw) ||
            d.qualification?.toLowerCase().includes(kw) ||
            d.license_number?.toLowerCase().includes(kw) ||
            d.phone?.toLowerCase().includes(kw) ||
            d.email?.toLowerCase().includes(kw) ||
            d.hospital_name?.toLowerCase().includes(kw)
        );
      }
      return result;
    }
  }

  async getDoctorById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/doctors/${encodeURIComponent(id)}`);
      return await readResponse(response, 'Không thể tải thông tin bác sĩ từ máy chủ.');
    } catch {
      const doc = localDoctors.find((d) => String(d.id) === String(id));
      if (!doc) throw new Error('Không tìm thấy thông tin bác sĩ.');
      return doc;
    }
  }

  async createDoctor(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await readResponse(response, 'Lỗi thêm bác sĩ mới.');
      return result.doctor;
    } catch {
      // Local fallback create
      const newId = localDoctors.length > 0 ? Math.max(...localDoctors.map((d) => d.id)) + 1 : 1;
      const newDoctor = {
        id: newId,
        user_id: 100 + newId,
        full_name: data.full_name,
        avatar: data.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300',
        phone: data.phone || '',
        email: data.email,
        is_active: data.status !== 'INACTIVE',
        license_number: data.license_number || `CCHN-DEMO-${newId}`,
        qualification: data.qualification || 'Bác sĩ',
        experience_years: Number(data.experience_years) || 1,
        biography: data.biography || '',
        status: data.status || 'ACTIVE',
        specialties: data.specialty_names || ['Đa khoa'],
        specialty: (data.specialty_names || ['Đa khoa']).join(', '),
        hospital_id: data.hospital_id || 1,
        hospital_name: data.hospital_name || 'Bệnh viện Đa khoa Quốc tế',
        room_number: data.room_number || 'P.101',
        consultation_fee: Number(data.consultation_fee) || 200000,
      };
      localDoctors = [newDoctor, ...localDoctors];
      return newDoctor;
    }
  }

  async updateDoctor(id, data) {
    try {
      const response = await fetch(`${API_BASE_URL}/doctors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await readResponse(response, 'Lỗi cập nhật thông tin bác sĩ.');
      return result.doctor;
    } catch {
      // Local fallback update
      const index = localDoctors.findIndex((d) => String(d.id) === String(id));
      if (index !== -1) {
        localDoctors[index] = {
          ...localDoctors[index],
          ...data,
          specialties: data.specialty_names || localDoctors[index].specialties,
          specialty: (data.specialty_names || localDoctors[index].specialties).join(', '),
        };
        return localDoctors[index];
      }
      throw new Error('Không tìm thấy bác sĩ cần cập nhật.');
    }
  }

  async toggleDoctorStatus(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/doctors/${id}/status`, {
        method: 'PATCH',
      });
      return await readResponse(response, 'Lỗi đổi trạng thái bác sĩ.');
    } catch {
      const index = localDoctors.findIndex((d) => String(d.id) === String(id));
      if (index !== -1) {
        const nextStatus = localDoctors[index].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        localDoctors[index] = {
          ...localDoctors[index],
          status: nextStatus,
          is_active: nextStatus === 'ACTIVE',
        };
        return { message: 'Đã đổi trạng thái', status: nextStatus };
      }
      throw new Error('Không tìm thấy bác sĩ.');
    }
  }

  async deleteDoctor(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/doctors/${id}`, {
        method: 'DELETE',
      });
      return await readResponse(response, 'Lỗi xóa bác sĩ.');
    } catch (err) {
      if (err.message && err.message.includes('lịch hẹn')) {
        throw err;
      }
      localDoctors = localDoctors.filter((d) => String(d.id) !== String(id));
      return { message: 'Đã xóa bác sĩ thành công.' };
    }
  }

  async getSpecialties() {
    try {
      const response = await fetch(`${API_BASE_URL}/doctors/meta/specialties`);
      return await readResponse(response, 'Không thể tải danh sách chuyên khoa.');
    } catch {
      return DEFAULT_SPECIALTIES;
    }
  }
}

export const doctorService = new DoctorService();
