import apiClient from "../apiClient";
import { authService } from "./authService";

export const adminService = {
  getProfile: async () => {
    const res = await apiClient.get("/auth/me");
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await apiClient.put("/auth/me", data);
    return res.data;
  },

  getCompany: async () => {
    const res = await apiClient.get("/company/me");
    return res.data;
  },

  updateCompany: async (data) => {
    const res = await apiClient.patch("/company/me", data);
    return res.data;
  },

  // The photo belongs to the user account, so it's shared with vendors.
  uploadAvatar: authService.uploadAvatar,
  removeAvatar: authService.removeAvatar,

  uploadCompanyLogo: async (file) => {
    const formData = new FormData();

    formData.append("logo", file);

    const res = await apiClient.post(
      "/auth/company/logo",
      formData,
      { headers: { "Content-Type": undefined } },
    );

    return res.data;
  },

  removeCompanyLogo: async () => {
    const res = await apiClient.delete("/auth/company/logo");
    return res.data;
  },
};