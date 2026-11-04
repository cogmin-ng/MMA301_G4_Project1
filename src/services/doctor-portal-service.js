import { API_BASE_URL } from './api-config';
import { authService } from './auth-service';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/doctor-portal${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authService.getToken()}`,
      ...options.headers,
    },
  });
  let data;
  try { data = await response.json(); } catch { throw new Error('Máy chủ không phản hồi dữ liệu hợp lệ.'); }
  if (!response.ok) throw new Error(data.error || 'Không thể thực hiện yêu cầu.');
  return data;
}

export const doctorPortalService = {
  getProfile: () => request('/profile'),
  updateProfile: (data) => request('/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  getAppointments: (status = 'ALL') => request(`/appointments?status=${encodeURIComponent(status)}`),
  updateAppointment: (id, data) => request(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getSchedules: () => request('/schedules'),
  addSchedule: (data) => request('/schedules', { method: 'POST', body: JSON.stringify(data) }),
  deleteSchedule: (id) => request(`/schedules/${id}`, { method: 'DELETE' }),
  addTimeOff: (data) => request('/time-offs', { method: 'POST', body: JSON.stringify(data) }),
  deleteTimeOff: (id) => request(`/time-offs/${id}`, { method: 'DELETE' }),
};
