export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// The backend requires a minimum of 10 characters for any password. Several
// forms had drifted to checking 8 instead, which let users submit a
// password the backend would then reject. Use this constant everywhere a
// password length is validated so the two never diverge again.
export const MIN_PASSWORD_LENGTH = 10;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  return EMAIL_PATTERN.test((value ?? '').trim());
}

// The backend issues finer-grained roles (admin, owner, staff, member, ...)
// than the app's two dashboards. Only an explicit "vendor" role belongs on
// the vendor dashboard — every other role lands on the admin dashboard.
export function isVendorRole(role) {
  return role === 'vendor';
}

export function dashboardPathForRole(role) {
  return isVendorRole(role) ? '/vendor/dashboard' : '/admin/dashboard';
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

export function maskAccountNumber(value) {
  if (!value) return '—';
  const str = String(value);
  return str.length <= 4 ? str : `•••• ${str.slice(-4)}`;
}

export function formatCurrency(amount, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Intl.NumberFormat only accepts a proper ISO 4217 code (e.g. "CAD") —
    // it throws outright if a currency symbol (e.g. "CA$") is passed instead.
    // The real fix is wherever that value originates sending the ISO code,
    // but fall back to a plain number + whatever string we got so a bad
    // value degrades gracefully instead of crashing the page.
    const number = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
    }).format(amount);
    return `${currency} ${number}`;
  }
}

// For headline/stat-card numbers that could plausibly grow into the
// millions, billions or beyond (e.g. a monthly volume total) — keeps the
// displayed string short and roughly constant-width regardless of
// magnitude ("$166M", "$1.2B") instead of a long figure that can overflow
// a fixed-width card or wrap awkwardly on small screens. Not meant for
// line-item amounts (invoice rows, payment rows, etc.) where the exact
// figure matters more than brevity — use formatCurrency there, and pair
// this with the full formatCurrency value nearby (e.g. in a sub-label or
// tooltip) so the precise number is never hidden, only de-emphasized.
export function formatCompactCurrency(amount, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      compactDisplay: 'short',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    const number = new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(amount);
    return `${currency} ${number}`;
  }
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