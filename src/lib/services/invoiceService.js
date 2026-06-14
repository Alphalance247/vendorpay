import apiClient from "../apiClient";

export const invoiceService = {
  submitInvoice: async ({ invoiceNumber, amount, dueDate, currency, notes, pdfFile }) => {
    const formData = new FormData();
    formData.append('invoice_number', invoiceNumber);
    formData.append('amount', String(amount));
    formData.append('due_date', dueDate);
    formData.append('currency', currency || 'USD');
    if (notes) formData.append('notes', notes);
    formData.append('pdf', pdfFile);

    const response = await apiClient.post('/invoices/submit', formData, {
      headers: { 'Content-Type': undefined },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload: ${percent}%`);
      },
    });
    return response.data;
  },

  getMyInvoices: async ({ status, search, fromDate, toDate, page = 1, pageSize = 20 } = {}) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    params.append('page', String(page));
    params.append('page_size', String(pageSize));

    const response = await apiClient.get(`/invoices/my?${params}`);
    return response.data;
  },

  getMyInvoiceDetail: async (invoiceId) => {
    const response = await apiClient.get(`/invoices/my/${invoiceId}`);
    return response.data;
  },

  getAdminInvoiceDetail: async (invoiceId) => {
    const response = await apiClient.get(`/invoices/all/${invoiceId}`);
    return response.data;
  },

  getAdminPayments: async ({ page = 1, page_size = 50 } = {}) => {
    const params = new URLSearchParams({ page, page_size });
    const response = await apiClient.get(`/invoices/admin/payments?${params}`);
    return response.data;
  },

  downloadAdminInvoicePdf: async (invoiceId) => {
    const response = await apiClient.get(`/invoices/all/${invoiceId}/pdf`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice-${invoiceId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  getAdminInvoicePdfUrl: async (invoiceId) => {
    const response = await apiClient.get(`/invoices/all/${invoiceId}/pdf`, {
      responseType: 'blob',
    });
    return window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  },

  downloadInvoicePdf: async (invoiceId) => {
    const response = await apiClient.get(`/invoices/my/${invoiceId}/pdf`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice-${invoiceId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  getInvoicePdfUrl: async (invoiceId) => {
    const response = await apiClient.get(`/invoices/my/${invoiceId}/pdf`, {
      responseType: 'blob',
    });
    return window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  },
};

export const adminInvoiceService = {
  getAllInvoices: async ({ status, search, vendor_id, fromDate, toDate, page = 1, pageSize = 20 } = {}) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    if (vendor_id) params.append('vendor_id', String(vendor_id));
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    params.append('page', String(page));
    params.append('page_size', String(pageSize));

    const response = await apiClient.get(`/invoices/all?${params}`);
    return response.data;
  },

  approveInvoice: async (invoiceId, notes = '') => {
    const response = await apiClient.patch(`/invoices/${invoiceId}/approve`, { notes });
    return response.data;
  },

  rejectInvoice: async (invoiceId, notes = '') => {
    const response = await apiClient.patch(`/invoices/${invoiceId}/reject`, { notes });
    return response.data;
  },

  fundInvoice: async (invoiceId, notes = '') => {
    const response = await apiClient.patch(`/invoices/${invoiceId}/fund`, { notes });
    return response.data;
  },

  markPaid: async (invoiceId) => {
    const response = await apiClient.patch(`/invoices/${invoiceId}/mark-paid`);
    return response.data;
  },
};

export const vendorInvoiceService = {
  confirmPayment: async (invoiceId) => {
    const response = await apiClient.patch(`/invoices/${invoiceId}/confirm-payment`);
    return response.data;
  },

  disputePayment: async (invoiceId) => {
    const response = await apiClient.patch(`/invoices/${invoiceId}/dispute-payment`);
    return response.data;
  },
};

export const invoiceMessageService = {
  getMessages: async (invoiceId) => {
    const response = await apiClient.get(`/invoices/${invoiceId}/messages`);
    return response.data;
  },

  sendMessage: async (invoiceId, body) => {
    const response = await apiClient.post(`/invoices/${invoiceId}/messages`, { body });
    return response.data;
  },
};