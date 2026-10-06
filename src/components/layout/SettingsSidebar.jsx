import { useNavigate } from "react-router-dom";
import {
  User,
  Shield,
  ChevronLeft,
  X,
  Building2,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useEffect } from "react";

export default function SettingsSidebar({
  role = "vendor",
  open = false,
  onClose,
  activePage,
  onPageChange,
}) {
  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const navigate = useNavigate();
  const items =
    role === "admin" &&
    [
      {
        heading: "Account",
        items: [
          {
            label: "Profile",
            key: "profile",
            icon: User,
          },
          {
            label: "Security",
            key: "security",
            icon: Shield,
          },
        ],
      },
      {
        heading: "Workspace",
        items: [
          {
            label: "Company",
            key: "company",
            icon: Building2,
          },
          // {
          //   label: "Teams & Permissions",
          //   key: "teams-and-permissions",
          //   icon: Users,
          // },
        ],
      },
      // {
      //   heading: "Payments",
      //   items: [
      //     {
      //       label: "Banking & payout rails",
      //       key: "banking-and-payout-rails",
      //       icon: LandmarkIcon,
      //     },
      //     {
      //       label: "Payout limit",
      //       key: "payout-limit",
      //       icon: ChartNoAxesColumn,
      //     },
      //   ],
      // },
    ]

  //   const handleNavigate = () => {
  //     onClose?.();
  //   };

  const handleBackToDashboard = () => {
    onClose?.();
    navigate(-1);
  };

  return (
    <>
      {/* Mobile overlay */}
      {/* {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          aria-hidden="true"
        />
      )} */}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-72 max-w-[85vw]",
          "bg-inverse-surface flex flex-col z-50",
          "transition-transform duration-200 ease-in-out",
          "lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Logo icon */}
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                <span
                  className="text-white text-lg font-bold leading-none"
                  style={{
                    fontFamily: "Georgia, serif",
                    letterSpacing: "-1px",
                  }}
                >
                  ~
                </span>
              </div>

              {/* Logo text */}
              <div className="min-w-0">
                <p className="font-headline-sm text-headline-sm text-inverse-on-surface uppercase leading-none truncate">
                  Alluvium
                </p>

                <p className="font-label-eyebrow text-label-eyebrow text-secondary-fixed-dim uppercase tracking-widest mt-1">
                  VendorPay
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded text-inverse-on-surface/70 hover:bg-white/10 hover:text-inverse-on-surface transition-colors flex-shrink-0"
              aria-label="Close settings menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Back to dashboard */}
        <div className="px-5 pt-6 pb-4">
          <button
            type="button"
            onClick={handleBackToDashboard}
            className="inline-flex items-center gap-2 text-sm text-inverse-on-surface/70 hover:text-inverse-on-surface transition-colors"
          >
            <ChevronLeft size={16} />
            Back
          </button>
        </div>

        {/* Settings heading */}
        <div className="px-5 pb-5">
          <h2 className="text-xl font-semibold text-inverse-on-surface">
            Settings
          </h2>

          <p className="text-xs text-inverse-on-surface/60 mt-1 leading-relaxed">
            Manage your account and preferences
          </p>
        </div>

        {/* Settings navigation */}
        <nav className="flex-1 px-3 pb-6 overflow-y-auto">
          {items.map((section, sectionIndex) => (
            <div
              key={section.heading}
              className={cn("space-y-1", sectionIndex > 0 && "mt-6")}
            >
              <p className="px-3 mb-2 text-[12px] font-semibold capitalize tracking-[0.15em] text-inverse-on-surface/60">
                {section.heading}
              </p>

              {section.items.map(({ label, key, icon: Icon }) => {
                const isActive = activePage === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onPageChange(key);
                      onClose?.();
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3.5 py-2.5 rounded",
                      "font-label-caps",
                      "text-left transition-colors",
                      isActive
                        ? "bg-primary text-on-primary font-medium"
                        : "text-inverse-on-surface/70 hover:bg-white/10 hover:text-inverse-on-surface font-normal",
                    )}
                  >
                    <Icon size={17} className="flex-shrink-0" />

                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
