import { authService } from './auth-service';

export function authHeaders(headers = {}) {
  const token = authService.getToken();
  return { ...headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
