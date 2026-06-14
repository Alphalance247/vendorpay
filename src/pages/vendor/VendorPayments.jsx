import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import { invoiceService } from '../../lib/services/invoiceService';

export default function VendorPayments() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    invoiceService.getMyInvoices({ status: 'paid', page_size: 100 })
      .then((data) => {
        const items = Array.isArray(data) ? data : (data.items ?? data.invoices ?? data.data ?? []);
        setInvoices(items);
      })
      .catch(() => setError('Failed to load payments.'))
      .finally(() => setLoading(false));
  }, []);

  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amount ?? 0), 0);
  const lastPayment = invoices[0]?.payment_date ?? invoices[0]?.submitted_at ?? null;

  return (
    <AppLayout role="vendor">
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-semibold text-on-surface">Payments</h1>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-xs uppercase text-on-surface-variant">Total Paid</p>
            <p className="text-2xl font-bold text-on-surface tnum">{formatCurrency(totalPaid)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase text-on-surface-variant">Payments Count</p>
            <p className="text-2xl font-bold text-on-surface">{invoices.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase text-on-surface-variant">Last Payment</p>
            <p className="text-2xl font-bold text-on-surface">{lastPayment ? formatDate(lastPayment) : '—'}</p>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Invoice #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Date Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Currency</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-outline-variant hover:bg-surface-low/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(inv.payment_date ?? inv.submitted_at)}</td>
                    <td className="px-4 py-3 text-sm font-semibold tnum">{formatCurrency(inv.amount, inv.currency)}</td>
                    <td className="px-4 py-3 text-sm text-on-surface-variant">{inv.currency ?? 'USD'}</td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-on-surface-variant">
                      No payments yet. Invoices marked &quot;Paid&quot; will appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
