import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  UserPlus,
  Trash2,
  Mail,
  Crown,
  ShieldCheck,
  Eye,
  Loader2,
} from "lucide-react";
import TutorialCard from "../../components/ui/TutorialCard";
import AppLayout from "../../components/layout/AppLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Modal from "../../components/ui/Modal";
import StatusChip from "../../components/ui/StatusChip";
import { useConfirm } from "../../hooks/useConfirm";
import { useToast } from "../../components/ui/Toast";
import { useCreateInvite } from "../../hooks/useQueries/vendorAdmin/useCreateInvite";
import { useTeamMembers } from "../../hooks/useQueries/vendorAdmin/useTeamMembers";
import { useDeleteTeamMember } from "../../hooks/useQueries/vendorAdmin/useDeleteTeamMember";
import { useResendInvite } from "../../hooks/useQueries/vendorAdmin/useResendInvite";

const ROLES = [
  {
    id: "Owner",
    icon: Crown,
    description:
      "Full access, including billing and team management. Cannot be removed or reassigned.",
  },
  {
    id: "Admin",
    icon: ShieldCheck,
    description:
      "Manages vendors, invoices, and payments. No access to billing or removing the Owner.",
  },
  {
    id: "Reviewer",
    icon: Eye,
    description:
      "Reviews and approves or rejects invoices only. No access to payments, team, or billing.",
  },
];

// Roles the backend invite endpoint currently accepts. Four roles exist
// conceptually (see ROLES above for Owner/Admin/Reviewer); these three are
// what's wired up so far — more will be added as the backend supports them.
const INVITE_ROLES = ["admin", "member", "vendor", "staff"];

// The API returns lowercase status values (e.g. "active", "pending");
// StatusChip's style map is keyed on the capitalized form.
function statusLabel(status) {
  if (!status) return status;
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function RoleLegend() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {ROLES.map(({ id, icon: Icon, description }) => (
        <Card key={id} className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald/10 flex items-center justify-center flex-shrink-0">
            <Icon size={17} className="text-emerald" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-on-surface">{id}</p>
            <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
              {description}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}

function InviteModal({ open, onClose, onInvite, submitting }) {
  const [form, setForm] = useState({ name: "", email: "", role: "Admin" });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email) return;
    // The invite endpoint only accepts { email, role } today — name is kept
    // in the form for when the backend starts inspecting it, but isn't sent yet.
    onInvite(form, () => setForm({ name: "", email: "", role: "Admin" }));
  }

  const valid = form.name.trim() && /\S+@\S+\.\S+/.test(form.email);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite Teammate"
      subtitle="They'll receive an email invite to join your workspace."
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
            {submitting ? "Sending..." : "Send Invite"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Jane Smith"
          autoFocus
          disabled={submitting}
        />
        <Input
          label="Work Email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="jane@yourcompany.com"
          disabled={submitting}
        />
        <Select
          label="Role"
          name="role"
          value={form.role}
          onChange={handleChange}
          disabled={submitting}
        >
          {INVITE_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </form>
    </Modal>
  );
}

export default function TeamRoles() {
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  const { confirm, confirmEl } = useConfirm();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: team = [], isLoading, isError } = useTeamMembers();
  const createInvite = useCreateInvite(() => setInviteOpen(false));
  const deleteMember = useDeleteTeamMember();
  const resendInvite = useResendInvite();

  function handleInvite({ email, role }, resetForm) {
    createInvite.mutate(
      { email, role },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["team-members"] });
          resetForm?.();
        },
      },
    );
  }

  function handleResend(member) {
    resendInvite.mutate(member.id, {
      onSuccess: () => {
        toast(`Invitation resent to ${member.email}.`);
      },
    });
  }

  async function handleRemove(member) {
    const ok = await confirm({
      title: "Remove Teammate",
      message: `Remove "${member.full_name}" from your team? They'll lose access to this workspace immediately.`,
      confirmLabel: "Remove",
      variant: "danger",
    });
    if (!ok) return;
    deleteMember.mutate(member.id, {
      onSuccess: () => {
        toast(`Removed ${member.full_name} from the team.`);
      },
    });
  }

  const filtered = team.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.full_name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)
    );
  });

  return (
    <AppLayout role="admin" searchPlaceholder="Search team members...">
      {confirmEl}
      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
        submitting={createInvite.isPending}
      />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">
              Team & Roles
            </h1>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Manage who has access to your company's VendorPay workspace.
            </p>
          </div>
          <Button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2"
          >
            <UserPlus size={16} />
            Invite Teammate
          </Button>
        </div>

        <TutorialCard
          id="admin-team"
          title="Team & Roles"
          description="Every teammate is assigned one of three roles, which determines what they can do in your workspace."
          tips={[
            "Owner has full access, including billing — there's only ever one, and it can't be reassigned here.",
            "Admins manage day-to-day operations: vendors, invoices, and payments.",
            "Reviewers can only review and approve or reject invoices — a good fit for finance staff who shouldn't touch payments.",
            "Pending teammates haven't accepted their invite yet — you can resend it or remove the invite entirely.",
          ]}
        />

        <RoleLegend />

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
                placeholder="Search by name or email..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-surface-low rounded border border-outline-variant focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-secondary" />
              <span className="ml-2 text-sm text-on-surface-variant">Loading team...</span>
            </div>
          ) : isError ? (
            <p className="px-6 py-12 text-center text-sm text-error">
              Failed to load team members.
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-on-surface-variant">
              No team members found.
            </p>
          ) : (
            <>
              {/* Desktop / tablet: table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-low border-b border-outline-variant">
                      {["Name", "Email", "Role", "Status", ""].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {filtered.map((member) => {
                      const isOwner = member.role?.toLowerCase() === "owner";
                      const removing =
                        deleteMember.isPending &&
                        deleteMember.variables === member.id;
                      const resending =
                        resendInvite.isPending &&
                        resendInvite.variables === member.id;
                      return (
                        <tr
                          key={member.id}
                          className="hover:bg-surface-low/50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-semibold text-on-surface">
                            {member.full_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-on-surface-variant">
                            {member.email}
                          </td>
                          <td className="px-6 py-4">
                            {isOwner ? (
                              <span className="text-sm text-on-surface-variant flex items-center gap-1.5">
                                <Crown size={13} className="text-amber" /> Owner
                              </span>
                            ) : (
                              <span className="text-sm text-on-surface-variant capitalize">
                                {member.role}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <StatusChip status={statusLabel(member.status)} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1.5">
                              {member.status === "pending" && (
                                <button
                                  onClick={() => handleResend(member)}
                                  disabled={resending}
                                  title="Resend invite"
                                  className="p-1.5 rounded hover:bg-surface-container transition-colors disabled:opacity-50"
                                >
                                  {resending ? (
                                    <Loader2
                                      size={14}
                                      className="animate-spin text-on-surface-variant"
                                    />
                                  ) : (
                                    <Mail
                                      size={14}
                                      className="text-on-surface-variant"
                                    />
                                  )}
                                </button>
                              )}
                              {!isOwner && (
                                <button
                                  onClick={() => handleRemove(member)}
                                  disabled={removing}
                                  title="Remove teammate"
                                  className="p-1.5 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                                >
                                  {removing ? (
                                    <Loader2 size={14} className="animate-spin text-error" />
                                  ) : (
                                    <Trash2 size={14} className="text-error" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Phone: stacked cards */}
              <div className="md:hidden divide-y divide-outline-variant">
                {filtered.map((member) => {
                  const isOwner = member.role?.toLowerCase() === "owner";
                  const removing =
                    deleteMember.isPending &&
                    deleteMember.variables === member.id;
                  const resending =
                    resendInvite.isPending &&
                    resendInvite.variables === member.id;
                  return (
                    <div key={member.id} className="px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate">
                            {member.full_name}
                          </p>
                          <p className="text-xs text-on-surface-variant truncate">
                            {member.email}
                          </p>
                        </div>
                        <StatusChip
                          status={statusLabel(member.status)}
                          className="flex-shrink-0"
                        />
                      </div>

                      <div className="flex items-center justify-between mt-3 gap-3">
                        {isOwner ? (
                          <span className="text-sm text-on-surface-variant flex items-center gap-1.5">
                            <Crown size={13} className="text-amber" /> Owner
                          </span>
                        ) : (
                          <span className="text-sm text-on-surface-variant capitalize">
                            {member.role}
                          </span>
                        )}

                        <div className="flex items-center gap-1.5">
                          {member.status === "pending" && (
                            <button
                              onClick={() => handleResend(member)}
                              disabled={resending}
                              title="Resend invite"
                              className="p-1.5 rounded hover:bg-surface-container transition-colors disabled:opacity-50"
                            >
                              {resending ? (
                                <Loader2
                                  size={14}
                                  className="animate-spin text-on-surface-variant"
                                />
                              ) : (
                                <Mail
                                  size={14}
                                  className="text-on-surface-variant"
                                />
                              )}
                            </button>
                          )}
                          {!isOwner && (
                            <button
                              onClick={() => handleRemove(member)}
                              disabled={removing}
                              title="Remove teammate"
                              className="p-1.5 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              {removing ? (
                                <Loader2 size={14} className="animate-spin text-error" />
                              ) : (
                                <Trash2 size={14} className="text-error" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
