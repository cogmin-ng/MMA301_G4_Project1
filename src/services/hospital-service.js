import { API_BASE_URL } from './api-config';

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

    const res = await fetch(`${API_BASE_URL}/hospitals?${query.toString()}`);
    if (!res.ok) {
      throw new Error('Lỗi lấy danh sách cơ sở y tế.');
    }
    return await res.json();
  }

  async getHospitalById(id) {
    const res = await fetch(`${API_BASE_URL}/hospitals/${id}`);
    if (!res.ok) {
      throw new Error('Không tìm thấy cơ sở y tế.');
    }
    return await res.json();
  }

  async createHospital(data) {
    const res = await fetch(`${API_BASE_URL}/hospitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.error || 'Lỗi thêm cơ sở y tế.');
    }
    return resData.hospital;
  }

  async updateHospital(id, data) {
    const res = await fetch(`${API_BASE_URL}/hospitals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.error || 'Lỗi cập nhật cơ sở y tế.');
    }
    return resData.hospital;
  }

  async toggleHospitalStatus(id) {
    const res = await fetch(`${API_BASE_URL}/hospitals/${id}/status`, {
      method: 'PATCH',
    });

    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.error || 'Lỗi đổi trạng thái cơ sở y tế.');
    }
    return resData.hospital;
  }

  async deleteHospital(id) {
    const res = await fetch(`${API_BASE_URL}/hospitals/${id}`, {
      method: 'DELETE',
    });

    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.error || 'Lỗi xóa cơ sở y tế.');
    }
  }

  async getProvinces() {
    try {
      const res = await fetch(`${API_BASE_URL}/hospitals/meta/provinces`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Lỗi lấy danh mục tỉnh thành:', err);
    }
    return ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ'];
  }
}

export const hospitalService = new HospitalService();
