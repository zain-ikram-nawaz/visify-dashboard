import axios from 'axios';

const DEFAULT_API_URL = 'https://visify-backend.zingcalc.com/api';
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;

function normalizeApiUrl(value) {
  const url = (value || '').trim().replace(/\/$/, '');
  if (!url) return DEFAULT_API_URL;
  return url.endsWith('/api') ? url : `${url}/api`;
}

export const API_BASE_URL =
  normalizeApiUrl(configuredApiUrl);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Cross-origin deployments mein cookies block ho sakti hain;
// isliye token Authorization header se bhejte hain.
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
