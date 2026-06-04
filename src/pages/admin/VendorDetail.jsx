import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Download, Eye } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusChip from '../../components/ui/StatusChip';
import { useInvoices } from '../../lib/invoiceStore';
import { formatCurrency, formatDate } from '../../lib/utils';

const VENDORS = [
  { id: 'VND-001', name: 'Acme Global Solutions', status: 'Active', contact: 'john@acme.com', phone: '+1 (555) 000-0001', address: '123 Main St, New York, NY 10001' },
  { id: 'VND-002', name: 'Starlight IT Systems', status: 'Active', contact: 'sarah@starlight.com', phone: '+1 (555) 000-0002', address: '456 Tech Blvd, San Francisco, CA 94105' },
  { id: 'VND-003', name: 'Delta Creative Agency', status: 'Flagged', contact: 'mike@delta.com', phone: '+1 (555) 000-0003', address: '789 Design Ave, Chicago, IL 60601' },
  { id: 'VND-004', name: 'Global Logistics Group', status: 'Active', contact: 'lisa@global.com', phone: '+1 (555) 000-0004', address: '321 Freight Way, Houston, TX 77001' },
  { id: 'VND-005', name: 'Nexus Global Logistics', status: 'Active', contact: 'alex@nexus.com', phone: '+1 (555) 000-0005', address: '1121 Logistics Way, Chicago, IL 60607' },
];

export default function VendorDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { invoices } = useInvoices();

  // Find vendor by ID
  const vendor = VENDORS.find(v => v.id === id);

  if (!vendor) {
    return (
      <AppLayout role="admin">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-lg text-on-surface">Vendor not found</p>
          <Button onClick={() => navigate('/admin/vendors')}>Back to Vendors</Button>
        </div>
      </AppLayout>
    );
  }

  // Filter invoices for this vendor (match by vendor name or vendor ID in invoice)
  const vendorInvoices = invoices.filter(inv => 
    inv.vendor === vendor.name || 
    (inv.fileName && inv.fileName.includes(vendor.name.split(' ')[0].toLowerCase()))
  );

  // Stats
  const totalInvoiced = vendorInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidInvoices = vendorInvoices.filter(inv => inv.status === 'Paid');
  const pendingInvoices = vendorInvoices.filter(inv => inv.status === 'Awaiting Payment' || inv.status === 'InProgress');
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <AppLayout role="admin" searchPlaceholder="Search invoices...">
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/admin/vendors')}
          className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft size={15} /> Back to Vendors
        </button>

        {/* Vendor Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wide">Vendor ID: {vendor.id}</p>
            <h1 className="text-2xl font-semibold text-on-surface mt-0.5">{vendor.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <StatusChip status={vendor.status} />
              <span className="text-xs text-on-surface-variant">{vendor.contact}</span>
              <span className="text-xs text-on-surface-variant">{vendor.phone}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              <Download size={14} /> Export Report
            </Button>
            <Button size="sm">Edit Vendor</Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-xs uppercase text-on-surface-variant">Total Invoices</p>
            <p className="text-2xl font-bold text-on-surface">{vendorInvoices.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase text-on-surface-variant">Total Invoiced</p>
            <p className="text-2xl font-bold text-on-surface">{formatCurrency(totalInvoiced)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase text-on-surface-variant">Total Paid</p>
            <p className="text-2xl font-bold text-emerald">{formatCurrency(totalPaid)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase text-on-surface-variant">Pending</p>
            <p className="text-2xl font-bold text-error">{pendingInvoices.length}</p>
          </Card>
        </div>

        {/* Invoice Breakdown Table */}
        <Card className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between">
            <p className="text-sm font-semibold text-on-surface">Invoice Breakdown</p>
            <p className="text-xs text-on-surface-variant">{vendorInvoices.length} invoices found</p>
          </div>
          
          <table className="w-full">
            <thead>
              <tr className="bg-surface-low border-b border-outline-variant">
                {['Invoice #', 'Date', 'Due Date', 'Amount', 'Currency', 'Status', 'Payment Date', 'File', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {vendorInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-surface-low/50 transition-colors">
                  <td className="px-4 py-4 text-sm font-semibold text-on-surface">{inv.id}</td>
                  <td className="px-4 py-4 text-sm text-on-surface-variant">{formatDate(inv.date)}</td>
                  <td className="px-4 py-4 text-sm text-on-surface-variant">{inv.dueDate ? formatDate(inv.dueDate) : '—'}</td>
                  <td className="px-4 py-4 text-sm font-semibold tnum text-on-surface">{formatCurrency(inv.amount, inv.currency)}</td>
                  <td className="px-4 py-4 text-sm text-on-surface-variant">{inv.currency}</td>
                  <td className="px-4 py-4">
                    <StatusChip status={inv.status === 'InProgress' ? 'Awaiting Payment' : inv.status} />
                  </td>
                  <td className="px-4 py-4 text-sm text-on-surface-variant">{inv.paymentDate}</td>
                  <td className="px-4 py-4 text-sm text-on-surface-variant">
                    {inv.fileName ? (
                      <span className="flex items-center gap-1">
                        <FileText size={12} className="text-emerald" />
                        {inv.fileName}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate(`/admin/invoices/${inv.id}`)}
                      className="p-1.5"
                    >
                      <Eye size={15} />
                    </Button>
                  </td>
                </tr>
              ))}
              {vendorInvoices.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-on-surface-variant">
                    No invoices found for this vendor. Invoices will appear here once submitted.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>

        {/* Vendor Info Card */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-3">Contact Information</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Email</span>
                <span className="text-on-surface font-medium">{vendor.contact}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Phone</span>
                <span className="text-on-surface font-medium">{vendor.phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Address</span>
                <span className="text-on-surface font-medium text-right">{vendor.address}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-3">Payment Summary</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Payment Method</span>
                <span className="text-on-surface font-medium">ACH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Payment Terms</span>
                <span className="text-on-surface font-medium">Net 30</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Last Payment</span>
                <span className="text-on-surface font-medium">
                  {paidInvoices.length > 0 ? formatDate(paidInvoices[0].date) : '—'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}