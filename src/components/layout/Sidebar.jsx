import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  HelpCircle,
  LogOut,
  Users,
} from 'lucide-react';
import { cn } from '../../lib/utils';

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors',
          isActive
            ? 'bg-emerald text-white'
            : 'text-on-primary-container hover:bg-white/10 text-slate-300'
        )
      }
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar({ role = 'vendor', user }) {
  const navigate = useNavigate();

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
  ];

  const navItems = role === 'admin' ? adminNav : vendorNav;

  return (
    <aside className="fixed inset-y-0 left-0 w-[160px] bg-navy flex flex-col z-30">
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-emerald rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">VP</span>
          </div>
          <span className="text-white font-semibold text-sm">VendorPay</span>
        </div>
        {role === 'admin' && (
          <p className="text-slate-400 text-xs mt-0.5">Enterprise Finance</p>
        )}
      </div>

      <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* Bottom section: Support + Sign out + User */}
      <div className="px-2 pb-4 border-t border-white/10 pt-3 space-y-1">
        <NavItem to={role === 'admin' ? '/admin/support' : '/vendor/support'} icon={HelpCircle} label="Support" />
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-3 px-3 py-2 rounded text-sm font-medium text-slate-300 hover:bg-white/10 w-full text-left transition-colors"
        >
          <LogOut size={18} />
          <span>Sign out</span>
        </button>
      </div>

      {user && (
        <div className="px-3 py-3 border-t border-white/10 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-emerald flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {user.name?.charAt(0) ?? 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">{user.name}</p>
            <p className="text-slate-400 text-xs truncate">{user.role}</p>
          </div>
        </div>
      )}
    </aside>
  );
}