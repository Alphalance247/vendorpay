import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  HelpCircle,
  LogOut,
  Users,
  Shield,
  X,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/authContext";
import ConfirmModal from "../ui/ConfirmModal";
import Logo from "../ui/Logo";

function NavItem({ to, icon: Icon, label, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3.5 py-2.5 rounded font-label-caps text-label-caps uppercase tracking-wider transition-colors",
          isActive
            ? "bg-primary text-on-primary"
            : "text-inverse-on-surface/70 hover:bg-white/10 hover:text-inverse-on-surface",
        )
      }
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar({
  role = "vendor",
  user,
  open = false,
  onClose,
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function handleSignOut() {
    setShowSignOutConfirm(false);
    await logout();
    navigate("/login", { replace: true });
  }

  const vendorNav = [
    { to: "/vendor/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/vendor/invoices", icon: FileText, label: "Invoices" },
    { to: "/vendor/payments", icon: CreditCard, label: "Payments" },
  ];

  const adminNav = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/vendors", icon: Users, label: "Vendors" },
    { to: "/admin/invoices", icon: FileText, label: "Invoices" },
    { to: "/admin/payments", icon: CreditCard, label: "Payments" },
    { to: "/admin/team", icon: Shield, label: "Team" },
    // { to: '/admin/billing', icon: Wallet, label: 'Billing' },
  ];

  const navItems = role === "admin" ? adminNav : vendorNav;

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-inverse-surface flex flex-col z-30 transition-transform duration-200",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="px-5 py-6 border-b border-white/10 flex items-center justify-between">
          <Logo variant="dark" className="min-w-0" />
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded text-inverse-on-surface/70 hover:bg-white/10 hover:text-inverse-on-surface transition-colors flex-shrink-0"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} onNavigate={onClose} />
          ))}
        </nav>

        {/* Bottom section: Support + Sign out + User */}
        <div className="px-3 pb-4 border-t border-white/10 pt-3 space-y-1.5">
          <NavItem
            to={role === "admin" ? "/admin/support" : "/vendor/support"}
            icon={HelpCircle}
            label="Support"
            onNavigate={onClose}
          />
          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded font-label-caps text-label-caps uppercase tracking-wider text-inverse-on-surface/70 hover:bg-white/10 hover:text-inverse-on-surface w-full text-left transition-colors"
          >
            <LogOut size={20} />
            <span>Sign out</span>
          </button>
        </div>

        {user && (
          <div className="px-4 py-4 border-t border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary text-sm font-semibold flex-shrink-0">
              {user.name?.charAt(0) ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="text-inverse-on-surface text-sm font-medium truncate">
                {user.name}
              </p>
              <p className="text-inverse-on-surface/60 text-xs truncate">
                {user.role}
              </p>
            </div>
          </div>
        )}

        <ConfirmModal
          open={showSignOutConfirm}
          variant="neutral"
          title="Sign out of VendorPay?"
          message="You'll need to sign in again to access your dashboard."
          confirmLabel="Sign out"
          onConfirm={handleSignOut}
          onCancel={() => setShowSignOutConfirm(false)}
        />
      </aside>
    </>
  );
}
