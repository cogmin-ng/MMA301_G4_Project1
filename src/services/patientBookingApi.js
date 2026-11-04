import { API_BASE_URL } from './api-config';
import { authService } from './auth-service';

const BASE = API_BASE_URL;
let tokenProvider = async () => authService.getToken();
export const setPatientTokenProvider = (provider) => { tokenProvider = provider; };
async function request(path, options = {}) {
  const token = await tokenProvider();
  const response = await fetch(`${BASE}/patient${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `HTTP ${response.status}`);
  return body.data;
}
export const patientBookingApi = {
  hospitals: async () => (await request('/hospitals')).map((hospital) => ({ ...hospital, _id: hospital.id })),
  doctors: async (hospitalId) => (await request(`/hospitals/${encodeURIComponent(hospitalId)}/doctors`)).map((doctor) => ({ ...doctor, _id: doctor.id })),
  slots: async (doctorId, hospitalId, date) => request(`/doctors/${encodeURIComponent(doctorId)}/slots?hospitalId=${encodeURIComponent(hospitalId)}&date=${encodeURIComponent(date)}`),
  create: (payload) => request('/appointments', { method: 'POST', body: JSON.stringify(payload) }),
  history: async () => (await request('/appointments')).map((appointment) => ({
    ...appointment,
    _id: appointment.id,
    date: appointment.appointment_date,
    time: appointment.start_time,
    note: appointment.symptoms,
    doctor: { name: appointment.doctor_name, specialty: appointment.doctor_specialty },
    hospital: { name: appointment.hospital_name, address: appointment.hospital_address },
    status: String(appointment.status).toLowerCase(),
  })),
  cancel: (id) => request(`/appointments/${encodeURIComponent(id)}/cancel`, { method: 'PATCH' }),
};
