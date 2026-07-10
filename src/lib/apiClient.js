import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  'https://str.ec2.alluvium.net/vendorpay';

const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// =========================
// REQUEST INTERCEPTOR
// =========================
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// =========================
// RESPONSE INTERCEPTOR
// =========================
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // handle expired token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(
          `${BASE_URL}/api/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const { access_token, refresh_token } = res.data;

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        return apiClient(originalRequest);
      } catch (err) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;