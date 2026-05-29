import Sidebar from './Sidebar';
import TopBar from './TopBar';

const demoVendorUser = { name: 'Alex Sterling', role: 'Vendor' };
const demoAdminUser = { name: 'Admin User', role: 'Firm Administrator' };

export default function AppLayout({ children, role = 'vendor', searchPlaceholder }) {
  const user = role === 'admin' ? demoAdminUser : demoVendorUser;

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar role={role} user={user} />
      <div className="flex-1 ml-[160px] flex flex-col min-h-screen">
        <TopBar searchPlaceholder={searchPlaceholder} />
        <main className="flex-1 p-6 max-w-content mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
