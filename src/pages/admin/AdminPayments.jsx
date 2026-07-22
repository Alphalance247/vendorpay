import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, CheckCircle, Clock, XCircle, Receipt, Loader2 } from 'lucide-react';
import TutorialCard from '../../components/ui/TutorialCard';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusChip from '../../components/ui/StatusChip';
import { formatCurrency, formatDate } from '../../lib/utils';
import { invoiceService } from '../../lib/services/invoiceService';

const STATUS_MAP = { paid: 'Paid', funding: 'Awaiting Payment', rejected: 'Denied' };

function totalsByCurrency(items) {
  const totals = {};
  items.forEach((p) => {
    const currency = p.currency ?? 'USD';
    totals[currency] = (totals[currency] ?? 0) + p.amount;
  });
  return totals;
}

function formatTotals(items) {
  const totals = totalsByCurrency(items);
  if (Object.keys(totals).length === 0) return formatCurrency(0, 'USD');
  return Object.entries(totals).map(([currency, amount]) => formatCurrency(amount, currency)).join(' + ');
}

const TABS = [
  { key: 'Paid', dbStatus: 'paid', icon: CheckCircle, accent: 'text-emerald' },
  { key: 'Awaiting Payment', dbStatus: 'funding', icon: Clock, accent: 'text-amber-600' },
  { key: 'Denied', dbStatus: 'rejected', icon: XCircle, accent: 'text-error' },
];

export default function AdminPayments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Paid');
  const [search, setSearch] = useState('');

  useEffect(() => {
    invoiceService.getAdminPayments({ page_size: 200 })
      .then(setPayments)
      .catch(() => setError('Failed to load payments.'))
      .finally(() => setLoading(false));
  }, []);

  const byTab = (tab) => payments.filter((p) => STATUS_MAP[p.status] === tab);

  const counts = Object.fromEntries(TABS.map(({ key }) => [key, byTab(key).length]));
  const totals = Object.fromEntries(TABS.map(({ key }) => [key, formatTotals(byTab(key))]));

  const filtered = byTab(activeTab).filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.vendor_name?.toLowerCase().includes(q) ||
      p.invoice_number?.toLowerCase().includes(q) ||
      p.payment_rail?.toLowerCase().includes(q)
    );
  });

  return (
    <AppLayout role="admin" searchPlaceholder="Search payments, vendors, or transactions...">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">Payments</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">Track vendor disbursements across every status.</p>
          </div>
          <Button variant="secondary" size="sm">
            <Download size={14} /> Export
          </Button>
        </div>

        <TutorialCard
          id="admin-payments"
          title="Tracking Disbursements"
          description="Monitor all vendor payments from funding through vendor confirmation."
          tips={[
            "The Paid tab shows fully confirmed payments; Awaiting Payment shows funded invoices not yet confirmed by the vendor.",
            "Denied shows invoices that were rejected before payment — the vendor will need to resubmit.",
            "Search by vendor name, invoice number, or payment rail to locate specific records quickly.",
            "Click any row to open the full invoice detail and complete audit trail.",
          ]}
        />

        <div className="grid grid-cols-3 gap-4">
          {TABS.map(({ key, icon: Icon, accent }) => (
            <Card key={key}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{key}</p>
                <Icon size={16} className={accent} />
              </div>
              {loading ? (
                <Loader2 size={18} className="animate-spin text-emerald mt-2" />
              ) : (
                <>
                  <p className="text-2xl font-bold tnum text-on-surface mt-1">{counts[key] ?? 0}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">Total {totals[key] ?? formatCurrency(0, 'USD')}</p>
                </>
              )}
            </Card>
          ))}
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="flex border-b border-outline-variant">
            {TABS.map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? 'border-emerald text-emerald bg-emerald/5'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Icon size={15} />
                {key}
                <span className="text-xs bg-surface-container px-1.5 py-0.5 rounded-full text-on-surface-variant">
                  {counts[key] ?? 0}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by vendor, invoice, or rail..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-surface-low rounded border border-outline-variant focus:outline-none focus:ring-2 focus:ring-emerald"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-emerald" />
              <span className="ml-2 text-sm text-on-surface-variant">Loading payments...</span>
            </div>
          ) : error ? (
            <p className="px-6 py-10 text-center text-sm text-error">{error}</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-surface-low border-b border-outline-variant">
                  {['Vendor', 'Invoice #', 'Rail', 'Amount', 'Date', 'Status', 'Action'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-low/50 transition-colors cursor-pointer" onClick={() => navigate(`/admin/invoices/${p.id}`)}>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-on-surface">{p.vendor_name ?? '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{p.invoice_number}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{p.payment_rail ?? '—'}</td>
                    <td className="px-6 py-4 text-sm font-semibold tnum text-on-surface">
                      {formatCurrency(p.amount, p.currency)}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {formatDate(p.payment_date ?? p.submitted_at)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusChip status={STATUS_MAP[p.status] ?? p.status} />
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      {p.status === 'paid' && (
                        <Button variant="ghost" size="sm" className="p-1.5" title="Receipt">
                          <Receipt size={15} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-on-surface-variant">
                      No {activeTab.toLowerCase()} payments{search ? ' match your search' : ''}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          <div className="px-6 py-3 border-t border-outline-variant flex items-center justify-between">
            <p className="text-xs text-on-surface-variant">
              Showing {filtered.length} of {counts[activeTab] ?? 0} {activeTab.toLowerCase()} payments
            </p>
            <p className="text-xs font-semibold tnum text-on-surface">
              Total {formatTotals(filtered)}
            </p>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
