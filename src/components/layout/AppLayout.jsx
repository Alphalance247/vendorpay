import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { vendorService } from "../../lib/services/vendorService";

export default function AppLayout({
  children,
  role = "vendor",
  searchPlaceholder,
}) {
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (role === "vendor") {
      vendorService
        .getProfile()
        .then(setProfile)
        .catch(() => {});
    }
  }, [role]);

  // Close drawer on route change / escape — cheap UX win for a mobile overlay
  useEffect(() => {
    if (!sidebarOpen) return;
    function onKey(e) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  const user =
    role === "admin"
      ? { name: "Administrator", role: "Firm Administrator" }
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
    <div className="h-screen overflow-hidden bg-surface">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* FIXED SIDEBAR */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-40
          w-[220px] lg:w-[160px]
          transform transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <Sidebar
          role={role}
          user={user}
          onNavigate={() => setSidebarOpen(false)}
        />
      </aside>

      {/* MAIN AREA */}
      <div className="lg:ml-[160px] h-screen flex flex-col">
        {/* FIXED TOPBAR */}
        <header className="fixed top-0 right-0 left-0 lg:left-[160px] z-20">
          <TopBar
            searchPlaceholder={searchPlaceholder}
            onMenuClick={() => setSidebarOpen((v) => !v)}
          />
        </header>

        {/* ONLY THIS AREA SCROLLS */}
        <main className="h-screen overflow-y-auto overflow-x-hidden pt-6">
          <div className="pt-[64px] p-6 max-w-content mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
