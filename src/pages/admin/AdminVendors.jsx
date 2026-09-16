import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Users, Search, Loader2, PowerOff, Power, Trash2, UserPlus, Mail } from 'lucide-react';
import TutorialCard from '../../components/ui/TutorialCard';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import StatusChip from '../../components/ui/StatusChip';
import { vendorService } from '../../lib/services/vendorService';
import { useConfirm } from '../../hooks/useConfirm';
import { useToast } from '../../components/ui/Toast';
import { useTeamMembers } from '../../hooks/useQueries/vendorAdmin/useTeamMembers';
import { useCreateInvite } from '../../hooks/useQueries/vendorAdmin/useCreateInvite';
import { useResendInvite } from '../../hooks/useQueries/vendorAdmin/useResendInvite';
import { useDeleteTeamMember } from '../../hooks/useQueries/vendorAdmin/useDeleteTeamMember';

function InviteVendorModal({ open, onClose, onInvite, submitting }) {
  const [email, setEmail] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!valid) return;
    onInvite(email, () => setEmail(''));
  }

  const valid = /\S+@\S+\.\S+/.test(email);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite Vendor"
      subtitle="They'll receive an email invite to join your workspace as a vendor."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!valid || submitting}
            className="flex items-center gap-1.5"
          >
            {submitting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <UserPlus size={15} />
            )}
            {submitting ? 'Sending...' : 'Send Invite'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Vendor Email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vendor@company.com"
          autoFocus
          disabled={submitting}
        />
      </form>
    </Modal>
  );
}

export default function AdminVendors() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const { confirm, confirmEl } = useConfirm();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: team = [] } = useTeamMembers();
  const pendingVendorInvites = team.filter(
    (m) => m.role?.toLowerCase() === 'vendor' && m.status === 'pending',
  );
  const createInvite = useCreateInvite(() => setInviteOpen(false));
  const resendInvite = useResendInvite();
  const deleteInvite = useDeleteTeamMember();

  function handleInviteVendor(email, resetForm) {
    createInvite.mutate(
      { email, role: 'vendor' },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['team-members'] });
          resetForm?.();
        },
      },
    );
  }

  function handleResendInvite(invite) {
    resendInvite.mutate(invite.id, {
      onSuccess: () => {
        toast(`Invitation resent to ${invite.email}.`);
      },
    });
  }

  async function handleCancelInvite(invite) {
    const ok = await confirm({
      title: 'Cancel Invite',
      message: `Cancel the invite sent to "${invite.email}"?`,
      confirmLabel: 'Cancel Invite',
      variant: 'danger',
    });
    if (!ok) return;
    deleteInvite.mutate(invite.id, {
      onSuccess: () => {
        toast(`Cancelled invite to ${invite.email}.`);
      },
    });
  }

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
      <InviteVendorModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInviteVendor}
        submitting={createInvite.isPending}
      />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Vendors</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">Manage all registered vendor accounts.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <Users size={16} />
              <span className="text-sm font-medium">{vendors.length} total</span>
            </div>
            <Button
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-2"
            >
              <UserPlus size={16} />
              Invite Vendor
            </Button>
          </div>
        </div>

        {pendingVendorInvites.length > 0 && (
          <Card className="p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-outline-variant">
              <h2 className="text-sm font-semibold text-on-surface">Pending Vendor Invites</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Vendors who haven't accepted their invite yet.
              </p>
            </div>
            <div className="divide-y divide-outline-variant">
              {pendingVendorInvites.map((invite) => {
                const resending =
                  resendInvite.isPending && resendInvite.variables === invite.id;
                const cancelling =
                  deleteInvite.isPending && deleteInvite.variables === invite.id;
                return (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <p className="text-sm font-medium text-on-surface truncate">
                        {invite.email}
                      </p>
                      <StatusChip status="Pending" className="flex-shrink-0" />
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleResendInvite(invite)}
                        disabled={resending}
                        title="Resend invite"
                        className="p-1.5 rounded hover:bg-surface-container transition-colors disabled:opacity-50"
                      >
                        {resending ? (
                          <Loader2 size={14} className="animate-spin text-on-surface-variant" />
                        ) : (
                          <Mail size={14} className="text-on-surface-variant" />
                        )}
                      </button>
                      <button
                        onClick={() => handleCancelInvite(invite)}
                        disabled={cancelling}
                        title="Cancel invite"
                        className="p-1.5 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {cancelling ? (
                          <Loader2 size={14} className="animate-spin text-error" />
                        ) : (
                          <Trash2 size={14} className="text-error" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

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
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-surface-low rounded border border-outline-variant focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-secondary" />
              <span className="ml-2 text-sm text-on-surface-variant">Loading vendors...</span>
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-on-surface-variant">No vendors found.</p>
          ) : (
            <>
              {/* Desktop / tablet: table */}
              <div className="hidden md:block overflow-x-auto">
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
              </div>

              {/* Phone: stacked cards */}
              <div className="md:hidden divide-y divide-outline-variant">
                {filtered.map((vendor) => (
                  <div
                    key={vendor.id}
                    onClick={() => navigate(`/admin/vendors/${vendor.id}`)}
                    className="px-4 py-4 active:bg-surface-low/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">{vendor.company_name ?? '—'}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">{vendor.business_type ?? ''}</p>
                      </div>
                      <StatusChip status={vendor.is_active ? 'Active' : 'Inactive'} className="flex-shrink-0" />
                    </div>

                    <div className="mt-2.5 text-sm text-on-surface">
                      {vendor.contact_first_name || vendor.contact_last_name
                        ? `${vendor.contact_first_name ?? ''} ${vendor.contact_last_name ?? ''}`.trim()
                        : '—'}
                    </div>
                    <div className="text-xs text-on-surface-variant truncate">
                      {vendor.contact_email ?? vendor.user_email ?? '—'}
                    </div>
                    {vendor.industry && (
                      <div className="text-xs text-on-surface-variant mt-1">{vendor.industry}</div>
                    )}

                    <div className="flex items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleStatus(vendor)}
                        disabled={actionLoading === `status-${vendor.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded border border-outline-variant text-xs font-medium text-on-surface-variant hover:bg-surface-low transition-colors disabled:opacity-50"
                      >
                        {actionLoading === `status-${vendor.id}` ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : vendor.is_active ? (
                          <PowerOff size={13} className="text-amber-600" />
                        ) : (
                          <Power size={13} className="text-emerald" />
                        )}
                        {vendor.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(vendor)}
                        disabled={actionLoading === `delete-${vendor.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded border border-outline-variant text-xs font-medium text-error hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === `delete-${vendor.id}` ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
