import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ChevronLeft, ChevronRight, SlidersHorizontal, Zap } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import StatusChip from '../../components/ui/StatusChip';
import { formatCurrency, formatDate } from '../../lib/utils';

const INVOICES = [
  { id: 'INV-2024-001', vendor: 'Acme Global Solutions', dept: 'Engineering', date: '2023-10-24', amount: 12450, status: 'Awaiting Payment' },
  { id: 'INV-2024-002', vendor: 'Starlight IT Systems', dept: 'IT Ops', date: '2023-10-23', amount: 4120, status: 'Pending Review' },
  { id: 'INV-2024-003', vendor: 'Delta Creative Agency', dept: 'Marketing', date: '2023-10-22', amount: 8900, status: 'Paid' },
  { id: 'INV-2024-004', vendor: 'Global Logistics Group', dept: 'Supply Chain', date: '2023-10-20', amount: 21000, status: 'Pending Review' },
];

const TABS = ['All Invoices', 'Pending Review', 'Awaiting Payment', 'Paid'];

export default function AdminInvoiceManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All Invoices');
  const [vendor, setVendor] = useState('');
  const [department, setDepartment] = useState('');
  const [selected, setSelected] = useState([]);

  const filtered = INVOICES.filter((inv) => {
    const matchTab =
      activeTab === 'All Invoices' ||
      inv.status === activeTab;
    const matchVendor = !vendor || vendor === 'All Vendors' || inv.vendor === vendor;
    const matchDept = !department || department === 'All Departments' || inv.dept === department;
    return matchTab && matchVendor && matchDept;
  });

  function toggleSelect(id) {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }

  function toggleAll() {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((i) => i.id));
  }

  return (
    <AppLayout role="admin" searchPlaceholder="Search invoices, vendors, or IDs...">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">Manage Invoices</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">Audit, approve, and track enterprise vendor payments.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              Bulk Actions ▾
            </Button>
            <Button size="sm">
              <Download size={14} /> Export CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {/* Filters + table */}
          <div className="col-span-3 space-y-4">
            {/* Advanced filters */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal size={15} className="text-on-surface-variant" />
                <span className="text-sm font-semibold text-on-surface">Advanced Filters</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Select label="Vendor" value={vendor} onChange={(e) => setVendor(e.target.value)}>
                  <option>All Vendors</option>
                  {INVOICES.map((i) => <option key={i.vendor}>{i.vendor}</option>)}
                </Select>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">Amount Range</label>
                  <div className="flex items-center gap-2">
                    <input placeholder="Min" className="flex-1 rounded border border-outline-variant bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald" />
                    <span className="text-on-surface-variant">–</span>
                    <input placeholder="Max" className="flex-1 rounded border border-outline-variant bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald" />
                  </div>
                </div>
                <Select label="Department" value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option>All Departments</option>
                  <option>Engineering</option>
                  <option>IT Ops</option>
                  <option>Marketing</option>
                  <option>Supply Chain</option>
                  <option>Finance</option>
                </Select>
              </div>
            </Card>

            {/* Table */}
            <Card className="p-0 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-outline-variant">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'text-emerald border-b-2 border-emerald -mb-px'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <table className="w-full">
                <thead>
                  <tr className="bg-surface-low border-b border-outline-variant">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.length === filtered.length && filtered.length > 0}
                        onChange={toggleAll}
                        className="accent-emerald"
                      />
                    </th>
                    {['Vendor Name', 'Invoice #', 'Date', 'Amount', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {filtered.map((inv) => (
                    <tr key={inv.id} className="hover:bg-surface-low/50 transition-colors">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selected.includes(inv.id)}
                          onChange={() => toggleSelect(inv.id)}
                          className="accent-emerald"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-on-surface">{inv.vendor}</p>
                        <p className="text-xs text-on-surface-variant">{inv.dept}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-on-surface-variant">{inv.id}</td>
                      <td className="px-4 py-4 text-sm text-on-surface-variant">{formatDate(inv.date)}</td>
                      <td className="px-4 py-4 text-sm font-semibold tnum text-on-surface">{formatCurrency(inv.amount)}</td>
                      <td className="px-4 py-4">
                        <StatusChip status={inv.status} />
                      </td>
                      <td className="px-4 py-4">
                        {inv.status === 'Paid' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/invoices/${inv.id}`)}
                          >
                            View Details
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => navigate(`/admin/invoices/${inv.id}`)}
                          >
                            Review
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center justify-between px-5 py-3 border-t border-outline-variant">
                <p className="text-xs text-on-surface-variant">Showing {filtered.length} of 128 invoices</p>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant">
                    <ChevronLeft size={15} />
                  </button>
                  {[1, 2, 3].map((p) => (
                    <button
                      key={p}
                      className={`w-7 h-7 rounded text-xs font-medium ${p === 1 ? 'bg-navy text-white' : 'text-on-surface-variant hover:bg-surface-container'}`}
                    >
                      {p}
                    </button>
                  ))}
                  <button className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant">
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right stats */}
          <div className="space-y-4">
            <Card className="bg-navy text-white border-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Review Pending</p>
              <p className="text-4xl font-bold">24</p>
            </Card>
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1">Total Volume</p>
              <p className="text-2xl font-bold tnum text-on-surface">$1.2M</p>
            </Card>
            <Card className="bg-emerald text-white border-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-light mb-1">Avg. Processing Time</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold">2.4 Days</p>
                <Zap size={18} className="text-emerald-light mb-0.5" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
