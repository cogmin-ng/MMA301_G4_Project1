import { Platform } from 'react-native';

// Khi chạy trên máy thật hoặc emulator, có thể tùy chỉnh IP LAN
const DEFAULT_HOST = Platform.select({
  android: 'http://10.0.2.2:5000',
  default: 'http://localhost:5000',
});

export const API_BASE_URL = `${DEFAULT_HOST}/api`;
