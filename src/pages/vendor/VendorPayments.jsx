import { useInvoices } from '../../lib/invoiceStore';
import { formatCurrency, formatDate } from '../../lib/utils';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';

export default function Payments() {
  const { invoices } = useInvoices();

  // Only show paid invoices as payments
  const paidInvoices = invoices.filter(inv => inv.status === 'Paid');

  // Calculate totals
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <AppLayout role="vendor">
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-semibold text-on-surface">Payments</h1>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-xs uppercase text-on-surface-variant">Total Paid</p>
            <p className="text-2xl font-bold text-on-surface">${totalPaid.toLocaleString()}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase text-on-surface-variant">Payments Count</p>
            <p className="text-2xl font-bold text-on-surface">{paidInvoices.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase text-on-surface-variant">Last Payment</p>
            <p className="text-2xl font-bold text-on-surface">
              {paidInvoices[0] ? formatDate(paidInvoices[0].date) : '—'}
            </p>
          </Card>
        </div>

        {/* Payments table */}
        <Card className="p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-low border-b border-outline-variant">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Date Paid</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Method</th>
              </tr>
            </thead>
            <tbody>
              {paidInvoices.map(inv => (
                <tr key={inv.id} className="border-b border-outline-variant">
                  <td className="px-4 py-3 text-sm">{inv.id}</td>
                  <td className="px-4 py-3 text-sm">{formatDate(inv.date)}</td>
                  <td className="px-4 py-3 text-sm font-semibold">
                    {formatCurrency(inv.amount, inv.currency)}
                  </td>
                  <td className="px-4 py-3 text-sm">ACH</td>
                </tr>
              ))}
              {paidInvoices.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-on-surface-variant">
                    No payments yet. Invoices marked "Paid" will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </AppLayout>
  );
}