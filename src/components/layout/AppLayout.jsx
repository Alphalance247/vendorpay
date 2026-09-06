import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { vendorService } from '../../lib/services/vendorService';

export default function AppLayout({ children, role = 'vendor', searchPlaceholder }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (role === 'vendor') {
      vendorService.getProfile().then(setProfile).catch(() => {});
    }
  }, [role]);

  const user = role === 'admin'
    ? { name: 'Administrator', role: 'Firm Administrator' }
    : {
        name: profile
          ? [profile.contact_first_name, profile.contact_last_name].filter(Boolean).join(' ') || profile.company_name || 'Vendor'
          : '—',
        role: 'Vendor',
      };

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar role={role} user={user} />
      <div className="flex-1 ml-72 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
        <TopBar searchPlaceholder={searchPlaceholder} />
        <main className="flex-1 p-6 max-w-content mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
