import apiClient from "../apiClient";

export const vendorService = {
  // =========================
  // AUTH-RELATED (kept here for now)
  // =========================

  register: async (payload) => {
    const res = await apiClient.post("/auth/register", payload);
    return res.data;
  },

  login: async (payload) => {
    const res = await apiClient.post("/auth/login", payload);
    return res.data;
  },

  forgotPassword: async (email) => {
    const res = await apiClient.post("/auth/forgot-password", { email });
    return res.data;
  },

  resetPassword: async (payload) => {
    const res = await apiClient.post("/auth/reset-password", payload);
    return res.data;
  },

  // =========================
  // VENDOR FLOW
  // =========================

  onboard: async (companyData) => {
    const res = await apiClient.post("/vendors/onboard", companyData);
    return res.data;
  },

  setupBanking: async (bankingData) => {
    const res = await apiClient.post("/banking/setup", bankingData);
    return res.data;
  },

  getProfile: async () => {
    const res = await apiClient.get("/vendors/profile");
    return res.data;
  },

  getDashboard: async () => {
    const res = await apiClient.get("/vendors/dashboard");
    return res.data;
  },

  getAdminDashboard: async () => {
    const res = await apiClient.get("/vendors/admin/dashboard");
    return res.data;
  },

  getAllVendors: async () => {
    const res = await apiClient.get("/vendors/");
    return res.data;
  },

  getVendorById: async (id) => {
    const res = await apiClient.get(`/vendors/${id}`);
    return res.data;
  },
};