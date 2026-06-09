import axios from 'axios';
import apiClient from "../apiClient";

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://str.ec2.alluvium.net/vendorpay';

export const authService = {
  login: async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    formData.append('grant_type', 'password');

    const response = await axios.post(`${BACKEND}/api/auth/login`, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },

  register: async (email, password) => {
    const response = await apiClient.post('/auth/register', { email, password });
    return response.data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refresh_token: refreshToken });
      } catch {}
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await apiClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },
};