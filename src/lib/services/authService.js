import axios from 'axios';
import apiClient from '../apiClient';

const BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  'https://str.ec2.alluvium.net/vendorpay';

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
      } catch (err) {
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
};