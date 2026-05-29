import { useState } from 'react';
import { Search, Download, CheckCircle, Clock, XCircle, Eye, Receipt } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusChip from '../../components/ui/StatusChip';
import { formatCurrency, formatDate } from '../../lib/utils';

const PAYMENTS = [
  { id: 'TXN-0082', invoice: 'INV-2024-001', vendor: 'Acme Global Solutions', country: 'United States', rail: 'ACH', amount: 12450, date: '2024-10-28', status: 'Paid', reference: 'ACH#0001827' },
  { id: 'TXN-0081', invoice: 'INV-2024-003', vendor: 'Starlight IT Systems', country: 'United Kingdom', rail: 'Faster Payments', amount: 8200, date: '2024-10-26', status: 'Paid', reference: 'FPS#220119' },
  { id: 'TXN-0080', invoice: 'INV-2024-006', vendor: 'Delta Creative Agency', country: 'Nigeria', rail: 'NIP', amount: 45000, date: '2024-10-24', status: 'Paid', reference: 'NIP#88241' },
  { id: 'TXN-0079', invoice: 'INV-2024-007', vendor: 'Veld Studios', country: 'South Africa', rail: 'EFT', amount: 1940, date: '2024-10-22', status: 'Paid', reference: 'EFT#33910' },

  { id: 'TXN-0090', invoice: 'INV-2024-008', vendor: 'Savannah Logistics', country: 'Kenya', rail: 'EFT / RTGS', amount: 19900, date: '2024-11-04', status: 'Awaiting Payment', reference: 'Scheduled Nov 14' },
  { id: 'TXN-0091', invoice: 'INV-2024-005', vendor: 'CloudScale AI Solutions', country: 'United States', rail: 'ACH', amount: 4200, date: '2024-11-02', status: 'Awaiting Payment', reference: 'Approval pending' },
  { id: 'TXN-0092', invoice: 'INV-2024-010', vendor: 'Helsinki Data Co.', country: 'Eurozone', rail: 'SEPA', amount: 22400, date: '2024-11-05', status: 'Awaiting Payment', reference: 'Scheduled Nov 18' },

  { id: 'TXN-0070', invoice: 'INV-2024-009', vendor: 'Maple Freight Ltd.', country: 'Canada', rail: 'EFT', amount: 8320, date: '2024-10-18', status: 'Denied', reference: 'Account verification failed' },
  { id: 'TXN-0071', invoice: 'INV-2024-004', vendor: 'Boulder Manufacturing', country: 'United States', rail: 'ACH', amount: 6100, date: '2024-10-12', status: 'Denied', reference: 'Duplicate submission' },
];

const TABS = [
  { key: 'Paid', label: 'Paid', icon: CheckCircle, accent: 'text-emerald', chipBg: 'bg-emerald/10 text-emerald' },
  { key: 'Awaiting Payment', label: 'Awaiting Payment', icon: Clock, accent: 'text-amber-600', chipBg: 'bg-amber-100 text-amber-700' },
  { key: 'Denied', label: 'Denied', icon: XCircle, accent: 'text-error', chipBg: 'bg-error/10 text-error' },
];

export default function AdminPayments() {
  const [activeTab, setActiveTab] = useState('Paid');
  const [search, setSearch] = useState('');

  const counts = PAYMENTS.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});
  const totals = PAYMENTS.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + p.amount;
    return acc;
  }, {});

  const filtered = PAYMENTS.filter((p) => {
    if (p.status !== activeTab) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.vendor.toLowerCase().includes(q) ||
      p.invoice.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.country.toLowerCase().includes(q)
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

        <div className="grid grid-cols-3 gap-4">
          {TABS.map(({ key, label, icon: Icon, accent }) => (
            <Card key={key}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{label}</p>
                <Icon size={16} className={accent} />
              </div>
              <p className="text-2xl font-bold tnum text-on-surface mt-1">{counts[key] ?? 0}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Total {formatCurrency(totals[key] ?? 0)}
              </p>
            </Card>
          ))}
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="flex border-b border-outline-variant">
            {TABS.map(({ key, label, icon: Icon }) => {
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                    active
                      ? 'border-emerald text-emerald bg-emerald/5'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                  <span className="text-xs bg-surface-container px-1.5 py-0.5 rounded-full text-on-surface-variant">
                    {counts[key] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by vendor, invoice, or transaction..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-surface-low rounded border border-outline-variant focus:outline-none focus:ring-2 focus:ring-emerald"
              />
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="bg-surface-low border-b border-outline-variant">
                {['Vendor', 'Invoice', 'Country / Rail', 'Amount', activeTab === 'Denied' ? 'Reason' : activeTab === 'Awaiting Payment' ? 'Schedule' : 'Reference', 'Date', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-surface-low/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-on-surface">{p.vendor}</p>
                    <p className="text-xs text-on-surface-variant">TXN #{p.id}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{p.invoice}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-on-surface">{p.country}</p>
                    <p className="text-xs text-on-surface-variant">{p.rail}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold tnum text-on-surface">{formatCurrency(p.amount)}</td>
                  <td className={`px-6 py-4 text-sm ${p.status === 'Denied' ? 'text-error font-medium' : 'text-on-surface-variant'}`}>
                    {p.reference}
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{formatDate(p.date)}</td>
                  <td className="px-6 py-4">
                    <StatusChip status={p.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="p-1.5" title="View detail">
                        <Eye size={15} />
                      </Button>
                      {p.status === 'Paid' && (
                        <Button variant="ghost" size="sm" className="p-1.5" title="Receipt">
                          <Receipt size={15} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-on-surface-variant">
                    No {activeTab.toLowerCase()} payments match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="px-6 py-3 border-t border-outline-variant flex items-center justify-between">
            <p className="text-xs text-on-surface-variant">
              Showing {filtered.length} of {counts[activeTab] ?? 0} {activeTab.toLowerCase()} payments
            </p>
            <p className="text-xs font-semibold tnum text-on-surface">
              Total {formatCurrency(filtered.reduce((s, p) => s + p.amount, 0))}
            </p>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
