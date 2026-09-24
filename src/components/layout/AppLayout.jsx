import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { vendorService } from '../../lib/services/vendorService';
import { useCurrentUser } from '../../hooks/useQueries/vendorAdmin/useCurrentUser';

function capitalize(value) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function AppLayout({ children, role = 'vendor', searchPlaceholder }) {
  const [profile, setProfile] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (role === 'vendor') {
      vendorService.getProfile().then(setProfile).catch(() => {});
    }
  }, [role]);

  const { data: currentUser } = useCurrentUser(role === 'admin');

  const user = role === 'admin'
    ? {
        name: currentUser?.full_name || '—',
        role: capitalize(currentUser?.role) || 'Team Member',
      }
    : {
        name: profile
          ? [profile.contact_first_name, profile.contact_last_name].filter(Boolean).join(' ') || profile.company_name || 'Vendor'
          : '—',
        role: 'Vendor',
      };

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar role={role} user={user} open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
        <TopBar searchPlaceholder={searchPlaceholder} onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 max-w-content mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
