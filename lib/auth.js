// lib/auth.js (Aapka Naya Clean Code)
import api from './api';

export const logoutUser = async (router) => {
  try {
    await api.post('/auth/logout');
  } catch (err) {
    console.error('Logout failed:', err);
  } finally {
    // Token frontend se bhi clear karo
    localStorage.removeItem('token');
    document.cookie = 'token=; Max-Age=0; path=/';
    router.push('/login');
    router.refresh();
  }
};