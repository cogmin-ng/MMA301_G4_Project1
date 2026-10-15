import { API_BASE_URL } from './api-config';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.token = null;
  }

  async login(identifier, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Đăng nhập không thành công.');
    }

    this.currentUser = data.user;
    this.token = data.token;
    return { user: data.user, token: data.token };
  }

  async register(data) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.error || 'Đăng ký tài khoản thất bại.');
    }

    return { user: resData.user };
  }

  async logout() {
    this.currentUser = null;
    this.token = null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  setCurrentUser(user) {
    this.currentUser = user;
  }

  getToken() {
    return this.token;
  }

  /**
   * Lấy danh sách users có hỗ trợ lọc theo role và tìm kiếm
   */
  async getUsers(params) {
    try {
      const searchParams = new URLSearchParams();
      if (params?.role && params.role !== 'ALL') searchParams.append('role', params.role);
      if (params?.search) searchParams.append('search', params.search);

      const res = await fetch(`${API_BASE_URL}/auth/users?${searchParams.toString()}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Không thể tải danh sách tài khoản:', err);
    }
    return [];
  }

  async updateUserRole(userId, role) {
    const res = await fetch(`${API_BASE_URL}/auth/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Máy chủ không phản hồi JSON (Mã ${res.status}). Vui lòng kiểm tra server Express.`);
    }
    if (!res.ok) {
      throw new Error(data.error || 'Cập nhật phân quyền thất bại.');
    }
    return data.user;
  }

  async toggleUserStatus(userId) {
    const res = await fetch(`${API_BASE_URL}/auth/users/${userId}/status`, {
      method: 'PATCH',
    });
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Máy chủ không phản hồi JSON (Mã ${res.status}). Vui lòng kiểm tra server Express.`);
    }
    if (!res.ok) {
      throw new Error(data.error || 'Thay đổi trạng thái tài khoản thất bại.');
    }
    return data;
  }

  async createUser(data) {
    const res = await fetch(`${API_BASE_URL}/auth/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    let resData;
    try {
      resData = await res.json();
    } catch {
      throw new Error(`Máy chủ không phản hồi JSON (Mã ${res.status}). Vui lòng kiểm tra server Express.`);
    }
    if (!resData || !res.ok) {
      throw new Error(resData?.error || 'Tạo tài khoản thất bại.');
    }
    return resData.user;
  }

  async getAvailableUsers() {
    return this.getUsers();
  }

  async switchAccountByRole(role) {
    const users = await this.getAvailableUsers();
    const matched = users.find((u) => u.role === role && u.is_active);
    if (!matched) {
      throw new Error(`Không tìm thấy tài khoản vai trò ${role} đang hoạt động.`);
    }
    this.currentUser = matched;
    this.token = `jwt-${matched.id}-${matched.role.toLowerCase()}-${Date.now()}`;
    return matched;
  }

  async switchAccountToUser(user) {
    this.currentUser = user;
    this.token = `jwt-${user.id}-${user.role.toLowerCase()}-${Date.now()}`;
    return user;
  }
}

export const authService = new AuthService();
