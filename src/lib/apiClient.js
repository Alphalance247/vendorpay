import axios from "axios";
import { environment } from "../env/env.local";
import { withSubdomain } from "./tenantResolver";

// Trailing slash stripped so every `${BASE_URL}/api/...` below produces a
// single slash regardless of how environment.baseUrl is formatted.
const BASE_URL =
  import.meta.env.VITE_BACKEND_URL || environment.baseUrl.replace(/\/+$/, "");

// Once an admin/employee is on a company's own workspace, API calls should
// hit that company's own subdomain (e.g. bestbraininc.vpay.goalluvium.net)
// rather than the shared root host. company_slug is stored in localStorage
// on login (see authContext.jsx); no slug (e.g. a vendor session, or before
// login) falls back to the plain root BASE_URL.
function companyApiBaseUrl() {
  const slug = localStorage.getItem("company_slug");
  return `${withSubdomain(BASE_URL, slug)}/api`;
}

const apiClient = axios.create({
  baseURL: companyApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// =========================
// REQUEST INTERCEPTOR
// =========================
apiClient.interceptors.request.use((config) => {
  // Re-resolved per request rather than fixed at instance-creation time,
  // since company_slug may not be known yet (or may change) after the
  // client was first created.
  config.baseURL = companyApiBaseUrl();

  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Shared by concurrent 401s so they await one refresh call instead of each
// firing its own — parallel calls with the same refresh token can race if
// the backend invalidates a refresh token as soon as it's used.
let refreshPromise = null;

function refreshAccessToken(refreshToken) {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${companyApiBaseUrl()}/auth/refresh`, {
        refresh_token: refreshToken,
      })
      .then((res) => {
        const { access_token, refresh_token } = res.data;

        localStorage.setItem("access_token", access_token);
        if (refresh_token) {
          localStorage.setItem("refresh_token", refresh_token);
        }

        return access_token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

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

      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const accessToken = await refreshAccessToken(refreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return apiClient(originalRequest);
      } catch (err) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
