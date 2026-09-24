import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Clock,
  History,
  Receipt,
  Loader2,
  Download,
  Plus,
  UserPlus,
  Users,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Tooltip from "../../components/ui/Tooltip";
import { formatCurrency } from "../../lib/utils";
import { vendorService } from "../../lib/services/vendorService";

function currencyValues(map) {
  if (!map || Object.keys(map).length === 0) return [formatCurrency(0, "USD")];
  return Object.entries(map).map(([currency, amount]) =>
    formatCurrency(amount, currency),
  );
}

// Shown in place of the usual stat/activity view until the workspace has at
// least one vendor — a brand-new account has nothing to review yet, so
// telling the admin what to set up next is more useful than empty stats.
function GettingStartedPanel({ navigate }) {
  const steps = [
    {
      key: "invite-vendors",
      label: "Invite your vendors",
      description: "Get suppliers onboarded so they can submit invoices.",
      actionLabel: "Invite Vendors",
      onAction: () => navigate("/admin/vendors"),
    },
    {
      key: "approval-rules",
      label: "Set your approval rules",
      description: "Define who signs off on an invoice before it's paid.",
    },
    {
      key: "funding-account",
      label: "Connect a funding account",
      description: "Link the account VendorPay will disburse payments from.",
    },
  ];

  return (
    <Card>
      <p className="text-sm font-semibold text-on-surface">
        Get your workspace ready
      </p>
      <p className="text-xs text-on-surface-variant mt-0.5 mb-4">
        A few things to set up before you start paying vendors.
      </p>
      <div className="divide-y divide-outline-variant">
        {steps.map((step) => (
          <div
            key={step.key}
            className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-on-surface">
                {step.label}
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {step.description}
              </p>
            </div>
            {step.onAction ? (
              <Button
                size="sm"
                onClick={step.onAction}
                className="flex-shrink-0"
              >
                {step.actionLabel}
              </Button>
            ) : (
              <span className="flex-shrink-0 text-xs font-medium text-on-surface-variant bg-surface-low px-2.5 py-1 rounded-full">
                Coming soon
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorService
      .getAdminDashboard()
      .then(setDash)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pendingApprovals = dash?.pending_invoices ?? 0;
  const hasPendingApprovals = !loading && pendingApprovals > 0;
  const isFirstRun = !loading && (dash?.total_vendors ?? 0) === 0;

  const stats = [
    {
      label: "Total Vendors",
      value: loading ? "—" : (dash?.total_vendors ?? "—"),
      sub: "",
      subColor: "text-emerald",
      tip: "Vendors currently active in your workspace.",
    },
    {
      label: "Pending Approvals",
      value: loading ? "—" : pendingApprovals,
      sub: hasPendingApprovals ? "Requires action" : "",
      subColor: "text-error",
      highlight: hasPendingApprovals,
      tip: "Invoices waiting on your review. Highlighted in red when action is needed before they can be paid.",
    },
    {
      label: "Pending Payments",
      value: loading ? "—" : (dash?.pending_payments ?? "—"),
      sub: "",
      subColor: "text-on-surface-variant",
      tip: "Approved invoices waiting to be disbursed.",
    },
    {
      label: "Monthly Volume",
      values: loading ? null : currencyValues(dash?.monthly_volume_by_currency),
      value: loading ? "—" : undefined,
      sub: "",
      subColor: "text-on-surface-variant",
      tip: "Total invoice value processed this calendar month, by currency.",
    },
  ];

  const quickActions = isFirstRun
    ? [
        { label: "Invite Vendors", path: "/admin/vendors", icon: Users },
        { label: "Invite Team Members", path: "/admin/team", icon: UserPlus },
        // { label: 'Set Up Billing', path: '/admin/billing', icon: CreditCard },
      ]
    : [
        {
          label: "Review Pending Invoices",
          path: "/admin/invoices",
          icon: Receipt,
        },
        {
          label: "View All Vendors",
          path: "/admin/vendors",
          icon: AlertCircle,
        },
        { label: "Payment History", path: "/admin/payments", icon: Clock },
      ];

  return (
    <AppLayout
      role="admin"
      searchPlaceholder="Search vendors, invoices, or transactions..."
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">
              Finance Dashboard
            </h1>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Manage your organization&apos;s outgoing capital and vendor
              relations.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              <Download size={14} /> Export Report
            </Button>
            <Tooltip text="Jump straight to the approval queue — you can also get there via the sidebar.">
              <Button size="sm" onClick={() => navigate("/admin/invoices")}>
                <Plus size={14} /> Review Invoices
              </Button>
            </Tooltip>
          </div>
        </div>

        {isFirstRun && <GettingStartedPanel navigate={navigate} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(
            ({ label, value, values, sub, subColor, highlight, tip }) => (
              <Card
                key={label}
                className={highlight ? "border-error/30 bg-error/5" : ""}
              >
                <Tooltip text={tip}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant cursor-default">
                    {label}
                  </p>
                </Tooltip>
                {loading ? (
                  <Loader2
                    size={20}
                    className="animate-spin text-secondary mt-2"
                  />
                ) : values ? (
                  <div className="space-y-0.5 mt-1">
                    {values.map((v, i) => (
                      <p
                        key={i}
                        className={`text-2xl font-bold tnum leading-tight ${highlight ? "text-error" : "text-on-surface"}`}
                      >
                        {v}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p
                    className={`text-2xl font-bold mt-1 tnum ${highlight ? "text-error" : "text-on-surface"}`}
                  >
                    {value}
                  </p>
                )}
                {sub && <p className={`text-xs mt-0.5 ${subColor}`}>{sub}</p>}
              </Card>
            ),
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-4">
              Invoice Status Breakdown
            </p>
            {dash?.status_breakdown ? (
              <div className="space-y-3">
                {Object.entries(dash.status_breakdown).map(([key, count]) => {
                  const total = Object.values(dash.status_breakdown).reduce(
                    (a, b) => a + b,
                    0,
                  );
                  const pct = total ? Math.round((count / total) * 100) : 0;
                  const colorMap = {
                    submitted: "bg-amber-400",
                    reviewed: "bg-sky-400",
                    funding: "bg-violet-400",
                    paid: "bg-emerald",
                    rejected: "bg-error",
                    flagged: "bg-orange-400",
                  };
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs text-on-surface-variant capitalize w-20 flex-shrink-0">
                        {key}
                      </span>
                      <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${colorMap[key] ?? "bg-emerald"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-on-surface tnum w-6 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">
                No data available.
              </p>
            )}
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-outline-variant">
              <span className="text-sm font-semibold text-on-surface">
                Quick Actions
              </span>
            </div>
            <div className="divide-y divide-outline-variant">
              {[
                ...quickActions,
                {
                  label: "Full Transaction History",
                  path: "/admin/payments",
                  icon: History,
                },
              ].map(({ label, path, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-surface-low/50 transition-colors text-left"
                >
                  <Icon size={16} className="text-on-surface-variant" />
                  <span className="text-sm text-on-surface">{label}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
