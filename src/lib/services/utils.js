// Extracts a human-readable message from an axios error
export function extractErrorMessage(error) {
  // FastAPI validation errors look like:
  // { detail: [{ loc: [...], msg: "...", type: "..." }] }
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;
    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg).join(', ');
    }
    return String(detail);
  }
  // Network error (no internet, server down)
  if (!error.response) {
    return 'Network error — please check your connection.';
  }
  // Generic HTTP errors
  return error.message || 'Something went wrong.';
}