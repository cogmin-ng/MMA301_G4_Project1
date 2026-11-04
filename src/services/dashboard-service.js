import { API_BASE_URL } from './api-config';
import { authHeaders } from './auth-headers';

class DashboardService {
  async getDashboardStats() {
    const res = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, { headers: authHeaders() });
    if (!res.ok) {
      throw new Error('Lỗi lấy dữ liệu thống kê Dashboard.');
    }
    const data = await res.json();
    return {
      totalHospitals: data.totalHospitals,
      activeHospitals: data.activeHospitals,
      inactiveHospitals: data.inactiveHospitals,
      totalDoctors: data.totalDoctors,
      totalPatients: data.totalPatients,
      totalAppointments: data.totalAppointments,
      totalRevenue: data.totalRevenue,
      statusCounts: data.statusCounts,
    };
  }

  async getRecentHospitals() {
    const res = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, { headers: authHeaders() });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return data.recentHospitals || [];
  }
}

export const dashboardService = new DashboardService();
