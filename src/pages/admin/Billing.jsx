import { useEffect, useState } from "react";
import {
  Check,
  Receipt,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import TutorialCard from "../../components/ui/TutorialCard";
import AppLayout from "../../components/layout/AppLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
// import Input from '../../components/ui/Input';
import Modal from "../../components/ui/Modal";
import StatusChip from "../../components/ui/StatusChip";
import { useConfirm } from "../../hooks/useConfirm";
import { useToast } from "../../components/ui/Toast";
import { formatCurrency, formatDate, cn } from "../../lib/utils";
import { vendorService } from "../../lib/services/vendorService";
import {
  useBillingStatus,
  useBillingPlanList,
  useChangeBilling,
  useBillingPortal,
  useBillingHistory,
} from "../../hooks/useQueries/billingPlan/useBillingPlanList";

const HISTORY_PAGE_SIZE = 10;

const INVOICE_STATUS_LABELS = {
  paid: "Paid",
  open: "Pending",
  draft: "Draft",
  void: "Void",
  uncollectible: "Uncollectible",
};

// Receipt links come from the API; only follow ones that point at Stripe so a
// bad or tampered response can't send an admin to an arbitrary site.
function safeStripeUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" &&
      (u.hostname === "stripe.com" || u.hostname.endsWith(".stripe.com"))
      ? u.toString()
      : null;
  } catch {
    return null;
  }
}

// /billing/invoices returns Stripe invoices (`created` in Unix seconds,
// amounts in cents). Already-simplified rows (`date`, `amount` in major units)
// are accepted too, so either backend shape renders correctly.
function normalizeBillingInvoice(inv) {
  const cents = inv.amount_paid ?? inv.total ?? inv.amount_due;
  return {
    id: inv.id,
    date:
      inv.date ??
      (inv.created ? new Date(inv.created * 1000).toISOString() : null),
    amount: inv.amount ?? (cents != null ? cents / 100 : null),
    currency: (inv.currency || "usd").toUpperCase(),
    status:
      INVOICE_STATUS_LABELS[inv.status?.toLowerCase()] ?? inv.status ?? "—",
    description:
      inv.description ??
      inv.lines?.data?.[0]?.description ??
      (inv.number ? `Invoice ${inv.number}` : "Subscription"),
    receiptUrl: safeStripeUrl(inv.invoice_pdf ?? inv.hosted_invoice_url),
  };
}

function ReceiptLink({ url, className = "" }) {
  if (!url) {
    return (
      <span
        title="Receipt not available"
        className={cn("inline-flex p-1.5 opacity-30", className)}
      >
        <Receipt size={14} className="text-on-surface-variant" />
      </span>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title="Download receipt"
      className={cn(
        "inline-flex p-1.5 rounded hover:bg-surface-container transition-colors",
        className,
      )}
    >
      <Receipt size={14} className="text-on-surface-variant" />
    </a>
  );
}

function renewalDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

// Billing status may report the plan by slug ("free") or by name ("Free"),
// so match either, case-insensitively.
function isPlan(plan, planRef) {
  const ref = planRef?.toLowerCase();
  return (
    !!ref &&
    (plan.slug?.toLowerCase() === ref || plan.name?.toLowerCase() === ref)
  );
}

function ChangePlanModal({
  open,
  onClose,
  currentPlanSlug,
  plans,
  plansLoading,
}) {
  const [selected, setSelected] = useState(
    () =>
      plans.find((p) => isPlan(p, currentPlanSlug))?.slug ?? currentPlanSlug,
  );
  const changePlan = useChangeBilling();
  const billingPortal = useBillingPortal();
  // /billing/checkout-session only works for a brand-new subscription
  // (Free -> paid) — it 400s with "Already on a paid plan — use the
  // billing portal to change plans" once a paid subscription already
  // exists, so switching between paid plans has to go through the portal
  // instead of starting a new checkout session.
  const currentPlan = plans.find((p) => p.slug === currentPlanSlug);
  const isCurrentPlanPaid = (currentPlan?.price?.amount ?? 0) > 0;
  const confirming = changePlan.isPending || billingPortal.isPending;

  const handleConfirm = () => {
    if (isCurrentPlanPaid) {
      billingPortal.mutate();
    } else {
      changePlan.mutate({ plan: selected });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change Plan"
      subtitle="You'll be redirected to Stripe to complete this securely — no card details are handled by VendorPay."
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={confirming}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selected === currentPlanSlug || confirming}
          >
            {confirming ? "Redirecting..." : "Confirm Change"}
          </Button>
        </>
      }
    >
      {(changePlan.isError || billingPortal.isError) && (
        <p className="mb-3 text-xs text-error">
          {isCurrentPlanPaid
            ? "Couldn't open the billing portal. Please try again."
            : "Couldn't start checkout. Please try again."}
        </p>
      )}
      {isCurrentPlanPaid && (
        <p className="mb-3 text-xs text-on-surface-variant">
          You're already on a paid plan — confirming here opens Stripe's billing
          portal, where you can switch plans directly.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {plansLoading ? (
          <Loader2 size={14} className="animate-spin text-on-surface-variant" />
        ) : (
          plans.map((plan) => {
            const isFree = plan.slug === "free";
            const isSelected = selected === plan.slug;
            const isCurrent = plan.slug === currentPlanSlug;
            return (
              <button
                key={plan.slug}
                type="button"
                onClick={() => {
                  if (!isFree) {
                    setSelected(plan.slug);
                  }
                }}
                disabled={plan.slug === "free"}
                className={cn(
                  "relative text-left rounded-xl border-2 p-4 transition-all flex flex-col",
                  isFree
                    ? "border-outline-variant bg-surface-container-low opacity-50 cursor-not-allowed"
                    : isSelected
                      ? "border-secondary bg-secondary/5"
                      : plan.most_popular
                        ? "border-secondary/40 bg-white hover:border-secondary"
                        : "border-outline-variant bg-white hover:border-outline",
                )}
              >
                {isCurrent && (
                  <span className="absolute -top-2.5 left-4 bg-inverse-surface text-inverse-on-surface text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                    Current Plan
                  </span>
                )}
                {plan.most_popular && (
                  <span className="absolute -top-2.5 right-4 bg-secondary text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                    Most Popular
                  </span>
                )}
                <p className="font-semibold text-on-surface text-sm">
                  {plan.name}
                </p>
                <p className="mt-3">
                  <span className="text-xl font-bold text-on-surface">
                    {`$${plan.price.amount}`}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    /{plan.price.interval}
                  </span>
                </p>
                <ul className="mt-3 space-y-1.5 flex-1">
                  {(plan.plan_detail ?? []).map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-1.5 text-xs text-on-surface-variant"
                    >
                      <Check
                        size={13}
                        className="text-success mt-0.5 flex-shrink-0"
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <div
                  className={cn(
                    "mt-3 w-5 h-5 rounded-full border-2 flex items-center justify-center self-end",
                    isSelected
                      ? "bg-secondary border-secondary"
                      : "border-outline-variant",
                  )}
                >
                  {isSelected && <Check size={12} className="text-white" />}
                </div>
              </button>
            );
          })
        )}
      </div>
    </Modal>
  );
}

// function UpdateCardModal({ open, onClose, onSave }) {
//   const [form, setForm] = useState({ number: '', expiry: '', cvc: '' });

//   function handleChange(e) {
//     const { name, value } = e.target;
//     setForm((f) => ({ ...f, [name]: value }));
//   }

//   const digits = form.number.replace(/\D/g, '');
//   const valid = digits.length >= 12 && /^\d{2}\/\d{2}$/.test(form.expiry) && form.cvc.length >= 3;

//   function handleSubmit(e) {
//     e.preventDefault();
//     if (!valid) return;
//     onSave({ brand: 'Visa', last4: digits.slice(-4), expiry: form.expiry });
//     setForm({ number: '', expiry: '', cvc: '' });
//   }

//   return (
//     <Modal
//       open={open}
//       onClose={onClose}
//       title="Update Payment Method"
//       subtitle="This is a preview — no card is actually charged or stored."
//       footer={
//         <>
//           <Button variant="ghost" onClick={onClose}>Cancel</Button>
//           <Button onClick={handleSubmit} disabled={!valid}>Save Card</Button>
//         </>
//       }
//     >
//       <form onSubmit={handleSubmit} className="space-y-4">
//         <Input label="Card Number" name="number" value={form.number} onChange={handleChange} placeholder="4242 4242 4242 4242" autoFocus />
//         <div className="grid grid-cols-2 gap-4">
//           <Input label="Expiry (MM/YY)" name="expiry" value={form.expiry} onChange={handleChange} placeholder="12/27" />
//           <Input label="CVC" name="cvc" value={form.cvc} onChange={handleChange} placeholder="123" />
//         </div>
//       </form>
//     </Modal>
//   );
// }

export default function Billing() {
  // `data` is undefined until the query resolves (react-query's initial
  // state, not an empty array) — calling .find() on it directly before
  // then throws, so every usage below goes through `plans` instead.
  const { data: billingPlanList, isLoading: plansLoading } =
    useBillingPlanList();
  const plans = billingPlanList ?? [];
  const [planSlug, setPlanSlug] = useState("");
  const [status, setStatus] = useState("active"); // active | canceled
  // const [card, setCard] = useState({ brand: 'Visa', last4: '4242', expiry: '12/27' });
  // One entry per visited page: the `starting_after` cursor used to fetch it
  // (null for the first page). Going back just pops the last cursor.
  const [historyCursors, setHistoryCursors] = useState([null]);
  const historyPage = historyCursors.length;
  const {
    data: historyData,
    isLoading: historyLoading,
    isFetching: historyFetching,
    isError: historyError,
  } = useBillingHistory({
    limit: HISTORY_PAGE_SIZE,
    startingAfter: historyCursors[historyCursors.length - 1],
  });
  const historyRaw = Array.isArray(historyData)
    ? historyData
    : (historyData?.data ?? historyData?.items ?? historyData?.invoices ?? []);
  const history = historyRaw.map(normalizeBillingInvoice);
  const historyHasMore = !!historyData?.has_more;

  function goToNextHistoryPage() {
    const lastId = historyRaw[historyRaw.length - 1]?.id;
    if (historyHasMore && lastId) setHistoryCursors((c) => [...c, lastId]);
  }

  function goToPrevHistoryPage() {
    setHistoryCursors((c) => (c.length > 1 ? c.slice(0, -1) : c));
  }
  const [vendorCount, setVendorCount] = useState(null);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  // const [cardModalOpen, setCardModalOpen] = useState(false);
  const billingPortal = useBillingPortal();
  const { confirm, confirmEl } = useConfirm();
  const { toast } = useToast();

  useEffect(() => {
    vendorService
      .getAllVendors()
      .then((list) => setVendorCount(Array.isArray(list) ? list.length : 0))
      .catch(() => setVendorCount(null));
  }, []);

  // Seeds planId/status from the real subscription once it loads — kept as
  // local state (rather than reading billingStatus directly) so Change
  // Plan/Cancel/Reactivate below can keep optimistically updating them the
  // way they already do in this preview. Done during render (React's
  // sanctioned way to adjust state when an input changes) rather than in a
  // useEffect, which would fire the setState a frame too late and trigger
  // the "cascading renders" lint rule.
  const { data: billingStatus, isLoading: statusLoading } = useBillingStatus();

  const [prevBillingStatus, setPrevBillingStatus] = useState(billingStatus);
  if (billingStatus !== prevBillingStatus) {
    setPrevBillingStatus(billingStatus);
    if (billingStatus) {
      const resolvedPlanSlug = billingStatus.plan ?? billingStatus.plan;
      if (resolvedPlanSlug) setPlanSlug(resolvedPlanSlug);
      if (billingStatus.status) setStatus(billingStatus.status);
    }
  }

  // const plan = plans.find((p) => p.slug === planSlug) ?? plans[0] ?? {};
  const effectiveVendorCount = billingStatus?.vendor?.used ?? vendorCount;
  const vendorLimit = billingStatus?.vendors?.limit;
  const vendorUsed = billingStatus?.vendors?.used;
  const renewsOn =
    billingStatus?.current_period_end ?? billingStatus?.renews_at;
  const planName = billingStatus?.plan;
  const invoiceUsed = billingStatus?.invoices_this_month?.used;
  const invoiceLimit = billingStatus?.invoices_this_month?.limit;
  const usagePct =
    effectiveVendorCount == null || !Number.isFinite(vendorLimit)
      ? 0
      : Math.min(100, Math.round((effectiveVendorCount / vendorLimit) * 100));
  // Keep the bar empty until billing status arrives; otherwise the missing
  // limit reads as "unlimited" and the bar flashes full on first render.
  const vendorBarPct = !billingStatus
    ? 0
    : Number.isFinite(vendorLimit) && vendorLimit > 0
      ? Math.min(100, ((vendorUsed ?? 0) / vendorLimit) * 100)
      : 100;
  const invoiceBarPct =
    invoiceUsed == null || !Number.isFinite(invoiceLimit)
      ? 0
      : Math.min(100, (invoiceUsed / invoiceLimit) * 100);
  // function handleSaveCard(newCard) {
  //   setCard(newCard);
  //   setCardModalOpen(false);
  //   toast('Payment method updated.');
  // }
  async function handleCancel() {
    const ok = await confirm({
      title: "Cancel Subscription",
      message:
        "You’ll be redirected to Stripe to manage your subscription. Your subscription will remain active until the end of the current billing period unless Stripe indicates otherwise.",
      confirmLabel: "Continue to Stripe",
      variant: "danger",
    });

    if (!ok) return;

    billingPortal.mutate();
  }

  function handleReactivate() {
    setStatus("active");
    toast("Subscription reactivated.");
  }

  return (
    <AppLayout role="admin">
      {confirmEl}
      <ChangePlanModal
        key={planModalOpen ? `open-${planSlug}` : "closed"}
        open={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        currentPlanSlug={planSlug}
        plans={plans}
        plansLoading={plansLoading}
      />
      {/* <UpdateCardModal open={cardModalOpen} onClose={() => setCardModalOpen(false)} onSave={handleSaveCard} /> */}

      <div className="space-y-6">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            Billing & Subscription
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Manage your VendorPay plan, payment method, and billing history.
          </p>
        </div>

        <TutorialCard
          id="admin-billing"
          title="Managing Your Subscription"
          description="This is what your company pays VendorPay — separate from the payments you send to your own vendors."
          tips={[
            "Your plan determines how many vendors you can onboard — see the usage meter below.",
            "Changing plans here applies immediately in this preview; no payment is actually processed.",
            "Canceling keeps access until the end of your current billing period, then reverts your workspace to read-only.",
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-3">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-on-surface capitalize">
                    {planName} Plan
                  </p>
                  <StatusChip
                    status={status === "active" ? "Active" : "Inactive"}
                  />
                  {(statusLoading || plansLoading) && (
                    <Loader2
                      size={14}
                      className="animate-spin text-on-surface-variant"
                    />
                  )}
                </div>
                <p className="text-sm text-on-surface-variant mt-1">
                  {/* <span className="font-semibold text-on-surface">
                    {plan.price?.amount === 0 ? 'Free' : plan.price?.amount != null ? `$${plan.price.amount}` : ''}
                  </span>
                  {plan.price?.interval ? `/${plan.price.interval}` : ''} */}
                  {status === "active"
                    ? `  Renews ${formatDate(renewsOn ?? renewalDate())}`
                    : " · Access ends at period end"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {status === "canceled" && (
                  <Button variant="secondary" onClick={handleReactivate}>
                    Reactivate
                  </Button>
                )}
                <Button onClick={() => setPlanModalOpen(true)}>
                  Change Plan
                </Button>
              </div>
            </div>

            <div className="mt-5 mb-5 pt-5 border-t border-outline-variant">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-on-surface-variant">Vendors used</span>
                <span className="font-medium text-on-surface tnum">
                  {vendorUsed ?? "—"} /{" "}
                  {!billingStatus
                    ? "—"
                    : Number.isFinite(vendorLimit)
                      ? vendorLimit
                      : "Unlimited"}
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-container overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    usagePct >= 90 ? "bg-error" : "bg-success",
                  )}
                  style={{ width: `${vendorBarPct}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-on-surface-variant">Invoice used</span>
                <span className="font-medium text-on-surface tnum">
                  {invoiceUsed ?? "—"} /{" "}
                  {!billingStatus
                    ? "—"
                    : Number.isFinite(invoiceLimit)
                      ? invoiceLimit
                      : "Unlimited"}
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-container overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    usagePct >= 90 ? "bg-error" : "bg-success",
                  )}
                  style={{ width: `${invoiceBarPct}%` }}
                />
              </div>
            </div>
          </Card>

          {/* <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Payment Method</p>
              <CreditCard size={16} className="text-on-surface-variant" />
            </div>
            <p className="text-sm font-semibold text-on-surface">{card.brand} •••• {card.last4}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">Expires {card.expiry}</p>
            <Button variant="secondary" size="sm" className="w-full mt-4" onClick={() => setCardModalOpen(true)}>
              Update Payment Method
            </Button>
          </Card> */}
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
            <p className="text-sm font-semibold text-on-surface">
              Billing History
            </p>
            {historyFetching && !historyLoading && (
              <Loader2
                size={14}
                className="animate-spin text-on-surface-variant"
              />
            )}
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-secondary" />
            </div>
          ) : historyError ? (
            <p className="px-6 py-10 text-center text-sm text-error">
              Couldn't load billing history. Please try again.
            </p>
          ) : history.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-on-surface-variant">
              No billing history yet.
            </p>
          ) : (
            <>
              {/* Desktop / tablet: table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-container border-b border-outline-variant">
                      {["Date", "Description", "Amount", "Status", ""].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {history.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-surface-container/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-on-surface-variant">
                          {row.date ? formatDate(row.date) : "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-on-surface capitalize">
                          {`${row.description}/`}
                          <span className="text-sm text-on-surface-variant font-medium">
                            Monthly
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold tnum text-on-surface">
                          {row.amount != null
                            ? formatCurrency(row.amount, row.currency)
                            : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <StatusChip status={row.status} />
                        </td>
                        <td className="px-6 py-4">
                          <ReceiptLink url={row.receiptUrl} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Phone: stacked cards */}
              <div className="md:hidden divide-y divide-outline-variant">
                {history.map((row) => (
                  <div
                    key={row.id}
                    className="px-4 py-4 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-on-surface">
                        {row.description}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {row.date ? formatDate(row.date) : "—"}
                      </p>
                      <div className="mt-1.5">
                        <StatusChip status={row.status} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold tnum text-on-surface">
                        {row.amount != null
                          ? formatCurrency(row.amount, row.currency)
                          : "—"}
                      </p>
                      <ReceiptLink
                        url={row.receiptUrl}
                        className="mt-1 -mr-1.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {(historyPage > 1 || historyHasMore) && (
            <div className="px-6 py-3 border-t border-outline-variant flex items-center justify-between">
              <p className="text-xs text-on-surface-variant">
                Page {historyPage}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={goToPrevHistoryPage}
                  disabled={historyPage === 1 || historyFetching}
                  aria-label="Previous page"
                  className="p-1.5 rounded text-on-surface-variant hover:bg-surface-container disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={goToNextHistoryPage}
                  disabled={!historyHasMore || historyFetching}
                  aria-label="Next page"
                  className="p-1.5 rounded text-on-surface-variant hover:bg-surface-container disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </Card>

        {planName !== "free" && (
          <Card className="border-error/30 bg-error/5">
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={17} className="text-error" />
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold text-on-surface">
                  Cancel Subscription
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Your workspace will keep access until the end of the current
                  billing period, then lose access to paid features.
                </p>
              </div>
              <div className="flex flex-col items-end">
                {status === "active" ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleCancel}
                    disabled={billingPortal.isPending}
                  >
                    {billingPortal.isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        Opening Stripe...
                      </span>
                    ) : (
                      "Cancel Subscription"
                    )}
                  </Button>
                ) : (
                  <StatusChip status={status} />
                )}

                {billingPortal.isError && (
                  <p className="mt-2 max-w-xs text-right text-xs text-error">
                    {billingPortal.error?.response?.data?.detail ||
                      "Unable to open Stripe Billing Portal. Please try again."}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
