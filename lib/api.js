import axios from 'axios';

const DEFAULT_API_URL = 'https://visify-backend.zingcalc.com/api';
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;

// The old Railway-generated hostname no longer points to an application.
// Keep deployed clients working even if Vercel still has that stale value.
export const API_BASE_URL =
  !configuredApiUrl || configuredApiUrl.includes('visify-backend-production.up.railway.app')
    ? DEFAULT_API_URL
    : configuredApiUrl.replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Cross-origin deployments (Vercel → Railway) mein cookies block ho jaati hain
// isliye token Authorization header se bhejte hain
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
