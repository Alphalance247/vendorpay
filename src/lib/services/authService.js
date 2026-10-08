import axios from 'axios';
import apiClient from '../apiClient';
import { environment } from '../../env/env.local';

const BASE_URL =
  import.meta.env.VITE_BACKEND_URL || environment.baseUrl.replace(/\/+$/, '');

export const authService = {
  // =========================
  // REGISTER (creates account)
  // =========================
  register: async (email, password) => {
    const res = await apiClient.post('/auth/register', {
      email,
      password,
    });
    return res.data;
  },

  // =========================
  // LOGIN
  // =========================
  login: async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    formData.append('grant_type', 'password');

    const response = await axios.post(
      `${BASE_URL}/api/auth/login`,
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data;
  },

  // =========================
  // LOGOUT
  // =========================
  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');

    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', {
          refresh_token: refreshToken,
        });
      } catch {
        console.warn('Logout request failed silently');
      }
    }

    localStorage.clear();
  },

  // =========================
  // FORGOT PASSWORD
  // =========================
  forgotPassword: async (email) => {
    const res = await apiClient.post('/auth/forgot-password', {
      email,
    });
    return res.data;
  },

  // =========================
  // RESET PASSWORD
  // =========================
  resetPassword: async (token, newPassword) => {
    const res = await apiClient.post('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
    return res.data;
  },

  // =========================
  // CHANGE PASSWORD (logged in user)
  // =========================
  changePassword: async (currentPassword, newPassword) => {
    const res = await apiClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return res.data;
  },

  // =========================
  // PROFILE PHOTO (any signed-in user — admins and vendors alike)
  // =========================
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const res = await apiClient.post(
      '/auth/me/avatar',
      formData,
      // Let the browser set the multipart boundary itself — the instance's
      // default "application/json" header would otherwise strip it and the
      // file wouldn't upload correctly.
      { headers: { 'Content-Type': undefined } },
    );
    return res.data;
  },

  removeAvatar: async () => {
    const res = await apiClient.delete('/auth/me/avatar');
    return res.data;
  },
};
