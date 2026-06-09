import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // 👈 Boht important hai! Iske bagair cookie backend par nahi jayegi
});

// Ab hme request interceptor mein token add karne ki zaroorat nahi hai!
// Browser automatically cookie bhej dega.

export default api;