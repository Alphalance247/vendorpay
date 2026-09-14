import { useEffect, useState } from 'react';
import { Check, CreditCard, Receipt, AlertTriangle } from 'lucide-react';
import TutorialCard from '../../components/ui/TutorialCard';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import StatusChip from '../../components/ui/StatusChip';
import { useConfirm } from '../../hooks/useConfirm';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency, formatDate, cn } from '../../lib/utils';
import { PLANS } from '../../lib/plans';
import { vendorService } from '../../lib/services/vendorService';

const SEED_HISTORY = [
  { id: 1, date: '2026-08-03', description: 'Growth Plan — Monthly', amount: 149, status: 'Paid' },
  { id: 2, date: '2026-07-03', description: 'Growth Plan — Monthly', amount: 149, status: 'Paid' },
  { id: 3, date: '2026-06-03', description: 'Growth Plan — Monthly', amount: 149, status: 'Paid' },
];

function renewalDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

function ChangePlanModal({ open, onClose, currentPlanId, onConfirm }) {
  const [selected, setSelected] = useState(currentPlanId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change Plan"
      subtitle="Changes apply immediately in this preview — no payment is processed."
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm(selected)} disabled={selected === currentPlanId}>
            Confirm Change
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isSelected = selected === plan.id;
          const isCurrent = plan.id === currentPlanId;
          return (
            <button
              type="button"
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className={cn(
                'relative text-left rounded-xl border-2 p-4 transition-all flex flex-col',
                isSelected ? 'border-secondary bg-secondary/5' : 'border-outline-variant bg-white hover:border-outline'
              )}
            >
              {isCurrent && (
                <span className="absolute -top-2.5 left-4 bg-inverse-surface text-inverse-on-surface text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                  Current Plan
                </span>
              )}
              <p className="font-semibold text-on-surface text-sm">{plan.name}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{plan.blurb}</p>
              <p className="mt-3">
                <span className="text-xl font-bold text-on-surface">{plan.price}</span>
                <span className="text-xs text-on-surface-variant">{plan.period}</span>
              </p>
              <ul className="mt-3 space-y-1.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-on-surface-variant">
                    <Check size={13} className="text-emerald mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className={cn(
                'mt-3 w-5 h-5 rounded-full border-2 flex items-center justify-center self-end',
                isSelected ? 'bg-secondary border-secondary' : 'border-outline-variant'
              )}>
                {isSelected && <Check size={12} className="text-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

function UpdateCardModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({ number: '', expiry: '', cvc: '' });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  const digits = form.number.replace(/\D/g, '');
  const valid = digits.length >= 12 && /^\d{2}\/\d{2}$/.test(form.expiry) && form.cvc.length >= 3;

  function handleSubmit(e) {
    e.preventDefault();
    if (!valid) return;
    onSave({ brand: 'Visa', last4: digits.slice(-4), expiry: form.expiry });
    setForm({ number: '', expiry: '', cvc: '' });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Update Payment Method"
      subtitle="This is a preview — no card is actually charged or stored."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!valid}>Save Card</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Card Number" name="number" value={form.number} onChange={handleChange} placeholder="4242 4242 4242 4242" autoFocus />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Expiry (MM/YY)" name="expiry" value={form.expiry} onChange={handleChange} placeholder="12/27" />
          <Input label="CVC" name="cvc" value={form.cvc} onChange={handleChange} placeholder="123" />
        </div>
      </form>
    </Modal>
  );
}

export default function Billing() {
  const [planId, setPlanId] = useState('growth');
  const [status, setStatus] = useState('active'); // active | canceled
  const [card, setCard] = useState({ brand: 'Visa', last4: '4242', expiry: '12/27' });
  const [history] = useState(SEED_HISTORY);
  const [vendorCount, setVendorCount] = useState(null);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);

  const { confirm, confirmEl } = useConfirm();
  const { toast } = useToast();

  useEffect(() => {
    vendorService.getAllVendors()
      .then((list) => setVendorCount(Array.isArray(list) ? list.length : 0))
      .catch(() => setVendorCount(null));
  }, []);

  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0];
  const usagePct = vendorCount == null || !Number.isFinite(plan.vendorLimit)
    ? 0
    : Math.min(100, Math.round((vendorCount / plan.vendorLimit) * 100));

  function handleChangePlan(newPlanId) {
    const newPlan = PLANS.find((p) => p.id === newPlanId);
    setPlanId(newPlanId);
    setPlanModalOpen(false);
    toast(`Plan updated to ${newPlan.name}.`);
  }

  function handleSaveCard(newCard) {
    setCard(newCard);
    setCardModalOpen(false);
    toast('Payment method updated.');
  }

  function handleReceiptClick() {
    toast('Receipt download is a preview — not a real file yet.', { variant: 'info' });
  }

  async function handleCancel() {
    const ok = await confirm({
      title: 'Cancel Subscription',
      message: 'Your workspace will lose access to paid features at the end of the current billing period. This is a preview — no real subscription is being canceled.',
      confirmLabel: 'Cancel Subscription',
      variant: 'danger',
    });
    if (!ok) return;
    setStatus('canceled');
    toast('Subscription canceled.', { variant: 'info' });
  }

  function handleReactivate() {
    setStatus('active');
    toast('Subscription reactivated.');
  }

  return (
    <AppLayout role="admin" searchPlaceholder="Search billing history...">
      {confirmEl}
      <ChangePlanModal
        key={planModalOpen ? `open-${planId}` : 'closed'}
        open={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        currentPlanId={planId}
        onConfirm={handleChangePlan}
      />
      <UpdateCardModal open={cardModalOpen} onClose={() => setCardModalOpen(false)} onSave={handleSaveCard} />

      <div className="space-y-6">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Billing & Subscription</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Manage your VendorPay plan, payment method, and billing history.</p>
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
          <Card className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-on-surface">{plan.name} Plan</p>
                  <StatusChip status={status === 'active' ? 'Active' : 'Inactive'} />
                </div>
                <p className="text-sm text-on-surface-variant mt-1">
                  <span className="font-semibold text-on-surface">{plan.price}</span>{plan.period}
                  {status === 'active' ? ` · Renews ${formatDate(renewalDate())}` : ' · Access ends at period end'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {status === 'canceled' && (
                  <Button variant="secondary" onClick={handleReactivate}>Reactivate</Button>
                )}
                <Button onClick={() => setPlanModalOpen(true)}>Change Plan</Button>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-outline-variant">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-on-surface-variant">Vendors used</span>
                <span className="font-medium text-on-surface tnum">
                  {vendorCount ?? '—'} / {Number.isFinite(plan.vendorLimit) ? plan.vendorLimit : 'Unlimited'}
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-container overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', usagePct >= 90 ? 'bg-error' : 'bg-emerald')}
                  style={{ width: `${Number.isFinite(plan.vendorLimit) ? usagePct : 100}%` }}
                />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Payment Method</p>
              <CreditCard size={16} className="text-on-surface-variant" />
            </div>
            <p className="text-sm font-semibold text-on-surface">{card.brand} •••• {card.last4}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">Expires {card.expiry}</p>
            <Button variant="secondary" size="sm" className="w-full mt-4" onClick={() => setCardModalOpen(true)}>
              Update Payment Method
            </Button>
          </Card>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant">
            <p className="text-sm font-semibold text-on-surface">Billing History</p>
          </div>
          {/* Desktop / tablet: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-low border-b border-outline-variant">
                  {['Date', 'Description', 'Amount', 'Status', ''].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {history.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-low/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{formatDate(row.date)}</td>
                    <td className="px-6 py-4 text-sm text-on-surface">{row.description}</td>
                    <td className="px-6 py-4 text-sm font-semibold tnum text-on-surface">{formatCurrency(row.amount, 'USD')}</td>
                    <td className="px-6 py-4"><StatusChip status={row.status} /></td>
                    <td className="px-6 py-4">
                      <button
                        onClick={handleReceiptClick}
                        title="Download receipt"
                        className="p-1.5 rounded hover:bg-surface-container transition-colors"
                      >
                        <Receipt size={14} className="text-on-surface-variant" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phone: stacked cards */}
          <div className="md:hidden divide-y divide-outline-variant">
            {history.map((row) => (
              <div key={row.id} className="px-4 py-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-on-surface">{row.description}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{formatDate(row.date)}</p>
                  <div className="mt-1.5"><StatusChip status={row.status} /></div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold tnum text-on-surface">{formatCurrency(row.amount, 'USD')}</p>
                  <button
                    onClick={handleReceiptClick}
                    title="Download receipt"
                    className="p-1.5 rounded hover:bg-surface-container transition-colors mt-1 -mr-1.5"
                  >
                    <Receipt size={14} className="text-on-surface-variant" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-error/30 bg-red-50/30">
          <div className="flex flex-col sm:flex-row items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={17} className="text-error" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-on-surface">Cancel Subscription</p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Your workspace will keep access until the end of the current billing period, then lose access to paid features.
              </p>
            </div>
            {status === 'active' ? (
              <Button variant="danger" size="sm" onClick={handleCancel}>Cancel Subscription</Button>
            ) : (
              <StatusChip status="Inactive" />
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
