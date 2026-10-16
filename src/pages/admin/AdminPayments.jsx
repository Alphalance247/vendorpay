import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";
import TutorialCard from "../../components/ui/TutorialCard";
import AppLayout from "../../components/layout/AppLayout";
import Card from "../../components/ui/Card";
import StatusChip from "../../components/ui/StatusChip";
import { formatCurrency, formatDate } from "../../lib/utils";
import { invoiceService } from "../../lib/services/invoiceService";

function totalsByCurrency(items) {
  const totals = {};
  items.forEach((p) => {
    const currency = p.currency ?? "USD";
    totals[currency] = (totals[currency] ?? 0) + p.amount;
  });
  return totals;
}

function formatTotals(items) {
  const totals = totalsByCurrency(items);
  if (Object.keys(totals).length === 0) return formatCurrency(0, "USD");
  return Object.entries(totals)
    .map(([currency, amount]) => formatCurrency(amount, currency))
    .join(" + ");
}
// const STATUS_MAP = { paid: 'Paid', funding: 'Awaiting Payment', rejected: 'Denied' };

// const TABS = [
//   { key: 'Paid', dbStatus: 'paid', icon: CheckCircle, accent: 'text-success' },
//   { key: 'Awaiting Payment', dbStatus: 'funding', icon: Clock, accent: 'text-warning' },
//   { key: 'Denied', dbStatus: 'rejected', icon: XCircle, accent: 'text-error' },
// ];

// The tabs (and summary cards) shown on the page. Which backend statuses
// fall under each tab is decided by TAB_BY_STATUS below.
const TABS = [
  { key: "Paid", icon: CheckCircle, accent: "text-success" },
  { key: "Awaiting Payment", icon: Clock, accent: "text-warning" },
  { key: "Denied", icon: XCircle, accent: "text-error" },
];

// GET /invoices/admin/payments returns pre-computed count + total per
// status bucket (paid / awaiting_payment / denied), alongside `items` and
// `total` (grand count). Maps each tab to its backend aggregate key so the
// summary cards read those directly instead of recomputing from `items`.
const AGGREGATE_KEY_BY_TAB = {
  Paid: "paid",
  "Awaiting Payment": "awaiting_payment",
  Denied: "denied",
};

const EMPTY_AGGREGATE = { count: 0, total: { amount: 0, currency: "USD" } };

// Which tab each backend status belongs to. Money has gone out for every
// status in the Paid tab — the vendor may since have confirmed or disputed it.
const TAB_BY_STATUS = {
  paid: "Paid",
  payment_confirmed: "Paid",
  payment_disputed: "Paid",
  funding: "Awaiting Payment",
  rejected: "Denied",
  submitted: "Awaiting Payment",
  reviewed: "Awaiting Payment",
  flagged: "Awaiting Payment",
};
// const PAID_STATUSES = ["paid", "payment_confirmed", "payment_disputed"];

const STATUS_LABEL = {
  paid: "Paid",
  payment_confirmed: "Payment Confirmed",
  payment_disputed: "Payment Disputed",
  funding: "Awaiting Payment",
  rejected: "Denied",
  submitted: "Submitted",
  reviewed: "Under Review",
  flagged: "Flagged",
};
export default function AdminPayments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [aggregates, setAggregates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Paid");
  const [search, setSearch] = useState("");

  useEffect(() => {
    invoiceService
      .getAdminPayments({ page_size: 200 })
      .then((data) => {
        setPayments(data.items ?? []);
        setAggregates({
          paid: data.paid,
          awaiting_payment: data.awaiting_payment,
          denied: data.denied,
        });
      })
      .catch(() => setError("Failed to load payments."))
      .finally(() => setLoading(false));
  }, []);
  // Expression body, so the comparison is returned — with `{ ... }` and no
  // `return` the filter keeps nothing and every tab is empty.
  const byTab = (tab) =>
    payments.filter((p) => TAB_BY_STATUS[p.status] === tab);

  // Count + total per tab come straight from the backend's aggregates
  // rather than being recomputed from the loaded `items` page.
  const aggregateFor = (tab) =>
    aggregates[AGGREGATE_KEY_BY_TAB[tab]] ?? EMPTY_AGGREGATE;
  const counts = Object.fromEntries(
    TABS.map(({ key }) => [key, aggregateFor(key).count ?? 0]),
  );
  const totals = Object.fromEntries(
    TABS.map(({ key }) => {
      const { total } = aggregateFor(key);
      return [key, formatCurrency(total?.amount ?? 0, total?.currency ?? "USD")];
    }),
  );

  const filtered = byTab(activeTab).filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.vendor_name?.toLowerCase().includes(q) ||
      p.invoice_number?.toLowerCase().includes(q) ||
      p.payment_rail?.toLowerCase().includes(q)
    );
  });

  return (
    <AppLayout role="admin">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">
              Payments
            </h1>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Track vendor disbursements across every status.
            </p>
          </div>
          {/* <Button variant="secondary" size="sm">
            <Download size={14} /> Export
          </Button> */}
        </div>

        <TutorialCard
          id="admin-payments"
          title="Tracking Disbursements"
          description="Monitor all vendor payments from funding through vendor confirmation."
          tips={[
            "The Paid tab shows fully confirmed payments; Awaiting Payment shows funded invoices not yet confirmed by the vendor.",
            "Denied shows invoices that were rejected before payment — the vendor will need to resubmit.",
            "Search by vendor name, invoice number, or payment rail to locate specific records quickly.",
            "Click any row to open the full invoice detail and complete audit trail.",
          ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TABS.map(({ key, icon: Icon, accent }) => (
            <Card key={key}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  {key}
                </p>
                <Icon size={16} className={accent} />
              </div>
              {loading ? (
                <Loader2
                  size={18}
                  className="animate-spin text-secondary mt-2"
                />
              ) : (
                <>
                  {
                    <p className="text-2xl font-bold tnum text-on-surface mt-1">
                      {counts[key] ?? 0}
                    </p>
                  }
                  {/* {payments.} */}
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Total {totals[key] ?? formatCurrency(0, "USD")}
                  </p>
                </>
              )}
            </Card>
          ))}
        </div>

        <Card className="p-0 overflow-x-auto">
          <div className="flex border-b border-outline-variant  w-full min-w-[820px]">
            {TABS.map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 whitespace-nowrap flex-shrink-0 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? "border-secondary text-secondary bg-secondary/5"
                    : "border-transparent text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Icon size={15} />
                {key}
                <span className="text-xs bg-surface-container px-1.5 py-0.5 rounded-full text-on-surface-variant">
                  {counts[key] ?? 0}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant w-full">
            <div className="relative flex-1 max-w-md">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by vendor, invoice, or rail..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-surface-container rounded border border-outline-variant focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-secondary" />
              <span className="ml-2 text-sm text-on-surface-variant">
                Loading payments...
              </span>
            </div>
          ) : error ? (
            <p className="px-6 py-10 text-center text-sm text-error">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-on-surface-variant">
              No {activeTab.toLowerCase()} payments
              {search ? " match your search" : ""}.
            </p>
          ) : (
            <>
              {/* Desktop / tablet: table */}
              <div className=" ">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-container border-b border-outline-variant">
                      {[
                        "Vendor",
                        "Invoice #",
                        "Rail",
                        "Amount",
                        "Date",
                        "Status",
                        // "Action",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-on-surface-variant whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {filtered.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-surface-container/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/admin/invoices/${p.id}`)}
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-on-surface whitespace-nowrap">
                            {p.vendor_name ?? "—"}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap">
                          {p.invoice_number}
                        </td>
                        <td className="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap">
                          {p.payment_rail ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold tnum text-on-surface whitespace-nowrap">
                          {formatCurrency(p.amount, p.currency)}
                        </td>
                        <td className="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap">
                          {formatDate(p.payment_date ?? p.submitted_at)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusChip
                            status={STATUS_LABEL[p.status] ?? p.status}
                            className="flex-shrink-0 whitespace-nowrap"
                          />
                        </td>
                        {/* <td
                          className="px-6 py-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {PAID_STATUSES.includes(p.status) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1.5"
                              title="Receipt"
                            >
                              <Receipt size={15} />
                            </Button>
                          )}
                        </td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Phone: stacked cards */}
              {/* <div className="md:hidden divide-y divide-outline-variant">
                {filtered.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/admin/invoices/${p.id}`)}
                    className="px-4 py-4 active:bg-surface-container/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">{p.vendor_name ?? '—'}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">{p.invoice_number}</p>
                      </div>
                      <StatusChip status={STATUS_LABEL[p.status] ?? p.status} className="flex-shrink-0" />
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 text-xs">
                      <div>
                        <span className="text-on-surface-variant">Amount: </span>
                        <span className="font-semibold tnum text-on-surface">{formatCurrency(p.amount, p.currency)}</span>
                      </div>
                      {p.payment_rail && (
                        <div>
                          <span className="text-on-surface-variant">Rail: </span>
                          <span className="text-on-surface font-medium">{p.payment_rail}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-on-surface-variant">Date: </span>
                        <span className="text-on-surface">{formatDate(p.payment_date ?? p.submitted_at)}</span>
                      </div>
                    </div>
                    {PAID_STATUSES.includes(p.status) && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Button variant="secondary" size="sm" className="w-full mt-3 flex items-center justify-center gap-1.5">
                          <Receipt size={13} /> Receipt
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div> */}
            </>
          )}

          <div className="px-6 py-3 border-t border-outline-variant flex flex-col sm:flex-row items-center gap-1 sm:justify-between">
            <p className="text-xs text-on-surface-variant">
              Showing {filtered.length} of {counts[activeTab] ?? 0}{" "}
              {activeTab.toLowerCase()} payments
            </p>
            <p className="text-xs font-semibold tnum text-on-surface">
              Total {formatTotals(filtered)}
            </p>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
