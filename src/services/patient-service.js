import { API_BASE_URL } from './api-config';
import { authService } from './auth-service';

class PatientService {
  /**
   * Lấy token xác thực từ authService
   */
  getAuthToken() {
    const token = authService.getToken();
    if (token) return token;

    const user = authService.getCurrentUser();
    if (user?.id) {
      return `jwt-${user.id}-${(user.role || 'patient').toLowerCase()}-${Date.now()}`;
    }
    return null;
  }

  /**
   * Lấy thông tin cá nhân của bệnh nhân đang đăng nhập từ MySQL
   * Liên kết 2 bảng: users và patient_profiles
   */
  async getProfile() {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Chưa có phiên đăng nhập hợp lệ. Vui lòng đăng nhập lại.');
    }

    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Máy chủ không phản hồi JSON (Mã ${res.status}).`);
    }

    if (!res.ok) {
      throw new Error(data?.error || data?.message || 'Không thể tải thông tin cá nhân.');
    }

    return data;
  }

  /**
   * Cập nhật thông tin cá nhân của bệnh nhân vào MySQL
   * @param {Object} updateData - { full_name, email, phone, date_of_birth, gender, address, avatar }
   */
  async updateProfile(updateData) {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Chưa có phiên đăng nhập hợp lệ. Vui lòng đăng nhập lại.');
    }

    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Máy chủ không phản hồi JSON (Mã ${res.status}).`);
    }

    if (!res.ok) {
      throw new Error(data?.error || data?.message || 'Cập nhật thông tin cá nhân thất bại.');
    }

    return data.profile || data;
  }
}

export const patientService = new PatientService();

