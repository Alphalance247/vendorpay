import { useState } from 'react';
import { Search, Plus, Filter, Eye, MoreHorizontal } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusChip from '../../components/ui/StatusChip';
import { formatCurrency } from '../../lib/utils';

const VENDORS = [
  { id: 'V-0001', name: 'Acme Global Solutions', contact: 'Alex Sterling', email: 'alex@acme.io', country: 'United States', rail: 'ACH', status: 'Approved', invoices: 24, volume: 184500, onboarded: '2023-04-12' },
  { id: 'V-0002', name: 'Starlight IT Systems', contact: 'Priya Menon', email: 'priya@starlight.co.uk', country: 'United Kingdom', rail: 'Faster Payments', status: 'Approved', invoices: 11, volume: 56200, onboarded: '2023-07-22' },
  { id: 'V-0003', name: 'Delta Creative Agency', contact: 'Maya Okafor', email: 'maya@deltacreative.ng', country: 'Nigeria', rail: 'NIP', status: 'Approved', invoices: 18, volume: 74800, onboarded: '2023-09-03' },
  { id: 'V-0004', name: 'Savannah Logistics', contact: 'Daniel Kimani', email: 'daniel@savannah.ke', country: 'Kenya', rail: 'EFT / RTGS', status: 'Approved', invoices: 9, volume: 41200, onboarded: '2024-01-15' },
  { id: 'V-0005', name: 'Boulder Manufacturing', contact: 'Sam Wright', email: 'sam@boulder.co', country: 'United States', rail: 'ACH', status: 'Pending Review', invoices: 0, volume: 0, onboarded: '2024-10-22' },
  { id: 'V-0006', name: 'Veld Studios', contact: 'Nomvula Dlamini', email: 'nomvula@veld.co.za', country: 'South Africa', rail: 'EFT', status: 'Approved', invoices: 7, volume: 28900, onboarded: '2024-03-08' },
  { id: 'V-0007', name: 'CloudScale AI Solutions', contact: 'Jordan Lee', email: 'jordan@cloudscale.ai', country: 'United States', rail: 'ACH', status: 'Pending Review', invoices: 0, volume: 0, onboarded: '2024-11-04' },
  { id: 'V-0008', name: 'Helsinki Data Co.', contact: 'Aino Virtanen', email: 'aino@helsinkidata.fi', country: 'Eurozone (SEPA)', rail: 'SEPA', status: 'Approved', invoices: 5, volume: 22400, onboarded: '2024-05-29' },
  { id: 'V-0009', name: 'Maple Freight Ltd.', contact: 'Robin Tremblay', email: 'robin@maplefreight.ca', country: 'Canada', rail: 'EFT', status: 'Flagged', invoices: 3, volume: 9800, onboarded: '2024-02-11' },
];

const STATUSES = ['All', 'Approved', 'Pending Review', 'Flagged'];

export default function AdminVendors() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = VENDORS.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.contact.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q) ||
      v.country.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totals = VENDORS.reduce(
    (acc, v) => {
      acc.volume += v.volume;
      if (v.status === 'Pending Review') acc.pending += 1;
      if (v.status === 'Approved') acc.approved += 1;
      return acc;
    },
    { volume: 0, pending: 0, approved: 0 }
  );

  return (
    <AppLayout role="admin" searchPlaceholder="Search vendors, invoices, or transactions...">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">Vendors</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">Manage your supplier base across regions and payment rails.</p>
          </div>
          <Button size="sm">
            <Plus size={14} /> Add Vendor
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Vendors', value: VENDORS.length, sub: 'Across all regions', subColor: 'text-on-surface-variant' },
            { label: 'Active', value: totals.approved, sub: 'Approved & disbursing', subColor: 'text-emerald' },
            { label: 'Pending Review', value: totals.pending, sub: 'Awaiting onboarding', subColor: 'text-error' },
            { label: 'Lifetime Volume', value: formatCurrency(totals.volume), sub: 'Paid to date', subColor: 'text-on-surface-variant' },
          ].map(({ label, value, sub, subColor }) => (
            <Card key={label}>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{label}</p>
              <p className="text-2xl font-bold mt-1 tnum text-on-surface">{value}</p>
              <p className={`text-xs mt-0.5 ${subColor}`}>{sub}</p>
            </Card>
          ))}
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, contact, country..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-surface-low rounded border border-outline-variant focus:outline-none focus:ring-2 focus:ring-emerald"
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Status</span>
              {STATUSES.map((s) => (
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
            <button className="flex items-center gap-1.5 text-xs text-on-surface-variant border border-outline-variant px-3 py-1.5 rounded hover:bg-surface-low transition-colors ml-auto">
              <Filter size={12} /> More Filters
            </button>
          </div>

          <table className="w-full">
            <thead>
              <tr className="bg-surface-low border-b border-outline-variant">
                {['Vendor', 'Country / Rail', 'Status', 'Invoices', 'Lifetime Volume', 'Action'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-surface-low/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-on-surface">{v.name}</p>
                    <p className="text-xs text-on-surface-variant">{v.contact} · {v.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-on-surface">{v.country}</p>
                    <p className="text-xs text-on-surface-variant">{v.rail}</p>
                  </td>
                  <td className="px-6 py-4">
                    <StatusChip status={v.status} />
                  </td>
                  <td className="px-6 py-4 text-sm tnum text-on-surface">{v.invoices}</td>
                  <td className="px-6 py-4 text-sm font-semibold tnum text-on-surface">{formatCurrency(v.volume)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="p-1.5">
                        <Eye size={15} />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-1.5">
                        <MoreHorizontal size={15} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-on-surface-variant">
                    No vendors match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="px-6 py-3 border-t border-outline-variant flex items-center justify-between">
            <p className="text-xs text-on-surface-variant">Showing {filtered.length} of {VENDORS.length} vendors</p>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
