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
import ActionMenu from "../../components/ui/ActionMenu";
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
      "Full access. Everything Admin can do, plus funding invoices and marking them paid. Can also delete invoices, activate, deactivate or remove vendors, and manage the team, company settings, logo and billing. Can view all support tickets and the activity log.",
  },
  {
    id: "Admin",
    icon: ShieldCheck,
    description:
      "Everything a Member can do, plus review work. Can manage invoices and verify or reject vendor bank details. Can't manage the company, team, or billing.",
  },
  {
    id: "Member",
    icon: Eye,
    description:
      "View-only access. Can see invoices, vendors and the team list, but can't make any changes or take any actions.",
  },
];

// Roles the backend invite endpoint accepts from this page. "vendor" used to
// be one of them, but vendor invites now live on the Vendors page instead.
const INVITE_ROLES = [
  { name: "Admin", value: "Staff" },
  { name: "Member", value: "member" },
];

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
          <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
            <Icon size={17} className="text-success" />
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
  const [form, setForm] = useState({ email: "", role: INVITE_ROLES[0] });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.email) return;
    onInvite(form, () => setForm({ email: "", role: INVITE_ROLES[0] }));
  }

  const valid = /\S+@\S+\.\S+/.test(form.email);

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
          label="Work Email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="jane@yourcompany.com"
          autoFocus
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
            <option key={r.value} value={r.value}>
              {r.name}
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

  const { data: rawTeam = [], isLoading, isError } = useTeamMembers();
  // Vendor invites/rows now live on the Vendors page instead of here.
  const team = rawTeam.filter((m) => m.role?.toLowerCase() !== "vendor");
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
      onConfirm: () => deleteMember.mutateAsync(member.id),
    });
    if (ok) {
      toast(`Removed ${member.full_name} from the team.`);
    }
  }

  // Row actions shared by the desktop table and the phone cards.
  function memberActions(member, { isOwner, resending, removing }) {
    const items = [];
    if (member.status === "pending") {
      items.push({
        label: resending ? "Resending…" : "Resend invite",
        icon: resending ? Loader2 : Mail,
        loading: resending,
        disabled: resending,
        onClick: () => handleResend(member),
      });
    }
    if (!isOwner) {
      items.push({
        label: removing ? "Removing…" : "Remove teammate",
        icon: removing ? Loader2 : Trash2,
        loading: removing,
        disabled: removing,
        danger: true,
        onClick: () => handleRemove(member),
      });
    }
    return items;
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
    <AppLayout role="admin">
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
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-surface-container rounded border border-outline-variant focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-secondary" />
              <span className="ml-2 text-sm text-on-surface-variant">
                Loading team...
              </span>
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
                    <tr className="bg-surface-container border-b border-outline-variant">
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
                      const actions = memberActions(member, {
                        isOwner,
                        resending,
                        removing,
                      });
                      return (
                        <tr
                          key={member.id}
                          className="hover:bg-surface-container/50 transition-colors"
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
                                <Crown size={13} className="text-warning" />{" "}
                                Owner
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
                          <td className="px-6 py-4 text-right">
                            {actions.length > 0 && (
                              <ActionMenu items={actions} />
                            )}
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
                  const actions = memberActions(member, {
                    isOwner,
                    resending,
                    removing,
                  });
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
                            <Crown size={13} className="text-warning" /> Owner
                          </span>
                        ) : (
                          <span className="text-sm text-on-surface-variant capitalize">
                            {member.role}
                          </span>
                        )}

                        {actions.length > 0 && <ActionMenu items={actions} />}
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
