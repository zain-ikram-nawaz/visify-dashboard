// lib/auth.js (Aapka Naya Clean Code)
import api from './api';

export const logoutUser = async (router) => {
  try {
    // Backend ka logout route hit karein jo cookie clear karega
    await api.post('/auth/logout');

    // User ko login page par bhejein aur state refresh karein
    router.push('/login');
    router.refresh();
  } catch (err) {
    console.error('Logout failed:', err);
  }
};