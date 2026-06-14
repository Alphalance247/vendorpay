import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Search, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusChip from '../../components/ui/StatusChip';
import RejectModal from '../../components/ui/RejectModal';
import { formatCurrency, formatDate, extractErrorMessage } from '../../lib/utils';
import { adminInvoiceService } from '../../lib/services/invoiceService';

const PAGE_SIZE = 25;

const TABS = [
  { label: 'All',          status: undefined },
  { label: 'Pending',      status: 'submitted' },
  { label: 'Reviewed',     status: 'reviewed' },
  { label: 'Funding',      status: 'funding' },
  { label: 'Paid',         status: 'paid' },
  { label: 'Confirmed',    status: 'payment_confirmed' },
  { label: 'Disputed',     status: 'payment_disputed' },
  { label: 'Rejected',     status: 'rejected' },
  { label: 'Flagged',      status: 'flagged' },
];

const STATUS_LABEL = {
  submitted:         'Pending Review',
  reviewed:          'Reviewed',
  funding:           'Funding',
  paid:              'Paid',
  payment_confirmed: 'Payment Confirmed',
  payment_disputed:  'Payment Disputed',
  rejected:          'Rejected',
  flagged:           'Flagged',
};

function isOverdue(inv) {
  if (!inv.due_date) return false;
  const closed = ['paid', 'payment_confirmed', 'payment_disputed', 'rejected'];
  if (closed.includes(inv.status)) return false;
  return new Date(inv.due_date) < new Date();
}

export default function AdminInvoiceManagement() {
  const navigate = useNavigate();

  const [invoices, setInvoices]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch]       = useState('');

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState(null); // { id, invoice_number }

  // Inline action loading per row
  const [rowLoading, setRowLoading] = useState({});

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminInvoiceService.getAllInvoices({
        status: TABS[activeTab].status,
        search: search || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      const items = Array.isArray(data) ? data : (data.items ?? data.invoices ?? []);
      setInvoices(items);
      setTotal(data.total ?? items.length);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, page]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  function switchTab(idx) {
    setActiveTab(idx);
    setPage(1);
  }

  function handleSearchChange(e) {
    setSearch(e.target.value);
    setPage(1);
  }

  async function rowAction(id, fn, key) {
    setRowLoading((prev) => ({ ...prev, [id]: key }));
    try {
      await fn();
      await fetchInvoices();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setRowLoading((prev) => ({ ...prev, [id]: null }));
    }
  }

  async function handleApprove(inv) {
    rowAction(inv.id, () => adminInvoiceService.approveInvoice(inv.id, ''), 'approve');
  }

  async function handleFund(inv) {
    rowAction(inv.id, () => adminInvoiceService.fundInvoice(inv.id, ''), 'fund');
  }

  async function handleMarkPaid(inv) {
    rowAction(inv.id, () => adminInvoiceService.markPaid(inv.id), 'paid');
  }

  async function handleRejectConfirm(reason) {
    if (!rejectTarget) return;
    const { id } = rejectTarget;
    setRejectTarget(null);
    rowAction(id, () => adminInvoiceService.rejectInvoice(id, reason), 'reject');
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Stats derived from current page data (approximation — full stats would require separate API call)
  const pendingCount  = invoices.filter((i) => i.status === 'submitted').length;
  const disputedCount = invoices.filter((i) => i.status === 'payment_disputed').length;

  return (
    <AppLayout role="admin">
      <RejectModal
        open={!!rejectTarget}
        invoiceNumber={rejectTarget?.invoice_number ?? ''}
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectTarget(null)}
      />

      <div className="space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">Manage Invoices</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">Review, approve, and track all vendor invoices.</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm flex items-center justify-between">
            {error}
            <button onClick={() => setError('')} className="ml-2 underline text-xs">Dismiss</button>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Total Invoices</p>
            <p className="text-2xl font-bold text-on-surface mt-1">{total}</p>
          </Card>
          <Card className="py-4 bg-navy border-0 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pending Review</p>
            <p className="text-2xl font-bold mt-1">{pendingCount}</p>
          </Card>
          <Card className="py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Disputed</p>
            <p className="text-2xl font-bold text-on-surface mt-1">{disputedCount}</p>
          </Card>
          <Card className="py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Page</p>
            <p className="text-2xl font-bold text-on-surface mt-1">{page} / {totalPages}</p>
          </Card>
        </div>

        <Card className="p-0 overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-outline-variant overflow-x-auto">
            {TABS.map((tab, idx) => (
              <button
                key={tab.label}
                onClick={() => switchTab(idx)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeTab === idx
                    ? 'text-emerald border-b-2 border-emerald -mb-px'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-outline-variant flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                value={search}
                onChange={handleSearchChange}
                placeholder="Search invoice # or vendor..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-surface-low rounded border border-outline-variant focus:outline-none focus:ring-2 focus:ring-emerald"
              />
            </div>
            {search && (
              <button onClick={() => { setSearch(''); setPage(1); }} className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface">
                <X size={12} /> Clear
              </button>
            )}
            <p className="text-xs text-on-surface-variant ml-auto">{total} invoice{total !== 1 ? 's' : ''}</p>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-emerald" />
              <span className="ml-2 text-sm text-on-surface-variant">Loading invoices...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr className="bg-surface-low border-b border-outline-variant">
                    {['Vendor', 'Invoice #', 'Submitted', 'Due Date', 'Amount', 'Rail', 'Status', 'Paid On', 'Actions'].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-on-surface-variant whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-sm text-on-surface-variant">
                        No invoices found.
                      </td>
                    </tr>
                  ) : invoices.map((inv) => {
                    const overdue  = isOverdue(inv);
                    const loading  = rowLoading[inv.id];
                    const status   = STATUS_LABEL[inv.status] ?? inv.status;

                    return (
                      <tr key={inv.id} className="hover:bg-surface-low/50 transition-colors">
                        {/* Vendor */}
                        <td className="px-3 py-2.5">
                          <p className="text-sm font-semibold text-on-surface whitespace-nowrap">{inv.vendor_name ?? '—'}</p>
                        </td>

                        {/* Invoice # */}
                        <td className="px-3 py-2.5 text-xs font-mono text-on-surface-variant whitespace-nowrap">
                          {inv.invoice_number}
                        </td>

                        {/* Submitted */}
                        <td className="px-3 py-2.5 text-xs text-on-surface-variant whitespace-nowrap">
                          {formatDate(inv.submitted_at)}
                        </td>

                        {/* Due Date */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {inv.due_date ? (
                            <span className={`text-xs ${overdue ? 'text-error font-semibold' : 'text-on-surface-variant'}`}>
                              {formatDate(inv.due_date)}
                              {overdue && <span className="ml-1 text-[10px] bg-error/10 text-error px-1 py-0.5 rounded">Late</span>}
                            </span>
                          ) : <span className="text-xs text-outline">—</span>}
                        </td>

                        {/* Amount (currency embedded) */}
                        <td className="px-3 py-2.5 text-sm font-semibold tnum text-on-surface whitespace-nowrap">
                          {formatCurrency(inv.amount, inv.currency)}
                        </td>

                        {/* Payment Rail */}
                        <td className="px-3 py-2.5">
                          {inv.payment_rail ? (
                            <span className="text-xs bg-surface-container text-on-surface-variant px-2 py-0.5 rounded font-medium">
                              {inv.payment_rail}
                            </span>
                          ) : <span className="text-xs text-outline">—</span>}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-2.5">
                          <StatusChip status={status} />
                        </td>

                        {/* Payment Date */}
                        <td className="px-3 py-2.5 text-xs text-on-surface-variant whitespace-nowrap">
                          {inv.payment_date ? formatDate(inv.payment_date) : <span className="text-outline">—</span>}
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5 flex-nowrap">
                            {inv.status === 'submitted' && (
                              <>
                                <Button size="sm" variant="secondary" onClick={() => handleApprove(inv)} disabled={!!loading}>
                                  {loading === 'approve' ? <Loader2 size={11} className="animate-spin" /> : 'Approve'}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setRejectTarget(inv)} disabled={!!loading} className="text-error hover:bg-red-50">
                                  Reject
                                </Button>
                              </>
                            )}
                            {inv.status === 'reviewed' && (
                              <>
                                <Button size="sm" variant="secondary" onClick={() => handleFund(inv)} disabled={!!loading}>
                                  {loading === 'fund' ? <Loader2 size={11} className="animate-spin" /> : 'Fund'}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setRejectTarget(inv)} disabled={!!loading} className="text-error hover:bg-red-50">
                                  Reject
                                </Button>
                              </>
                            )}
                            {inv.status === 'funding' && (
                              <Button size="sm" variant="secondary" onClick={() => handleMarkPaid(inv)} disabled={!!loading}>
                                {loading === 'paid' ? <Loader2 size={11} className="animate-spin" /> : 'Mark Paid'}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1.5"
                              onClick={() => navigate(`/vendorpay/admin/invoices/${inv.id}`)}
                            >
                              <Eye size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-outline-variant flex items-center justify-between">
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
      </div>
    </AppLayout>
  );
}
