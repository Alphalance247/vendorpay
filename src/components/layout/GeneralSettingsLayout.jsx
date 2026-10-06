import TopBar from "./TopBar";
import SettingsSidebar from "./SettingsSidebar";
import { useEffect, useState } from "react";
import { vendorService } from "../../lib/services/vendorService";

export default function SettingsLayout({
  children,
  role = "vendor",
  searchPlaceholder,
  activePage,
  onPageChange,
}) {
  const [profile, setProfile] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (role === "vendor") {
      vendorService
        .getProfile()
        .then(setProfile)
        .catch(() => {});
    }
  }, [role]);

  const user =
    role === "admin"
      ? {
          name: "Administrator",
          role: "Firm Administrator",
        }
      : {
          name: profile
            ? [profile.contact_first_name, profile.contact_last_name]
                .filter(Boolean)
                .join(" ") ||
              profile.company_name ||
              "Vendor"
            : "—",
          role: "Vendor",
        };

  return (
    <div className="h-screen bg-surface flex overflow-hidden">
      <SettingsSidebar
        role={role}
        user={user}
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        activePage={activePage}
        onPageChange={onPageChange}
      />

      {/* Right side scroll container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto overflow-x-hidden">
        <TopBar
          searchPlaceholder={searchPlaceholder}
          onMenuClick={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-content mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
