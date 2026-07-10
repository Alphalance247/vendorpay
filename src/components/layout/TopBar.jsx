import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Settings, Search, X, LogOut, ChevronRight, FileText, User } from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { invoiceService, adminInvoiceService } from '../../lib/services/invoiceService';
import { vendorService } from '../../lib/services/vendorService';
import { formatCurrency, formatDate } from '../../lib/utils';

const STATUS_LABEL = {
  submitted: 'Submitted',
  reviewed: 'Under Review',
  funding: 'Funding Initiated',
  paid: 'Payment Sent',
  payment_confirmed: 'Payment Confirmed',
  payment_disputed: 'Payment Disputed',
  rejected: 'Rejected',
  flagged: 'Flagged',
};

const STATUS_COLOR = {
  paid: 'text-emerald',
  payment_confirmed: 'text-emerald',
  rejected: 'text-error',
  payment_disputed: 'text-error',
  flagged: 'text-amber',
  funding: 'text-blue-600',
  reviewed: 'text-on-surface-variant',
  submitted: 'text-on-surface-variant',
};

const READ_KEY = 'vp_read_notif_ids';

function getReadIds() {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) ?? '[]')); }
  catch { return new Set(); }
}

function markIdsRead(ids) {
  const existing = getReadIds();
  ids.forEach((id) => existing.add(id));
  localStorage.setItem(READ_KEY, JSON.stringify([...existing]));
}

function useOutsideClick(ref, onClose) {
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onClose]);
}

export default function TopBar({ searchPlaceholder = 'Search invoices, payments, or vendors...' }) {
  const navigate = useNavigate();
  const { role, logout } = useAuth();

  const [query, setQuery] = useState('');
  const [showBell, setShowBell] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [profile, setProfile] = useState(null);

  const bellRef = useRef(null);
  const settingsRef = useRef(null);

  useOutsideClick(bellRef, () => setShowBell(false));
  useOutsideClick(settingsRef, () => setShowSettings(false));

  // Fetch profile for name/email display
  useEffect(() => {
    if (role === 'vendor') {
      vendorService.getProfile().then(setProfile).catch(() => {});
    }
  }, [role]);

  // Fetch recent invoices to drive notifications
  useEffect(() => {
    if (!role) return;
    async function load() {
      try {
        if (role === 'vendor') {
          const res = await invoiceService.getMyInvoices({ pageSize: 10 });
          const items = res.items ?? [];
          setNotifications(items.slice(0, 8));
          const readIds = getReadIds();
          setUnread(items.filter((i) =>
            !readIds.has(i.id) &&
            ['paid', 'rejected', 'payment_confirmed', 'payment_disputed', 'reviewed'].includes(i.status)
          ).length);
        } else if (role === 'admin') {
          const res = await adminInvoiceService.getAllInvoices({ pageSize: 10 });
          const items = res.items ?? [];
          setNotifications(items.slice(0, 8));
          const readIds = getReadIds();
          setUnread(items.filter((i) => !readIds.has(i.id) && i.status === 'submitted').length);
        }
      } catch { /* non-critical */ }
    }
    load();
  }, [role]);

  function openBell() {
    setShowBell(true);
    setShowSettings(false);
    // Mark all visible notifications as read
    const ids = notifications.map((n) => n.id);
    markIdsRead(ids);
    setUnread(0);
  }

  function handleNotificationClick(inv) {
    markIdsRead([inv.id]);
    setShowBell(false);
    navigate(role === 'admin'
      ? `/admin/invoices/${inv.id}`
      : `/vendor/invoices/${inv.id}`);
  }

  function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    const q = encodeURIComponent(query.trim());
    navigate(role === 'admin'
      ? `/admin/invoices?search=${q}`
      : `/vendor/invoices?search=${q}`);
    setQuery('');
  }

  function handleSignOut() {
    logout();
    navigate('/login');
  }

  const displayName = profile
    ? [profile.contact_first_name, profile.contact_last_name].filter(Boolean).join(' ') || profile.company_name || 'Vendor'
    : role === 'admin' ? 'Administrator' : '—';

  const displayEmail = profile?.contact_email || profile?.user_email || '';

  return (
    <header className="h-14 bg-white border-b border-outline-variant flex items-center px-6 gap-4 z-20 relative">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-8 py-1.5 text-sm bg-surface-low rounded border border-outline-variant focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber placeholder:text-outline transition-colors"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
            <X size={13} />
          </button>
        )}
      </form>

      <div className="flex items-center gap-1 ml-auto">
        {/* Bell */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => (showBell ? setShowBell(false) : openBell())}
            className="p-2 rounded hover:bg-surface-container text-on-surface-variant relative transition-colors"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-error rounded-full flex items-center justify-center text-white text-[10px] font-bold px-0.5">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showBell && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-dropdown border border-outline-variant overflow-hidden">
              <div className="px-4 py-3 border-b border-outline-variant">
                <p className="text-sm font-semibold text-on-surface">Notifications</p>
                <p className="text-xs text-on-surface-variant mt-0.5">Recent invoice activity</p>
              </div>

              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-on-surface-variant">No recent activity</div>
              ) : (
                <ul className="max-h-72 overflow-y-auto divide-y divide-outline-variant/50">
                  {notifications.map((inv) => (
                    <li key={inv.id}>
                      <button
                        onClick={() => handleNotificationClick(inv)}
                        className="w-full text-left px-4 py-3 hover:bg-surface-low transition-colors flex items-start gap-3"
                      >
                        <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileText size={13} className="text-on-surface-variant" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-on-surface truncate">
                            Invoice {inv.invoice_number}
                          </p>
                          <p className={`text-xs font-medium ${STATUS_COLOR[inv.status] ?? 'text-on-surface-variant'}`}>
                            {STATUS_LABEL[inv.status] ?? inv.status}
                          </p>
                          <p className="text-[11px] text-outline mt-0.5">
                            {formatCurrency(inv.amount, inv.currency)} · {formatDate(inv.submitted_at ?? inv.updated_at)}
                          </p>
                        </div>
                        <ChevronRight size={13} className="text-outline flex-shrink-0 mt-1" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="border-t border-outline-variant px-4 py-2.5">
                <button
                  onClick={() => { setShowBell(false); navigate(role === 'admin' ? '/admin/invoices' : '/vendor/invoices'); }}
                  className="text-xs text-amber font-medium hover:underline"
                >
                  View all invoices →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div ref={settingsRef} className="relative">
          <button
            onClick={() => { setShowSettings((v) => !v); setShowBell(false); }}
            className="p-2 rounded hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <Settings size={18} />
          </button>

          {showSettings && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-dropdown border border-outline-variant overflow-hidden">
              {/* User info */}
              <div className="px-4 py-3 border-b border-outline-variant flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber flex items-center justify-center flex-shrink-0">
                  <User size={15} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">{displayName}</p>
                  {displayEmail && <p className="text-xs text-on-surface-variant truncate">{displayEmail}</p>}
                  <p className="text-xs text-outline capitalize">{role}</p>
                </div>
              </div>

              <div className="py-1">
                {role === 'vendor' && (
                  <button
                    onClick={() => { setShowSettings(false); navigate('/vendor/profile'); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-on-surface hover:bg-surface-low transition-colors flex items-center gap-2.5"
                  >
                    <User size={15} className="text-on-surface-variant" />
                    Edit Profile
                  </button>
                )}
                <button
                  onClick={() => { setShowSettings(false); navigate(role === 'admin' ? '/admin/support' : '/vendor/support'); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-on-surface hover:bg-surface-low transition-colors flex items-center gap-2.5"
                >
                  <Bell size={15} className="text-on-surface-variant" />
                  Support
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2.5 text-sm text-error hover:bg-red-50 transition-colors flex items-center gap-2.5"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
