import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  Loader2,
  PowerOff,
  Power,
  Trash2,
  UserPlus,
  Mail,
  Eye,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
// import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import InviteVendorModal from "../../components/ui/InviteVendorModal";
import StatusChip from "../../components/ui/StatusChip";
import ActionMenu from "../../components/ui/ActionMenu";
import { vendorService } from "../../lib/services/vendorService";
import { useConfirm } from "../../hooks/useConfirm";
import { useToast } from "../../components/ui/Toast";
import { useResendInvite } from "../../hooks/useQueries/vendorAdmin/useResendInvite";
import { useDeleteTeamMember } from "../../hooks/useQueries/vendorAdmin/useDeleteTeamMember";
import { useNavigate } from "react-router-dom";
import TutorialCard from "../../components/ui/TutorialCard";
import Card from "../../components/ui/Card";
// import { BsThreeDotsVertical } from "react-icons/bs";

// function InviteVendorModal({ open, onClose, onInvite, submitting }) {
//   const [email, setEmail] = useState("");

//   function handleSubmit(e) {
//     e.preventDefault();
//     if (!valid) return;
//     onInvite(email, () => setEmail(""));
//   }

//   const valid = /\S+@\S+\.\S+/.test(email);

//   return (
//     <Modal
//       open={open}
//       onClose={onClose}
//       title="Invite Vendor"
//       subtitle="They'll receive an email invite to join your workspace as a vendor."
//       footer={
//         <>
//           <Button variant="ghost" onClick={onClose}>
//             Cancel
//           </Button>
//           <Button
//             onClick={handleSubmit}
//             disabled={!valid || submitting}
//             className="flex items-center gap-1.5"
//           >
//             {submitting ? (
//               <Loader2 size={15} className="animate-spin" />
//             ) : (
//               <UserPlus size={15} />
//             )}
//             {submitting ? "Sending..." : "Send Invite"}
//           </Button>
//         </>
//       }
//     >
//       <form onSubmit={handleSubmit} className="space-y-4">
//         <Input
//           label="Vendor Email"
//           type="email"
//           name="email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           placeholder="vendor@company.com"
//           autoFocus
//           disabled={submitting}
//         />
//       </form>
//     </Modal>
//   );
// }

export default function AdminVendors() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  // const [openAction, setOpenAction] = useState(false);
  const { confirm, confirmEl } = useConfirm();
  const { toast } = useToast();

  const loadVendors = () =>
    vendorService
      .getAllVendors()
      .then(setVendors)
      .catch(() => setError("Failed to load vendors."))
      .finally(() => setLoading(false));

  useEffect(() => {
    loadVendors();
  }, []);

  // Pending invites and registered vendors both come from the same /vendors/
  // list — a "pending" status is a vendor who hasn't accepted their invite yet.
  const pendingVendorInvites = vendors.filter((v) => v.status === "pending");
  const registeredVendors = vendors.filter((v) => v.status !== "pending");
  const resendInvite = useResendInvite();
  const deleteInvite = useDeleteTeamMember();

  function handleResendInvite(invite) {
    const email = invite.email ?? invite.contact_email ?? invite.user_email;
    resendInvite.mutate(invite.id, {
      onSuccess: () => {
        toast(`Invitation resent to ${email}.`);
      },
    });
  }

  async function handleCancelInvite(invite) {
    const email = invite.email ?? invite.contact_email ?? invite.user_email;
    const ok = await confirm({
      title: "Revoke Access",
      message: `Revoke the invitation sent to "${email}"? Their invite link will stop working.`,
      confirmLabel: "Revoke Access",
      variant: "danger",
      onConfirm: () => deleteInvite.mutateAsync(invite.id),
    });
    if (ok) {
      loadVendors();
      toast(`Revoked access for ${email}.`);
    }
  }

  async function handleToggleStatus(vendor) {
    const activating = !vendor.is_active;
    const displayName =
      vendor.company_name || vendor.user_email || "this vendor";
    await confirm({
      title: activating ? "Activate Vendor" : "Deactivate Vendor",
      message: activating
        ? `Reactivate "${displayName}"? They will regain access to submit invoices.`
        : `Deactivate "${displayName}"? They will lose access until reactivated.`,
      confirmLabel: activating ? "Activate" : "Deactivate",
      variant: activating ? "approve" : "warning",
      onConfirm: async () => {
        await vendorService.updateVendorStatus(vendor.id, activating);
        setVendors((prev) =>
          prev.map((v) =>
            v.id === vendor.id ? { ...v, is_active: activating } : v,
          ),
        );
      },
    });
  }

  async function handleDelete(vendor) {
    const displayName =
      vendor.company_name || vendor.user_email || `Vendor #${vendor.id}`;
    const ok = await confirm({
      title: "Delete Vendor",
      message: `Delete "${displayName}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: () => vendorService.deleteVendor(vendor.id),
    });
    if (ok) {
      setVendors((prev) => prev.filter((v) => v.id !== vendor.id));
    }
  }
  const matchesSearch = (v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.company_name?.toLowerCase().includes(q) ||
      v.user_email?.toLowerCase().includes(q) ||
      v.industry?.toLowerCase().includes(q)
    );
  };
  const filtered = registeredVendors.filter(matchesSearch);
  const filteredPendingInvites = pendingVendorInvites.filter(matchesSearch);
  return (
    <AppLayout role="admin">
      {confirmEl}
      <InviteVendorModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={loadVendors}
      />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">
              Vendors
            </h1>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Manage all registered vendor accounts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <Users size={16} />
              <span className="text-sm font-medium capitalize">
                {registeredVendors.length} active
              </span>
            </div>
            <div className="flex items-center gap-2 text-on-surface">
              <Users size={16} />
              <span className="text-sm font-medium capitalize">
                {pendingVendorInvites.length} pending
              </span>
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
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant">
            <div className="relative flex-1 max-w-sm">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
              />
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
              <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <Loader2
                  size={20}
                  className="animate-spin text-on-surface-variant"
                />
              </div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-error/30 bg-error/5 p-6 text-center">
              <p className="text-sm font-medium text-error">{error}</p>

              <Button
                type="button"
                variant="ghost"
                onClick={loadVendors}
                className="mt-3"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container border-b border-outline-variant">
                    {["Company", "Contact", "Industry", "Status", "Action"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                {vendors.length > 0 ? (
                  <tbody className="divide-y divide-outline-variant">
                    {filtered.map((vendor) => (
                      <tr
                        key={vendor.id}
                        title="View full profile, banking details, and invoice history"
                        className="hover:bg-surface-container/50 transition-colors cursor-pointer"
                      // onClick={() => navigate(`/admin/vendors/${vendor.id}`)}
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-on-surface">
                            {vendor.company_name ?? "—"}
                          </p>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            {vendor.business_type ?? ""}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-on-surface">
                            {vendor.contact_first_name || vendor.contact_last_name
                              ? `${vendor.contact_first_name ?? ""} ${vendor.contact_last_name ?? ""}`.trim()
                              : "—"}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {vendor.contact_email ?? vendor.user_email ?? "—"}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-on-surface-variant">
                          {vendor.industry ?? "—"}
                        </td>
                        <td className="px-6 py-4">
                          <StatusChip
                            status={vendor.status}
                          // status={vendor.is_active ? "Active" : "Inactive"}
                          />
                        </td>
                        <td
                          className="px-6 py-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ActionMenu
                            items={[
                              {
                                label: "View",
                                icon: Eye,
                                onClick: () => navigate(`/admin/vendors/${vendor.id}`),
                              },
                              {
                                label: vendor.is_active ? "Deactivate" : "Activate",
                                icon: vendor.is_active ? PowerOff : Power,
                                onClick: () => handleToggleStatus(vendor),
                              },
                              {
                                label: "Delete",
                                icon: Trash2,
                                danger: true,
                                onClick: () => handleDelete(vendor),
                              },
                            ]}
                          />
                          {/* <div className="flex items-center gap-4">
                          <Tooltip
                            text={
                              vendor.is_active
                                ? "Deactivate vendor"
                                : "Activate vendor"
                            }
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(vendor)}
                              aria-label={
                                vendor.is_active
                                  ? "Deactivate vendor"
                                  : "Activate vendor"
                              }
                              className="p-1.5 rounded hover:bg-surface-container transition-colors"
                            >
                              {vendor.is_active ? (
                                <PowerOff size={14} className="text-warning" />
                              ) : (
                                <Power size={14} className="text-success" />
                              )}
                            </button>
                          </Tooltip>
                          <Tooltip text="Delete vendor">
                            <button
                              type="button"
                              onClick={() => handleDelete(vendor)}
                              aria-label="Delete vendor"
                              className="p-1.5 rounded hover:bg-error/5 transition-colors"
                            >
                              <Trash2 size={14} className="text-error" />
                            </button>
                          </Tooltip>
                        </div> */}
                        </td>
                      </tr>
                    ))}

                    {filteredPendingInvites.map((invite) => {
                      const resending =
                        resendInvite.isPending &&
                        resendInvite.variables === invite.id;
                      const cancelling =
                        deleteInvite.isPending &&
                        deleteInvite.variables === invite.id;
                      return (
                        <tr
                          key={invite.id}
                          className="hover:bg-surface-container/50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-on-surface">
                              {invite.company_name ?? "—"}
                            </p>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              {invite.business_type ?? ""}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-on-surface">
                              {invite.contact_first_name || invite.contact_last_name
                                ? `${invite.contact_first_name ?? ""} ${invite.contact_last_name ?? ""}`.trim()
                                : "—"}
                            </p>
                            <p className="text-xs text-on-surface-variant">
                              {invite.contact_email ?? invite.user_email ?? "—"}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-sm text-on-surface-variant">
                            {invite.industry ?? "—"}
                          </td>
                          <td className="px-6 py-4 ">
                            <StatusChip status={invite.status} />
                          </td>
                          <td
                            className="px-6 py-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ActionMenu
                              items={[
                                {
                                  label: resending ? "Resending…" : "Resend invitation",
                                  icon: resending ? Loader2 : Mail,
                                  loading: resending,
                                  disabled: resending,
                                  onClick: () => handleResendInvite(invite),
                                },
                                {
                                  label: cancelling ? "Revoking…" : "Revoke access",
                                  icon: cancelling ? Loader2 : Trash2,
                                  loading: cancelling,
                                  disabled: cancelling,
                                  danger: true,
                                  onClick: () => handleCancelInvite(invite),
                                },
                              ]}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>) : (
                  <tbody>
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-16 text-center text-sm text-on-surface-variant"
                      >
                        No vendors found.
                      </td>
                    </tr>
                  </tbody>
                )
                }
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
