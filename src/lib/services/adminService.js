import apiClient from "../apiClient";

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

  uploadAvatar: async (file) => {
    const formData = new FormData();

    formData.append("avatar", file);

    const res = await apiClient.post(
      "/auth/me/avatar",
      formData,
      // Let the browser set the multipart boundary itself — the instance's
      // default "application/json" header would otherwise strip it and the
      // file wouldn't upload correctly.
      { headers: { "Content-Type": undefined } },
    );

    return res.data;
  },

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
};