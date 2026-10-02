import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Download, Eye, Landmark, Loader2, Power, PowerOff, Trash2, XCircle } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusChip from '../../components/ui/StatusChip';
import RejectModal from '../../components/ui/RejectModal';
import { vendorService } from '../../lib/services/vendorService';
import { adminInvoiceService } from '../../lib/services/invoiceService';
import { formatCurrency, formatDate, maskAccountNumber } from '../../lib/utils';
import { useConfirm } from '../../hooks/useConfirm';
import { useToast } from '../../components/ui/Toast';

const BANKING_STATUS_LABEL = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

// TEMP: the backend doesn't populate banking fields on the vendor record
// yet, so this stands in for a submitted bank account during UI testing.
// Only fills in fields the real record doesn't already have — remove once
// the backend actually returns these.
const DUMMY_BANKING_DETAILS = {
  bank_name: 'Chase Bank',
  account_name: 'Acme Corp Ltd',
  account_type: 'Checking',
  account_number: '0021457893',
  routing_number: '021000021',
  swift_code: 'CHASUS33',
};

export default function VendorDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const { confirm, confirmEl } = useConfirm();
  const { toast } = useToast();
  const [vendor, setVendor] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  // Banking review is a UI simulation for now — there's no backend status
  // field or approve/reject endpoint yet, so this lives in local state only
  // and resets on refresh.
  const [bankingStatus, setBankingStatus] = useState(null);
  const [bankingReason, setBankingReason] = useState('');
  const [bankingActionLoading, setBankingActionLoading] = useState('');
  const [bankingRejectOpen, setBankingRejectOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      vendorService.getVendorById(id),
      adminInvoiceService.getAllInvoices({ vendor_id: id, page_size: 50 }),
    ])
      .then(([vendorData, invoiceData]) => {
        const vendorWithBanking = {
          ...vendorData,
          bank_name: vendorData.bank_name ?? DUMMY_BANKING_DETAILS.bank_name,
          account_name: vendorData.account_name ?? DUMMY_BANKING_DETAILS.account_name,
          account_type: vendorData.account_type ?? DUMMY_BANKING_DETAILS.account_type,
          account_number: vendorData.account_number ?? DUMMY_BANKING_DETAILS.account_number,
          routing_number: vendorData.routing_number ?? DUMMY_BANKING_DETAILS.routing_number,
          swift_code: vendorData.swift_code ?? DUMMY_BANKING_DETAILS.swift_code,
        };
        setVendor(vendorWithBanking);
        setBankingStatus(vendorWithBanking.account_number ? 'pending' : null);
        const items = Array.isArray(invoiceData)
          ? invoiceData
          : (invoiceData.items ?? invoiceData.invoices ?? invoiceData.data ?? []);
        setInvoices(items);
      })
      .catch(() => setLoadError('Failed to load vendor details.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleToggleStatus() {
    setActionLoading('status');
    try {
      const updated = await vendorService.updateVendorStatus(id, !vendor.is_active);
      setVendor(updated);
    } catch {
      setActionError('Failed to update vendor status.');
    } finally {
      setActionLoading('');
    }
  }

  async function handleDelete() {
    const displayName = vendor.company_name || vendor.user_email || `Vendor #${id}`;
    const ok = await confirm({
      title: 'Delete Vendor',
      message: `Delete "${displayName}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    setActionLoading('delete');
    try {
      await vendorService.deleteVendor(id);
      navigate('/admin/vendors');
    } catch (err) {
      const msg = err?.response?.data?.detail ?? 'Failed to delete vendor.';
      setActionError(msg);
      setActionLoading('');
    }
  }

  async function handleApproveBanking() {
    const ok = await confirm({
      title: 'Approve Banking Details',
      message: "Approve these banking details? The vendor's future payouts will be sent to this account.",
      confirmLabel: 'Approve',
      variant: 'approve',
    });
    if (!ok) return;
    setBankingActionLoading('approve');
    setTimeout(() => {
      setBankingStatus('approved');
      setBankingReason('');
      setBankingActionLoading('');
      toast('Banking details approved.');
    }, 400);
  }

  function handleRejectBanking(reason) {
    setBankingRejectOpen(false);
    setBankingActionLoading('reject');
    setTimeout(() => {
      setBankingStatus('rejected');
      setBankingReason(reason);
      setBankingActionLoading('');
      toast('Banking details rejected.');
    }, 400);
  }

  if (loading) {
    return (
      <AppLayout role="admin">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={28} className="animate-spin text-emerald" />
        </div>
      </AppLayout>
    );
  }

  if (loadError || !vendor) {
    return (
      <AppLayout role="admin">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-lg text-on-surface">Vendor not found</p>
          <Button onClick={() => navigate('/admin/vendors')}>Back to Vendors</Button>
        </div>
      </AppLayout>
    );
  }

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.amount ?? 0), 0);
  const paidInvoices = invoices.filter((inv) => inv.status === 'paid');
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + (inv.amount ?? 0), 0);
  const vendorCurrency = vendor.currency ?? invoices[0]?.currency ?? 'USD';

  return (
    <AppLayout role="admin">
      {confirmEl}
      <RejectModal
        open={bankingRejectOpen}
        title="Reject Banking Details"
        itemLabel="these banking details"
        confirmLabel="Reject Banking Details"
        onConfirm={handleRejectBanking}
        onCancel={() => setBankingRejectOpen(false)}
      />
      <div className="space-y-6">
        <button
          onClick={() => navigate('/admin/vendors')}
          className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft size={15} /> Back to Vendors
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">{vendor.company_name ?? '—'}</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">
              {vendor.industry ?? ''}{vendor.business_type ? ` · ${vendor.business_type}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusChip status={vendor.is_active ? 'Active' : 'Inactive'} />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleToggleStatus}
              disabled={!!actionLoading}
              className="flex items-center gap-1.5"
            >
              {actionLoading === 'status' ? (
                <Loader2 size={13} className="animate-spin" />
              ) : vendor.is_active ? (
                <><PowerOff size={13} /> Deactivate</>
              ) : (
                <><Power size={13} /> Activate</>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={!!actionLoading}
              className="flex items-center gap-1.5 text-error hover:bg-red-50"
            >
              {actionLoading === 'delete' ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              Delete
            </Button>
          </div>
        </div>

        {actionError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {actionError}
            <button onClick={() => setActionError('')} className="ml-2 underline text-xs">Dismiss</button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-3">Contact Information</p>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-on-surface-variant w-24 flex-shrink-0">Name</span>
                <span className="text-on-surface font-medium">{vendor.contact_first_name} {vendor.contact_last_name}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-on-surface-variant w-24 flex-shrink-0">Email</span>
                <span className="text-on-surface">{vendor.contact_email ?? vendor.user_email ?? '—'}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-on-surface-variant w-24 flex-shrink-0">Phone</span>
                <span className="text-on-surface">{vendor.phone ?? '—'}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-on-surface-variant w-24 flex-shrink-0">Job Title</span>
                <span className="text-on-surface">{vendor.job_title ?? '—'}</span>
              </div>
            </div>
          </Card>

          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-3">Business Details</p>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-on-surface-variant w-24 flex-shrink-0">Tax ID</span>
                <span className="text-on-surface font-medium">{vendor.tax_id ?? '—'}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-on-surface-variant w-24 flex-shrink-0">Address</span>
                <span className="text-on-surface">{vendor.business_address ?? '—'}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-on-surface-variant w-24 flex-shrink-0">Website</span>
                <span className="text-on-surface">{vendor.website ?? '—'}</span>
              </div>
            </div>
          </Card>
        </div>

        <Card className={bankingStatus === 'rejected' ? 'border-error/30' : bankingStatus === 'pending' ? 'border-amber/30' : ''}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant flex items-center gap-1.5">
              <Landmark size={12} /> Banking Details
            </p>
            {bankingStatus && <StatusChip status={BANKING_STATUS_LABEL[bankingStatus]} />}
          </div>

          {!bankingStatus ? (
            <p className="text-sm text-on-surface-variant py-2">No banking details submitted yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-on-surface-variant w-36 flex-shrink-0">Bank Name</span>
                  <span className="text-on-surface font-medium">{vendor.bank_name ?? '—'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-on-surface-variant w-36 flex-shrink-0">Account Name</span>
                  <span className="text-on-surface">{vendor.account_name ?? '—'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-on-surface-variant w-36 flex-shrink-0">Account Type</span>
                  <span className="text-on-surface">{vendor.account_type ?? '—'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-on-surface-variant w-36 flex-shrink-0">Account Number</span>
                  <span className="text-on-surface tnum">{maskAccountNumber(vendor.account_number)}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-on-surface-variant w-36 flex-shrink-0">Routing / Sort / Branch</span>
                  <span className="text-on-surface">{vendor.routing_number ?? '—'}</span>
                </div>
                {vendor.swift_code && (
                  <div className="flex gap-2">
                    <span className="text-on-surface-variant w-36 flex-shrink-0">SWIFT / BIC</span>
                    <span className="text-on-surface">{vendor.swift_code}</span>
                  </div>
                )}
                {vendor.iban && (
                  <div className="flex gap-2">
                    <span className="text-on-surface-variant w-36 flex-shrink-0">IBAN</span>
                    <span className="text-on-surface">{vendor.iban}</span>
                  </div>
                )}
              </div>

              {bankingStatus === 'rejected' && bankingReason && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <span className="font-medium">Rejection reason:</span> {bankingReason}
                </div>
              )}

              {bankingStatus === 'pending' && (
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    onClick={handleApproveBanking}
                    disabled={!!bankingActionLoading}
                    className="flex items-center gap-1.5"
                  >
                    {bankingActionLoading === 'approve' ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBankingRejectOpen(true)}
                    disabled={!!bankingActionLoading}
                    className="flex items-center gap-1.5 text-error hover:bg-red-50"
                  >
                    {bankingActionLoading === 'reject' ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <XCircle size={14} />
                    )}
                    Reject
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <p className="text-xs uppercase text-on-surface-variant">Total Invoices</p>
            <p className="text-2xl font-bold text-on-surface mt-1">{invoices.length}</p>
          </Card>
          <Card>
            <p className="text-xs uppercase text-on-surface-variant">Total Invoiced</p>
            <p className="text-2xl font-bold text-on-surface tnum mt-1">{formatCurrency(totalInvoiced, vendorCurrency)}</p>
          </Card>
          <Card>
            <p className="text-xs uppercase text-on-surface-variant">Total Paid</p>
            <p className="text-2xl font-bold text-on-surface tnum mt-1">{formatCurrency(totalPaid, vendorCurrency)}</p>
          </Card>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-outline-variant">
            <span className="text-sm font-semibold text-on-surface">Invoice History</span>
          </div>
          {invoices.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-on-surface-variant">No invoices submitted yet.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-surface-low border-b border-outline-variant">
                  {['Invoice #', 'Submitted', 'Due Date', 'Amount', 'Status', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-low/50 transition-colors">
                    <td className="px-5 py-4 text-sm font-semibold text-on-surface">{inv.invoice_number}</td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant">{formatDate(inv.submitted_at)}</td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant">{inv.due_date ? formatDate(inv.due_date) : '—'}</td>
                    <td className="px-5 py-4 text-sm font-semibold tnum text-on-surface">{formatCurrency(inv.amount, inv.currency)}</td>
                    <td className="px-5 py-4"><StatusChip status={inv.status} /></td>
                    <td className="px-5 py-4">
                      <Button
                        variant="ghost" size="sm" className="p-1.5"
                        onClick={() => navigate(`/admin/invoices/${inv.id}`)}
                      >
                        <Eye size={15} />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-1.5">
                        <Download size={15} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
