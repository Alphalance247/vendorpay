import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import Input from "./Input";
import { useCreateInvite } from "../../hooks/useQueries/vendorAdmin/useCreateInvite";

export default function InviteVendorModal({ open, onClose, onInvited }) {
  const [email, setEmail] = useState("");

  const createInvite = useCreateInvite(() => {
    setEmail("");
    onClose();
    onInvited?.();
  });

  const valid = /\S+@\S+\.\S+/.test(email);

  function handleSubmit(e) {
    e.preventDefault();
    if (!valid || createInvite.isPending) return;
    createInvite.mutate({ email, role: "vendor" });
  }

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
            disabled={!valid || createInvite.isPending}
            className="flex items-center gap-1.5"
          >
            {createInvite.isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <UserPlus size={15} />
            )}
            {createInvite.isPending ? "Sending..." : "Send Invite"}
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
          disabled={createInvite.isPending}
        />
      </form>
    </Modal>
  );
}
