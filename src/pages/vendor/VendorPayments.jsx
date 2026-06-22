import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import TutorialCard from '../../components/ui/TutorialCard';
import { formatCurrency, formatDate, extractErrorMessage } from '../../lib/utils';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusChip from '../../components/ui/StatusChip';
import { invoiceService } from '../../lib/services/invoiceService';

const PAGE_SIZE = 20;

const PAYMENT_STATUSES = 'paid,payment_confirmed,payment_disputed';

const STATUS_LABEL = {
  paid: 'Paid',
  payment_confirmed: 'Payment Confirmed',
  payment_disputed: 'Payment Disputed',
};

function groupByCurrency(invoices) {
  const totals = {};
  for (const inv of invoices) {
    const cur = inv.currency || 'USD';
    totals[cur] = (totals[cur] ?? 0) + (inv.amount ?? 0);
  }
  return totals;
}

function CurrencyLines({ map }) {
  const entries = Object.entries(map);
  if (entries.length === 0) return <p className="text-2xl font-bold text-on-surface tnum">—</p>;
  return (
    <div className="space-y-0.5">
      {entries.map(([cur, amt]) => (
        <p key={cur} className="text-2xl font-bold text-on-surface tnum leading-tight">
          {formatCurrency(amt, cur)}
        </p>
      ))}
    </div>
  );
}

export default function VendorPayments() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    invoiceService.getMyInvoices({ status: PAYMENT_STATUSES, page, pageSize: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;
        const items = Array.isArray(data) ? data : (data.items ?? data.data ?? []);
        setInvoices(items);
        setTotal(data.total ?? items.length);
      })
      .catch((err) => { if (!cancelled) setError(extractErrorMessage(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page]);

  const totals = groupByCurrency(invoices);
  const confirmedCount = invoices.filter((i) => i.status === 'payment_confirmed').length;
  const disputedCount  = invoices.filter((i) => i.status === 'payment_disputed').length;
  const lastPayment    = invoices.find((i) => i.payment_date)?.payment_date ?? null;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AppLayout role="vendor">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Payments</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">All invoices that have been paid or settled.</p>
        </div>

        <TutorialCard
          id="vendor-payments"
          title="Your Payment History"
          description="View all invoices that have been paid or settled by the finance team."
          tips={[
            "Only invoices with a Paid or Confirmed status appear here.",
            "The stat cards at the top summarise your total received amount, payment count, and any disputes.",
            "If a payment looks incorrect, go to Invoice History, open the invoice, and raise a dispute from the detail page.",
          ]}
        />

        <div className="grid grid-cols-4 gap-4">
          <Card className="py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Total Received</p>
            <CurrencyLines map={totals} />
          </Card>
          <Card className="py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Payments Count</p>
            <p className="text-2xl font-bold text-on-surface">{total}</p>
            {confirmedCount > 0 && (
              <p className="text-xs mt-0.5 text-emerald">{confirmedCount} confirmed by you</p>
            )}
          </Card>
          <Card className="py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Disputed</p>
            <p className="text-2xl font-bold text-on-surface">{disputedCount}</p>
            {disputedCount > 0
              ? <p className="text-xs mt-0.5 text-error">Under review</p>
              : <p className="text-xs mt-0.5 text-emerald">None disputed</p>
            }
          </Card>
          <Card className="py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Last Payment</p>
            <p className="text-xl font-bold text-on-surface mt-1">{lastPayment ? formatDate(lastPayment) : '—'}</p>
          </Card>
        </div>

        <Card className="p-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-emerald" />
              <span className="ml-2 text-sm text-on-surface-variant">Loading payments...</span>
            </div>
          ) : error ? (
            <p className="px-4 py-8 text-center text-sm text-error">{error}</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-surface-low border-b border-outline-variant">
                  {['Invoice #', 'Date Paid', 'Amount', 'Currency', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-on-surface-variant">
                      No payments yet. Invoices marked &quot;Paid&quot; by your admin will appear here.
                    </td>
                  </tr>
                ) : invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-low/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-on-surface">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-sm text-on-surface-variant">
                      {inv.payment_date ? formatDate(inv.payment_date) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold tnum text-on-surface">
                      {formatCurrency(inv.amount, inv.currency)}
                    </td>
                    <td className="px-4 py-3 text-sm text-on-surface-variant">{inv.currency ?? 'USD'}</td>
                    <td className="px-4 py-3">
                      <StatusChip status={STATUS_LABEL[inv.status] ?? inv.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1.5"
                        onClick={() => navigate(`/vendorpay/vendor/invoices/${inv.id}`)}
                      >
                        <Eye size={15} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

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
