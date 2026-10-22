import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { vendorService } from "../../lib/services/vendorService";
import { useCurrentUser } from "../../hooks/useQueries/vendorAdmin/useCurrentUser";

function capitalize(value) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function AppLayout({ children, role = "vendor" }) {
  const [profile, setProfile] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (role === "vendor") {
      vendorService
        .getProfile()
        .then(setProfile)
        .catch(() => { });
    }
  }, [role]);

  // The profile photo lives on the user account (/auth/me) for every role.
  const { data: currentUser } = useCurrentUser();

  const user =
    role === "admin"
      ? {
        name: currentUser?.full_name || "—",
        role: capitalize(currentUser?.role) || "Team Member",
        avatar_url: currentUser?.avatar_url,
      }
      : {
        name: profile
          ? profile.full_name
          ||
          profile.company_name ||
          "Vendor"
          : "—",
        role: "Vendor",
        avatar_url: currentUser?.avatar_url ?? profile?.avatar_url,
      };

  return (
    <div className="h-screen bg-surface flex overflow-hidden">
      <Sidebar
        role={role}
        user={user}
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* Right side */}
      <div className="flex-1 lg:ml-72 flex flex-col min-w-0 min-h-0 overflow-y-auto overflow-x-hidden">
        {/* Sticky TopBar */}
        <TopBar
          // searchPlaceholder={searchPlaceholder}
          onMenuClick={() => setMobileNavOpen(true)}
        />

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 max-w-content mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
