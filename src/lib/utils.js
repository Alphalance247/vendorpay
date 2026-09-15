export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', CAD: 'C$',
  KES: 'KSh', NGN: '₦', ZAR: 'R', GHS: 'GH₵',
  UGX: 'USh', TZS: 'TSh', RWF: 'FRw', ETB: 'Br',
  XOF: 'CFA', XAF: 'FCFA', EGP: 'E£', MAD: 'DH',
};

export function getCurrencySymbol(currency) {
  return CURRENCY_SYMBOLS[currency] ?? currency ?? '';
}

export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function downloadCSV(filename, rows) {
  if (!rows || rows.length === 0) return;

  const headers = Object.keys(rows[0]);

  const escape = (value) => {
    const str = value == null ? '' : String(value);
    return /[",\n]/.test(str)
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const lines = [headers.join(',')];

  for (const row of rows) {
    lines.push(headers.map((header) => escape(row[header])).join(','));
  }

  const blob = new Blob([lines.join('\n')], {
    type: 'text/csv;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// Only accept plain, non-empty strings — backend error shapes vary (a missing
// response/data, or a `detail`/`message`/`error` that's an object or an array,
// e.g. FastAPI validation errors) and none of those are safe to render directly.
function asMessage(value) {
  return typeof value === 'string' && value.trim() ? value : null;
}

export function extractErrorMessage(error) {
  return (
    asMessage(error?.response?.data?.detail) ||
    asMessage(error?.response?.data?.message) ||
    asMessage(error?.response?.data?.error) ||
    asMessage(error?.message) ||
    'An unexpected error occurred'
  );
}