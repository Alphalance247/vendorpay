import apiClient from "../apiClient";

export const vendorService = {
  onboard: async (companyData) => {
    const response = await apiClient.post('/vendors/onboard', companyData);
    return response.data;
  },

  setupBanking: async (bankingData) => {
    const response = await apiClient.post('/banking/setup', bankingData);
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/vendors/profile');
    return response.data;
  },

  getDashboard: async () => {
    const response = await apiClient.get('/vendors/dashboard');
    return response.data;
  },
};