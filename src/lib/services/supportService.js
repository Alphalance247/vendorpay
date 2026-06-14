import apiClient from "../apiClient";

export const supportService = {
  // Vendor
  createTicket: async ({ subject, body }) => {
    const res = await apiClient.post('/support/tickets', { subject, body });
    return res.data;
  },

  getMyTickets: async () => {
    const res = await apiClient.get('/support/tickets/my');
    return res.data;
  },

  // Admin
  getAllTickets: async () => {
    const res = await apiClient.get('/support/tickets/all');
    return res.data;
  },

  closeTicket: async (ticketId) => {
    const res = await apiClient.patch(`/support/tickets/${ticketId}/status`, { status: 'closed' });
    return res.data;
  },

  reopenTicket: async (ticketId) => {
    const res = await apiClient.patch(`/support/tickets/${ticketId}/status`, { status: 'open' });
    return res.data;
  },

  // Shared
  getTicket: async (ticketId) => {
    const res = await apiClient.get(`/support/tickets/${ticketId}`);
    return res.data;
  },

  reply: async (ticketId, body) => {
    const res = await apiClient.post(`/support/tickets/${ticketId}/reply`, { body });
    return res.data;
  },

  // AI Chat
  chat: async (messages) => {
    const res = await apiClient.post('/support/chat', { messages });
    return res.data.reply;
  },
};
