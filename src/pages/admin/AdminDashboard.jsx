import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, Clock, CheckCircle, Receipt, Loader2, Download, Plus,
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { formatCurrency } from '../../lib/utils';
import TutorialCard from '../../components/ui/TutorialCard';
import { vendorService } from '../../lib/services/vendorService';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorService.getAdminDashboard()
      .then(setDash)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Total Vendors', value: loading ? '—' : (dash?.total_vendors ?? '—'), sub: '', subColor: 'text-emerald' },
    { label: 'Pending Approvals', value: loading ? '—' : (dash?.pending_invoices ?? '—'), sub: 'Requires action', subColor: 'text-error', highlight: true },
    { label: 'Pending Payments', value: loading ? '—' : (dash?.pending_payments ?? '—'), sub: '', subColor: 'text-on-surface-variant' },
    { label: 'Monthly Volume', value: loading ? '—' : formatCurrency(dash?.monthly_volume ?? 0), sub: '', subColor: 'text-on-surface-variant' },
  ];

  return (
    <AppLayout role="admin" searchPlaceholder="Search vendors, invoices, or transactions...">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">Finance Dashboard</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">Manage your organization&apos;s outgoing capital and vendor relations.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              <Download size={14} /> Export Report
            </Button>
            <Button size="sm" onClick={() => navigate('/vendorpay/admin/invoices')}>
              <Plus size={14} /> Review Invoices
            </Button>
          </div>
        </div>

        <TutorialCard
          id="admin-dashboard"
          title="Finance Command Center"
          description="A real-time overview of your organisation's vendor payment pipeline."
          tips={[
            "The stat cards show total active vendors, invoices pending approval, payments awaiting disbursement, and monthly volume.",
            "Invoices highlighted in red indicate urgent items — pending approvals or disputed payments that need attention.",
            "Use Review Invoices to jump directly to the approval queue, or navigate via the sidebar for detailed management.",
          ]}
        />

        <div className="grid grid-cols-4 gap-4">
          {stats.map(({ label, value, sub, subColor, highlight }) => (
            <Card key={label} className={highlight ? 'border-error/30 bg-error/5' : ''}>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{label}</p>
              {loading ? (
                <Loader2 size={20} className="animate-spin text-emerald mt-2" />
              ) : (
                <p className={`text-2xl font-bold mt-1 tnum ${highlight ? 'text-error' : 'text-on-surface'}`}>{value}</p>
              )}
              {sub && <p className={`text-xs mt-0.5 ${subColor}`}>{sub}</p>}
            </Card>
          ))}
        </div>

        {dash?.status_breakdown && (
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-3">Invoice Status Breakdown</p>
            <div className="flex gap-4 flex-wrap">
              {Object.entries(dash.status_breakdown).map(([key, count]) => (
                <div key={key} className="flex flex-col items-center gap-1 min-w-[60px]">
                  <span className="text-xl font-bold text-on-surface tnum">{count}</span>
                  <span className="text-xs text-on-surface-variant capitalize">{key}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-3 gap-4">
          <Card className="col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-4">Invoice Status Breakdown</p>
            {dash?.status_breakdown ? (
              <div className="space-y-3">
                {Object.entries(dash.status_breakdown).map(([key, count]) => {
                  const total = Object.values(dash.status_breakdown).reduce((a, b) => a + b, 0);
                  const pct = total ? Math.round((count / total) * 100) : 0;
                  const colorMap = { submitted: 'bg-amber-400', reviewed: 'bg-sky-400', funding: 'bg-violet-400', paid: 'bg-emerald', rejected: 'bg-error', flagged: 'bg-orange-400' };
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs text-on-surface-variant capitalize w-20 flex-shrink-0">{key}</span>
                      <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${colorMap[key] ?? 'bg-emerald'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-on-surface tnum w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">No data available.</p>
            )}
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant">
              <span className="text-sm font-semibold text-on-surface">Quick Actions</span>
              <CheckCircle size={15} className="text-emerald" />
            </div>
            <div className="divide-y divide-outline-variant">
              {[
                { label: 'Review Pending Invoices', path: '/vendorpay/admin/invoices', icon: Receipt },
                { label: 'View All Vendors', path: '/vendorpay/admin/vendors', icon: AlertCircle },
                { label: 'Payment History', path: '/vendorpay/admin/payments', icon: Clock },
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
            <div className="px-5 py-3 border-t border-outline-variant">
              <button
                onClick={() => navigate('/vendorpay/admin/payments')}
                className="text-xs text-on-surface-variant hover:text-emerald font-medium uppercase tracking-wide w-full text-center transition-colors"
              >
                Full Transaction History
              </button>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
