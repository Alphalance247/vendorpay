import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  HelpCircle,
  LogOut,
  Users,
  Shield,
  Wallet,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../lib/authContext';
import ConfirmModal from '../ui/ConfirmModal';

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3.5 py-2.5 rounded text-base font-medium transition-colors',
          isActive
            ? 'bg-amber text-white'
            : 'text-on-primary-container hover:bg-white/10 text-slate-300'
        )
      }
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar({ role = 'vendor', user }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  async function handleSignOut() {
    setShowSignOutConfirm(false);
    await logout();
    navigate('/login', { replace: true });
  }

  const vendorNav = [
    { to: '/vendor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/vendor/invoices', icon: FileText, label: 'Invoices' },
    { to: '/vendor/payments', icon: CreditCard, label: 'Payments' },
  ];

  const adminNav = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/vendors', icon: Users, label: 'Vendors' },
    { to: '/admin/invoices', icon: FileText, label: 'Invoices' },
    { to: '/admin/payments', icon: CreditCard, label: 'Payments' },
    { to: '/admin/team', icon: Shield, label: 'Team' },
    { to: '/admin/billing', icon: Wallet, label: 'Billing' },
  ];

  const navItems = role === 'admin' ? adminNav : vendorNav;

  return (
    <aside className="fixed inset-y-0 left-0 w-72 bg-navy flex flex-col z-30">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg font-bold leading-none" style={{ fontFamily: 'Georgia, serif', letterSpacing: '-1px' }}>~</span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-base leading-tight">Alluvium</p>
            <p className="text-emerald-light text-sm leading-tight">VendorPay</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1.5">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* Bottom section: Support + Sign out + User */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3 space-y-1.5">
        <NavItem to={role === 'admin' ? '/admin/support' : '/vendor/support'} icon={HelpCircle} label="Support" />
        <button
          onClick={() => setShowSignOutConfirm(true)}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded text-base font-medium text-slate-300 hover:bg-white/10 w-full text-left transition-colors"
        >
          <LogOut size={20} />
          <span>Sign out</span>
        </button>
      </div>

      {user && (
        <div className="px-4 py-4 border-t border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {user.name?.charAt(0) ?? 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user.name}</p>
            <p className="text-slate-400 text-xs truncate">{user.role}</p>
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
  );
}