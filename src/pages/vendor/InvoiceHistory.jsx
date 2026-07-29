import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Search, Download, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import TutorialCard from '../../components/ui/TutorialCard';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusChip from '../../components/ui/StatusChip';
import { formatCurrency, formatDate, extractErrorMessage, getCurrencySymbol } from '../../lib/utils';
import { invoiceService } from '../../lib/services/invoiceService';
import { vendorService } from '../../lib/services/vendorService';

const PAGE_SIZE = 20;
const STATUS_OPTIONS = ['All', 'submitted', 'paid', 'payment_confirmed', 'payment_disputed', 'flagged', 'rejected'];

const STATUS_LABEL = {
  submitted: 'Submitted',
  reviewed: 'Reviewed',
  funding: 'Awaiting Payment',
  paid: 'Paid',
  payment_confirmed: 'Payment Confirmed',
  payment_disputed: 'Payment Disputed',
  rejected: 'Rejected',
  flagged: 'Flagged',
};

export default function InvoiceHistory() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [dash, setDash] = useState(null);
  const [profile, setProfile] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [invoiceData, dashData] = await Promise.all([
          invoiceService.getMyInvoices({
            status: statusFilter !== 'All' ? statusFilter : undefined,
            search: search || undefined,
            page,
            pageSize: PAGE_SIZE,
          }),
          vendorService.getDashboard(),
        ]);
        if (cancelled) return;
        const items = Array.isArray(invoiceData)
          ? invoiceData
          : (invoiceData.items ?? invoiceData.data ?? []);
        setInvoices(items);
        setTotal(invoiceData.total ?? items.length);
        setDash(dashData);
      } catch (err) {
        if (!cancelled) setError(extractErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [statusFilter, search, page]);

  useEffect(() => {
    vendorService.getProfile().then(setProfile).catch(() => {});
  }, []);

  async function handleDownload(invoiceId) {
    if (downloadingId) return;
    setDownloadingId(invoiceId);
    try {
      await invoiceService.downloadInvoicePdf(invoiceId);
    } catch {
      // silent — browser already shows if blocked
    } finally {
      setDownloadingId(null);
    }
  }

  function formatByCurrency(map) {
    if (!map || Object.keys(map).length === 0) return [{ label: formatCurrency(0, profile?.currency ?? 'USD'), key: profile?.currency ?? 'USD' }];
    return Object.entries(map).map(([currency, amount]) => ({
      key: currency,
      label: formatCurrency(amount, currency),
    }));
  }

  const trendRaw = dash?.payment_trends ?? [];
  const histPrimaryCurrency = trendRaw.flatMap((pt) => Object.keys(pt.submitted_by_currency ?? {}))[0] ?? profile?.currency ?? 'USD';
  const histCurrSymbol = getCurrencySymbol(histPrimaryCurrency);

  const trendData = trendRaw.map((pt) => ({
    month: pt.month?.split(' ')[0] ?? pt.month,
    submitted: pt.submitted_by_currency?.[histPrimaryCurrency] ?? 0,
    settled:   pt.settled_by_currency?.[histPrimaryCurrency]   ?? 0,
    rejected:  pt.rejected_by_currency?.[histPrimaryCurrency]  ?? 0,
  }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AppLayout role="vendor">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">Invoice History</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">Review and manage your accounts receivable and outgoing billing.</p>
          </div>
          <Button onClick={() => navigate('/vendor/invoices/new')}>
            + Submit New Invoice
          </Button>
        </div>

        <TutorialCard
          id="vendor-invoices"
          title="Managing Your Invoices"
          description="Search, filter, and track every invoice you have submitted."
          tips={[
            "Use the search bar to find invoices by invoice number.",
            "Filter by status (Pending, Paid, Rejected, etc.) to focus on what needs attention.",
            "Click any row to view full details, download the PDF, or message the finance team.",
            "Use the Submit New Invoice button in the top-right to start a new submission.",
          ]}
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-4 gap-3">
          <Card className="py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Total Invoices</p>
            <p className="text-xl font-bold text-on-surface mt-1 tnum">{dash?.total_invoices ?? '—'}</p>
            <p className="text-xs mt-0.5 text-on-surface-variant">{dash?.pending_approval_count ?? 0} pending approval</p>
          </Card>
          <Card className="py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Paid This Month</p>
            {dash ? (
              <div className="mt-1 space-y-0.5">
                {formatByCurrency(dash.paid_this_month).map(({ key, label }) => (
                  <p key={key} className="text-xl font-bold text-on-surface tnum leading-tight">{label}</p>
                ))}
              </div>
            ) : <p className="text-xl font-bold text-on-surface mt-1">—</p>}
            {dash && (
              <div className="mt-1 space-y-0 text-xs text-emerald">
                {formatByCurrency(dash.total_amount_paid_ytd).map(({ key, label }) => (
                  <p key={key}>YTD: {label}</p>
                ))}
              </div>
            )}
          </Card>
          <Card className="py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Overdue</p>
            {dash ? (
              <div className="mt-1 space-y-0.5">
                {formatByCurrency(dash.overdue_amount).map(({ key, label }) => (
                  <p key={key} className="text-xl font-bold text-on-surface tnum leading-tight">{label}</p>
                ))}
              </div>
            ) : <p className="text-xl font-bold text-on-surface mt-1">—</p>}
            {dash?.overdue_count > 0
              ? <p className="text-xs mt-0.5 text-error">{dash.overdue_count} invoice{dash.overdue_count !== 1 ? 's' : ''}</p>
              : <p className="text-xs mt-0.5 text-emerald">None overdue</p>
            }
          </Card>
          <Card className="py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Pending Approval</p>
            <p className="text-xl font-bold text-on-surface mt-1 tnum">{dash?.pending_approval_count ?? '—'}</p>
            <p className="text-xs mt-0.5 text-on-surface-variant">awaiting review</p>
          </Card>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search invoice #..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-surface-low rounded border border-outline-variant focus:outline-none focus:ring-2 focus:ring-emerald"
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Status</span>
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    statusFilter === s
                      ? 'border-navy bg-navy text-white'
                      : 'border-outline-variant text-on-surface-variant hover:bg-surface-low'
                  }`}
                >
                  {STATUS_LABEL[s] ?? 'All'}
                </button>
              ))}
            </div>
            {(search || statusFilter !== 'All') && (
              <button
                onClick={() => { setSearch(''); setStatusFilter('All'); setPage(1); }}
                className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface ml-auto"
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-emerald" />
              <span className="ml-2 text-sm text-on-surface-variant">Loading invoices...</span>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-surface-low border-b border-outline-variant">
                  {['Invoice #', 'Submitted', 'Due Date', 'Amount', 'Status', 'Payment Date', ''].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-on-surface-variant">
                      No invoices found.
                    </td>
                  </tr>
                ) : invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-low/50 transition-colors cursor-pointer" onClick={() => navigate(`/vendor/invoices/${inv.id}`)}>
                    <td className="px-6 py-4 text-sm font-semibold text-on-surface">{inv.invoice_number}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{formatDate(inv.submitted_at)}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{inv.due_date ? formatDate(inv.due_date) : '—'}</td>
                    <td className="px-6 py-4 text-sm font-semibold tnum text-on-surface">{formatCurrency(inv.amount, inv.currency)}</td>
                    <td className="px-6 py-4"><StatusChip status={STATUS_LABEL[inv.status] ?? inv.status} /></td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{inv.payment_date ? formatDate(inv.payment_date) : '—'}</td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1.5"
                        onClick={() => handleDownload(inv.id)}
                        disabled={downloadingId === inv.id}
                        title="Download PDF"
                      >
                        {downloadingId === inv.id
                          ? <Loader2 size={15} className="animate-spin" />
                          : <Download size={15} />}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="px-6 py-3 border-t border-outline-variant flex items-center justify-between">
            <p className="text-xs text-on-surface-variant">
              Showing {invoices.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{(page - 1) * PAGE_SIZE + invoices.length} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded text-on-surface-variant hover:bg-surface-container disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 text-xs text-on-surface-variant">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded text-on-surface-variant hover:bg-surface-container disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-on-surface">Payment Trends</h3>
          </div>
          {trendData.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-8">No payment history yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={trendData} barGap={2} margin={{ left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#74777c' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#74777c' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${histCurrSymbol}${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v, name) => [formatCurrency(v, histPrimaryCurrency), name]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #c4c6cc' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                <Bar dataKey="submitted" name="Submitted" fill="#c4c6cc" radius={[3, 3, 0, 0]} />
                <Bar dataKey="settled"   name="Settled"   fill="#006c49" radius={[3, 3, 0, 0]} />
                <Bar dataKey="rejected"  name="Rejected"  fill="#ba1a1a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
