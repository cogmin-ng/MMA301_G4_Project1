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

class DoctorService {
  async getDoctors(params = {}) {
    const query = new URLSearchParams();
    if (params.keyword) query.append('keyword', params.keyword);
    if (params.specialty && params.specialty !== 'Tất cả') {
      query.append('specialty', params.specialty);
    }
    if (params.hospital_id) query.append('hospital_id', String(params.hospital_id));

    const response = await fetch(`${API_BASE_URL}/doctors?${query.toString()}`);
    return readResponse(response, 'Không thể tải danh sách bác sĩ từ máy chủ.');
  }

  async getDoctorById(id) {
    const response = await fetch(`${API_BASE_URL}/doctors/${encodeURIComponent(id)}`);
    return readResponse(response, 'Không thể tải thông tin bác sĩ từ máy chủ.');
  }
}

export const doctorService = new DoctorService();
