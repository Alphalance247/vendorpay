import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Search, Filter, Download, Eye, X, Loader2 } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusChip from '../../components/ui/StatusChip';
import { formatCurrency, formatDate, extractErrorMessage } from '../../lib/utils';
import { invoiceService } from '../../lib/services/invoiceService';

const trendData = [
  { month: 'Jun', invoiced: 18000, settled: 12000 },
  { month: 'Jul', invoiced: 22000, settled: 19000 },
  { month: 'Aug', invoiced: 31000, settled: 28000 },
  { month: 'Sep', invoiced: 28000, settled: 27000 },
  { month: 'Oct', invoiced: 43000, settled: 38000 },
];

export default function InvoiceHistory() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchInvoices = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await invoiceService.getMyInvoices({
        status: statusFilter !== 'All' ? statusFilter.toLowerCase() : undefined,
        search: search || undefined,
      });
      setInvoices(Array.isArray(data) ? data : (data.invoices ?? data.items ?? data.data ?? []));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, search]);

  const filtered = invoices.filter((inv) => {
    const matchSearch = inv.id?.toLowerCase().includes(search.toLowerCase()) || 
                        inv.invoice_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <AppLayout role="vendor">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">Invoice History</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">Review and manage your accounts receivable and outgoing billing.</p>
          </div>
          <Button onClick={() => navigate('/vendorpay/vendor/invoices/new')}>
            + Submit New Invoice
          </Button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Outstanding', value: '$127,500.00', sub: '+32% vs last month', subColor: 'text-emerald' },
            { label: 'Paid This Month', value: '$84,200.00', sub: 'On track', subColor: 'text-emerald' },
            { label: 'Overdue', value: '$12,400.00', sub: '3 invoices', subColor: 'text-error' },
            { label: 'Vendor Rating', value: '98.4%', sub: 'Excellent payment health', subColor: 'text-emerald' },
          ].map(({ label, value, sub, subColor }) => (
            <Card key={label} className="py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{label}</p>
              <p className="text-xl font-bold text-on-surface mt-1 tnum">{value}</p>
              <p className={`text-xs mt-0.5 ${subColor}`}>{sub}</p>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoice # or vendor..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-surface-low rounded border border-outline-variant focus:outline-none focus:ring-2 focus:ring-emerald"
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Status</span>
              {['All', 'Paid', 'InProgress', 'Submitted', 'Flagged'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    statusFilter === s
                      ? 'border-navy bg-navy text-white'
                      : 'border-outline-variant text-on-surface-variant hover:bg-surface-low'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button className="flex items-center gap-1.5 text-xs text-on-surface-variant border border-outline-variant px-3 py-1.5 rounded hover:bg-surface-low transition-colors">
                <Filter size={12} /> Jan 1, 2024 – Dec 31, 2024
              </button>
              <button 
                onClick={() => { setSearch(''); setStatusFilter('All'); }}
                className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface"
              >
                <X size={12} /> Clear Filters
              </button>
            </div>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-emerald" />
              <span className="ml-2 text-sm text-on-surface-variant">Loading invoices...</span>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-surface-low border-b border-outline-variant">
                  {['Invoice #', 'Date', 'Due Date', 'Amount', 'Status', 'Payment Date', 'Action'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-on-surface-variant">
                      No invoices found.
                    </td>
                  </tr>
                )}
                {filtered.map((inv) => (
                  <tr key={inv.id || inv.invoice_number} className="hover:bg-surface-low/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-on-surface">
                      {inv.id || inv.invoice_number}
                      {inv.file_name && (
                        <span className="block text-xs font-normal text-on-surface-variant mt-0.5 truncate max-w-[200px]">{inv.file_name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{formatDate(inv.date || inv.created_at)}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{inv.due_date ? formatDate(inv.due_date) : '—'}</td>
                    <td className="px-6 py-4 text-sm font-semibold tnum text-on-surface">{formatCurrency(inv.amount, inv.currency || 'USD')}</td>
                    <td className="px-6 py-4">
                      <StatusChip status={inv.status === 'InProgress' ? 'Awaiting Payment' : inv.status} />
                    </td>
                    <td className={`px-6 py-4 text-sm ${inv.payment_date === 'Payment Delayed' || inv.payment_date === null ? 'text-error font-medium' : 'text-on-surface-variant'}`}>
                      {inv.payment_date || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/vendorpay/vendor/invoices/${inv.id || inv.invoice_number}`)} className="p-1.5">
                          <Eye size={15} />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-1.5">
                          <Download size={15} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="px-6 py-3 border-t border-outline-variant flex items-center justify-between">
            <p className="text-xs text-on-surface-variant">Showing {filtered.length} of {invoices.length} invoices</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                    p === 1 ? 'bg-navy text-white' : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Bottom row */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-on-surface">Payment Trends</h3>
              <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-navy inline-block" />Invoiced</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald inline-block" />Settled</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={trendData} barGap={4} margin={{ left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#74777c' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#74777c' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #c4c6cc' }} />
                <Bar dataKey="invoiced" fill="#0f1d29" radius={[4, 4, 0, 0]} />
                <Bar dataKey="settled" fill="#6cf8bb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="bg-navy text-white border-0 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-light mb-2">Instant Settle</p>
              <p className="text-sm font-semibold mb-1">Need liquidity now?</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                Convert your outstanding invoices to cash instantly for a flat 1.5% fee.
              </p>
            </div>
            <Button variant="emerald" size="sm" className="mt-4 self-start">
              Apply Now
            </Button>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}