import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Loader2, PowerOff, Power, Trash2 } from 'lucide-react';
import TutorialCard from '../../components/ui/TutorialCard';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import StatusChip from '../../components/ui/StatusChip';
import { vendorService } from '../../lib/services/vendorService';
import { useConfirm } from '../../hooks/useConfirm';

export default function AdminVendors() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const { confirm, confirmEl } = useConfirm();

  const loadVendors = () =>
    vendorService.getAllVendors()
      .then(setVendors)
      .catch(() => setError('Failed to load vendors.'))
      .finally(() => setLoading(false));

  useEffect(() => { loadVendors(); }, []);

  async function handleToggleStatus(vendor) {
    setActionLoading(`status-${vendor.id}`);
    try {
      await vendorService.updateVendorStatus(vendor.id, !vendor.is_active);
      setVendors((prev) =>
        prev.map((v) => v.id === vendor.id ? { ...v, is_active: !v.is_active } : v)
      );
    } catch {
      setError('Failed to update vendor status.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(vendor) {
    const displayName = vendor.company_name || vendor.user_email || `Vendor #${vendor.id}`;
    const ok = await confirm({
      title: 'Delete Vendor',
      message: `Delete "${displayName}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    setActionLoading(`delete-${vendor.id}`);
    try {
      await vendorService.deleteVendor(vendor.id);
      setVendors((prev) => prev.filter((v) => v.id !== vendor.id));
    } catch (err) {
      const msg = err?.response?.data?.detail ?? 'Failed to delete vendor.';
      setError(msg);
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = vendors.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.company_name?.toLowerCase().includes(q) ||
      v.contact_email?.toLowerCase().includes(q) ||
      v.user_email?.toLowerCase().includes(q) ||
      v.industry?.toLowerCase().includes(q)
    );
  });

  return (
    <AppLayout role="admin" searchPlaceholder="Search vendors...">
      {confirmEl}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">Vendors</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">Manage all registered vendor accounts.</p>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Users size={16} />
            <span className="text-sm font-medium">{vendors.length} total</span>
          </div>
        </div>

        <TutorialCard
          id="admin-vendors"
          title="Vendor Management"
          description="Oversee all registered vendor accounts and their onboarding status."
          tips={[
            "Active vendors (green badge) can submit invoices; toggle a vendor inactive to suspend their access without deleting them.",
            "Use the search bar to find vendors by company name, email address, or industry.",
            "Click any vendor row to view their full profile, banking details, and complete invoice history.",
            "Deleting a vendor is permanent — deactivate instead unless you are certain the account should be removed.",
          ]}
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
            <button onClick={() => setError('')} className="ml-2 underline text-xs">Dismiss</button>
          </div>
        )}

        <Card className="p-0 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or industry..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-surface-low rounded border border-outline-variant focus:outline-none focus:ring-2 focus:ring-emerald"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-emerald" />
              <span className="ml-2 text-sm text-on-surface-variant">Loading vendors...</span>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-surface-low border-b border-outline-variant">
                  {['Company', 'Contact', 'Industry', 'Status', ''].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-on-surface-variant">
                      No vendors found.
                    </td>
                  </tr>
                )}
                {filtered.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-surface-low/50 transition-colors cursor-pointer" onClick={() => navigate(`/admin/vendors/${vendor.id}`)}>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-on-surface">{vendor.company_name ?? '—'}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{vendor.business_type ?? ''}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-on-surface">
                        {vendor.contact_first_name || vendor.contact_last_name
                          ? `${vendor.contact_first_name ?? ''} ${vendor.contact_last_name ?? ''}`.trim()
                          : '—'}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {vendor.contact_email ?? vendor.user_email ?? '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{vendor.industry ?? '—'}</td>
                    <td className="px-6 py-4">
                      <StatusChip status={vendor.is_active ? 'Active' : 'Inactive'} />
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(vendor)}
                          disabled={actionLoading === `status-${vendor.id}`}
                          title={vendor.is_active ? 'Deactivate vendor' : 'Activate vendor'}
                          className="p-1.5 rounded hover:bg-surface-container transition-colors disabled:opacity-50"
                        >
                          {actionLoading === `status-${vendor.id}` ? (
                            <Loader2 size={14} className="animate-spin text-on-surface-variant" />
                          ) : vendor.is_active ? (
                            <PowerOff size={14} className="text-amber-600" />
                          ) : (
                            <Power size={14} className="text-emerald" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(vendor)}
                          disabled={actionLoading === `delete-${vendor.id}`}
                          title="Delete vendor"
                          className="p-1.5 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === `delete-${vendor.id}` ? (
                            <Loader2 size={14} className="animate-spin text-error" />
                          ) : (
                            <Trash2 size={14} className="text-error" />
                          )}
                        </button>
                      </div>
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
