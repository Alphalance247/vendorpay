import { useNavigate } from 'react-router-dom';
import { Users, Search, ArrowRight } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import StatusChip from '../../components/ui/StatusChip';
import { useInvoices } from '../../lib/invoiceStore';

const VENDORS = [
  { id: 'VND-001', name: 'Acme Global Solutions', status: 'Active', invoices: 12, total: 124500, pending: 2 },
  { id: 'VND-002', name: 'Starlight IT Systems', status: 'Active', invoices: 8, total: 45000, pending: 1 },
  { id: 'VND-003', name: 'Delta Creative Agency', status: 'Flagged', invoices: 5, total: 32000, pending: 3 },
  { id: 'VND-004', name: 'Global Logistics Group', status: 'Active', invoices: 15, total: 210000, pending: 0 },
  { id: 'VND-005', name: 'Nexus Global Logistics', status: 'Active', invoices: 3, total: 37450, pending: 1 },
];

export default function AdminVendors() {
  const navigate = useNavigate();
  const { invoices } = useInvoices();

  // Link real invoices to vendors by matching vendor name
  const vendorsWithInvoices = VENDORS.map(vendor => ({
    ...vendor,
    realInvoices: invoices.filter(inv => inv.vendor === vendor.name || inv.id.includes(vendor.id)),
  }));

  return (
    <AppLayout role="admin" searchPlaceholder="Search vendors...">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Vendor Management</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">View and manage all registered vendors and their invoice history.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-xs uppercase text-on-surface-variant">Total Vendors</p>
            <p className="text-2xl font-bold text-on-surface">{VENDORS.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase text-on-surface-variant">Active</p>
            <p className="text-2xl font-bold text-emerald">{VENDORS.filter(v => v.status === 'Active').length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase text-on-surface-variant">Flagged</p>
            <p className="text-2xl font-bold text-error">{VENDORS.filter(v => v.status === 'Flagged').length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase text-on-surface-variant">Total Volume</p>
            <p className="text-2xl font-bold text-on-surface">${VENDORS.reduce((sum, v) => sum + v.total, 0).toLocaleString()}</p>
          </Card>
        </div>

        {/* Vendors Table */}
        <Card className="p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-low border-b border-outline-variant">
                {['Vendor ID', 'Vendor Name', 'Status', 'Invoices', 'Total Volume', 'Pending', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {vendorsWithInvoices.map((vendor) => (
                <tr 
                  key={vendor.id} 
                  className="hover:bg-surface-low/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/vendors/${vendor.id}`)}
                >
                  <td className="px-4 py-4 text-sm font-medium text-on-surface">{vendor.id}</td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-on-surface">{vendor.name}</p>
                  </td>
                  <td className="px-4 py-4">
                    <StatusChip status={vendor.status} />
                  </td>
                  <td className="px-4 py-4 text-sm text-on-surface-variant">{vendor.invoices}</td>
                  <td className="px-4 py-4 text-sm font-semibold tnum text-on-surface">${vendor.total.toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <span className={`text-sm font-medium ${vendor.pending > 0 ? 'text-error' : 'text-emerald'}`}>
                      {vendor.pending}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button className="flex items-center gap-1 text-xs text-emerald hover:underline">
                      View Details <ArrowRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AppLayout>
  );
}