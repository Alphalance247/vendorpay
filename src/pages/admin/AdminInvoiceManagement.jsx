import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ChevronLeft, ChevronRight, SlidersHorizontal, Zap, Loader2 } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import StatusChip from '../../components/ui/StatusChip';
import { formatCurrency, formatDate, extractErrorMessage } from '../../lib/utils';
import { adminInvoiceService } from '../../lib/services/invoiceService';

const TABS = ['All Invoices', 'Pending Review', 'Awaiting Payment', 'Paid'];

export default function AdminInvoiceManagement() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('All Invoices');
  const [vendor, setVendor] = useState('');
  const [department, setDepartment] = useState('');
  const [selected, setSelected] = useState([]);

  const fetchInvoices = async () => {
    setLoading(true);
    setError('');
    try {
      // Map frontend tab names to backend status values
      let statusParam;
      if (activeTab === 'Pending Review') statusParam = 'submitted';
      else if (activeTab === 'Awaiting Payment') statusParam = 'reviewed';
      else if (activeTab === 'Paid') statusParam = 'paid';
      // 'All Invoices' sends no status filter

      const data = await adminInvoiceService.getAllInvoices({
        status: statusParam,
        search: vendor && vendor !== 'All Vendors' ? vendor : undefined,
      });
      setInvoices(Array.isArray(data) ? data : (data.invoices ?? data.items ?? []));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [activeTab]);

  const filtered = invoices.filter((inv) => {
    const matchTab =
      activeTab === 'All Invoices' ||
      inv.status === activeTab ||
      (activeTab === 'Pending Review' && inv.status === 'Submitted') ||
      (activeTab === 'Awaiting Payment' && (inv.status === 'Awaiting Payment' || inv.status === 'reviewed' || inv.status === 'funding')) ||
      (activeTab === 'Paid' && inv.status === 'Paid');
    const matchVendor = !vendor || vendor === 'All Vendors' || inv.vendor === vendor || inv.vendor_name === vendor;
    const matchDept = !department || department === 'All Departments' || inv.dept === department || inv.department === department;
    return matchTab && matchVendor && matchDept;
  });

  function toggleSelect(id) {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }

  function toggleAll() {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((i) => i.id || i.invoice_number));
  }

  async function handleApprove(invoiceId) {
    try {
      await adminInvoiceService.approveInvoice(invoiceId, 'Approved after review');
      fetchInvoices(); // refresh the list
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function handleReject(invoiceId) {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      await adminInvoiceService.rejectInvoice(invoiceId, reason);
      fetchInvoices(); // refresh the list
    } catch (err) {
      setError(extractErrorMessage(err));
    }
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

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}

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
                  {invoices.map((i) => (
                    <option key={i.id || i.invoice_number} value={i.vendor || i.vendor_name}>
                      {i.vendor || i.vendor_name}
                    </option>
                  ))}
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
                      <tr key={inv.id || inv.invoice_number} className="hover:bg-surface-low/50 transition-colors">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selected.includes(inv.id || inv.invoice_number)}
                            onChange={() => toggleSelect(inv.id || inv.invoice_number)}
                            className="accent-emerald"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold text-on-surface">{inv.vendor || inv.vendor_name}</p>
                          <p className="text-xs text-on-surface-variant">{inv.dept || inv.department}</p>
                        </td>
                        <td className="px-4 py-4 text-sm text-on-surface-variant">{inv.id || inv.invoice_number}</td>
                        <td className="px-4 py-4 text-sm text-on-surface-variant">{formatDate(inv.date || inv.created_at)}</td>
                        <td className="px-4 py-4 text-sm font-semibold tnum text-on-surface">{formatCurrency(inv.amount, inv.currency || 'USD')}</td>
                        <td className="px-4 py-4">
                          <StatusChip status={inv.status === 'reviewed' ? 'Awaiting Payment' : inv.status === 'submitted' ? 'Pending Review' : inv.status} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {inv.status === 'submitted' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="emerald"
                                  onClick={() => handleApprove(inv.id || inv.invoice_number)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleReject(inv.id || inv.invoice_number)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {inv.status === 'reviewed' && (
                              <Button
                                size="sm"
                                variant="emerald"
                                onClick={() => handleApprove(inv.id || inv.invoice_number)}
                              >
                                Fund
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/invoices/${inv.id || inv.invoice_number}`)}
                            >
                              View
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="flex items-center justify-between px-5 py-3 border-t border-outline-variant">
                <p className="text-xs text-on-surface-variant">Showing {filtered.length} of {invoices.length} invoices</p>
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
              <p className="text-4xl font-bold">{invoices.filter(i => i.status === 'submitted').length}</p>
            </Card>
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1">Total Volume</p>
              <p className="text-2xl font-bold tnum text-on-surface">
                ${(invoices.reduce((sum, i) => sum + (i.amount || 0), 0) / 1000000).toFixed(1)}M
              </p>
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