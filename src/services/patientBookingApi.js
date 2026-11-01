/** Set EXPO_PUBLIC_API_URL in root .env. For Android emulator use http://10.0.2.2:5000 */
const BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');
// Integrate this with the app's existing authentication/token storage.
let tokenProvider = async () => null;
export const setPatientTokenProvider = (provider) => { tokenProvider = provider; };
async function request(path, options = {}) {
  const token = await tokenProvider();
  const response = await fetch(`${BASE}/api/patient${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `HTTP ${response.status}`);
  return body.data;
}
export const patientBookingApi = {
  hospitals: () => request('/hospitals'),
  doctors: (hospitalId) => request(`/hospitals/${encodeURIComponent(hospitalId)}/doctors`),
  slots: (doctorId, date) => request(`/doctors/${encodeURIComponent(doctorId)}/slots?date=${encodeURIComponent(date)}`),
  create: (payload) => request('/appointments', { method: 'POST', body: JSON.stringify(payload) }),
  history: () => request('/appointments'),
  cancel: (id) => request(`/appointments/${encodeURIComponent(id)}/cancel`, { method: 'PATCH' }),
};
