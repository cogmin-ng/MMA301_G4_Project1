import { API_BASE_URL } from './api-config';
import { authService } from './auth-service';

const BASE = API_BASE_URL;
let tokenProvider = async () => authService.getToken();
export const setPatientTokenProvider = (provider) => {
  tokenProvider = provider;
};

async function request(path, options = {}) {
  const token = await tokenProvider();
  const response = await fetch(`${BASE}/patient${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || body.error || `Lỗi kết nối máy chủ (HTTP ${response.status})`);
  }
  return body.data;
}

export const patientBookingApi = {
  hospitals: async () =>
    (await request('/hospitals')).map((hospital) => ({
      ...hospital,
      _id: hospital.id,
    })),
  doctors: async (hospitalId) =>
    (await request(`/hospitals/${encodeURIComponent(hospitalId)}/doctors`)).map((doctor) => ({
      ...doctor,
      _id: doctor.id,
    })),
  slots: async (doctorId, hospitalId, date) =>
    request(
      `/doctors/${encodeURIComponent(doctorId)}/slots?hospitalId=${encodeURIComponent(hospitalId)}&date=${encodeURIComponent(date)}`
    ),
  create: (payload) =>
    request('/appointments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  history: async () =>
    (await request('/appointments')).map((appointment) => ({
      ...appointment,
      _id: appointment.id,
      date: String(appointment.appointment_date || '').slice(0, 10),
      time: String(appointment.start_time || '').slice(0, 5),
      endTime: String(appointment.end_time || '').slice(0, 5),
      note: appointment.symptoms,
      cancelReason: appointment.cancel_reason,
      roomNumber: appointment.room_number,
      consultationFee: appointment.consultation_fee,
      appointmentCode: appointment.appointment_code,
      doctor: {
        id: appointment.doctor_id,
        name: appointment.doctor_name,
        specialty: appointment.doctor_specialty,
        qualification: appointment.doctor_qualification,
        avatar: appointment.doctor_avatar,
      },
      hospital: {
        id: appointment.hospital_id,
        name: appointment.hospital_name,
        address: appointment.hospital_address,
      },
      status: String(appointment.status || '').toLowerCase(),
    })),
  cancel: (id) =>
    request(`/appointments/${encodeURIComponent(id)}/cancel`, {
      method: 'PATCH',
    }),
};
