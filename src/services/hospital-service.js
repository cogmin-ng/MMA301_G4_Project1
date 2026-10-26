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

class HospitalService {
  async getHospitals(params = {}) {
    const query = new URLSearchParams();
    if (params.keyword) query.append('keyword', params.keyword);
    if (params.province && params.province !== 'ALL' && params.province !== 'Tất cả') {
      query.append('province', params.province);
    }
    if (params.status && params.status !== 'ALL') {
      query.append('status', params.status);
    }

    const response = await fetch(`${API_BASE_URL}/hospitals?${query.toString()}`);
    return readResponse(response, 'Không thể tải danh sách cơ sở y tế từ máy chủ.');
  }

  async getHospitalById(id) {
    const response = await fetch(`${API_BASE_URL}/hospitals/${encodeURIComponent(id)}`);
    return readResponse(response, 'Không thể tải thông tin cơ sở y tế từ máy chủ.');
  }

  async createHospital(data) {
    const response = await fetch(`${API_BASE_URL}/hospitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await readResponse(response, 'Lỗi thêm cơ sở y tế.');
    return result.hospital;
  }

  async updateHospital(id, data) {
    const response = await fetch(`${API_BASE_URL}/hospitals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await readResponse(response, 'Lỗi cập nhật cơ sở y tế.');
    return result.hospital;
  }

  async toggleHospitalStatus(id) {
    const response = await fetch(`${API_BASE_URL}/hospitals/${id}/status`, {
      method: 'PATCH',
    });
    const result = await readResponse(response, 'Lỗi đổi trạng thái cơ sở y tế.');
    return result.hospital;
  }

  async deleteHospital(id) {
    const response = await fetch(`${API_BASE_URL}/hospitals/${id}`, {
      method: 'DELETE',
    });
    await readResponse(response, 'Lỗi xóa cơ sở y tế.');
  }

  async getProvinces() {
    const response = await fetch(`${API_BASE_URL}/hospitals/meta/provinces`);
    return readResponse(response, 'Không thể tải danh sách tỉnh/thành từ máy chủ.');
  }
}

export const hospitalService = new HospitalService();
