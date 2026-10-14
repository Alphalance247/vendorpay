import apiClient from "../apiClient";

// Vendors can upload PDFs or images as their invoice document, but the
// backend always serves them back from the same /pdf endpoint under a
// generic 'pdf' form field — so the only reliable way to know what we
// actually got back is to sniff the file's own magic bytes.
async function detectBlobType(blob) {
  const bytes = new Uint8Array(await blob.slice(0, 12).arrayBuffer());

  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

  if (hex.startsWith('25504446')) return 'application/pdf'; // %PDF
  if (hex.startsWith('89504e47')) return 'image/png';
  if (hex.startsWith('ffd8ff')) return 'image/jpeg';
  if (hex.startsWith('47494638')) return 'image/gif'; // GIF87a / GIF89a
  if (hex.startsWith('52494646') && hex.slice(16, 24) === '57454250') return 'image/webp'; // RIFF....WEBP
  if (hex.startsWith('504b0304')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; // PK zip (.docx)
  if (hex.startsWith('d0cf11e0')) return 'application/msword'; // OLE2 (.doc)

  return blob.type || 'application/octet-stream';
}

const EXTENSION_BY_CONTENT_TYPE = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

export const extractInvoiceWithAI = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/invoices/extract', formData, {
    headers: { 'Content-Type': undefined },
  });
  const d = response.data;
  return {
    invoiceNumber: d.invoice_number || null,
    amount: d.amount != null ? Number(d.amount) : null,
    currency: d.currency || null,
    invoiceDate: d.invoice_date || null,
    dueDate: d.due_date || null,
    vendorName: d.vendor_name || null,
    // isInvoice: typeof d.is_invoice === 'boolean' ? d.is_invoice : null,
  };
};

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
    const contentType = await detectBlobType(response.data);
    const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice-${invoiceId}.${EXTENSION_BY_CONTENT_TYPE[contentType] ?? 'pdf'}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  getAdminInvoicePdfUrl: async (invoiceId) => {
    const response = await apiClient.get(`/invoices/all/${invoiceId}/pdf`, {
      responseType: 'blob',
    });
    const contentType = await detectBlobType(response.data);
    const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
    return { url, contentType };
  },

  downloadInvoicePdf: async (invoiceId) => {
    const response = await apiClient.get(`/invoices/my/${invoiceId}/pdf`, {
      responseType: 'blob',
    });
    const contentType = await detectBlobType(response.data);
    const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice-${invoiceId}.${EXTENSION_BY_CONTENT_TYPE[contentType] ?? 'pdf'}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  getInvoicePdfUrl: async (invoiceId) => {
    const response = await apiClient.get(`/invoices/my/${invoiceId}/pdf`, {
      responseType: 'blob',
    });
    const contentType = await detectBlobType(response.data);
    const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
    return { url, contentType };
  },
  deleteInvoice: async (invoice_id) => {
    const res = await apiClient.delete(`/invoices/my/${invoice_id}`)
    return res.data
  }
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

  disputePayment: async (invoiceId, reason) => {
    const response = await apiClient.patch(`/invoices/${invoiceId}/dispute-payment`, { reason: reason || null });
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
