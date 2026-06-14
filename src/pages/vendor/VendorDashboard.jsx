import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { Plus, Loader2 } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';
import { vendorService } from '../../lib/services/vendorService';

function StatCard({ label, value, values, sub, subColor = 'text-emerald', badge }) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{label}</p>
      {values ? (
        <div className="space-y-0.5">
          {values.map((v, i) => (
            <p key={i} className="text-2xl font-bold text-on-surface tnum leading-tight">{v}</p>
          ))}
        </div>
      ) : (
        <p className="text-2xl font-bold text-on-surface tnum">{value}</p>
      )}
      {sub && <p className={`text-xs font-medium ${subColor}`}>{sub}</p>}
      {badge && (
        <span className="inline-flex items-center self-start px-2 py-0.5 bg-error/10 text-error text-xs font-semibold rounded-full mt-1">
          {badge}
        </span>
      )}
    </Card>
  );
}

function currencyValues(map) {
  if (!map || Object.keys(map).length === 0) return [formatCurrency(0)];
  return Object.entries(map).map(([currency, amount]) => formatCurrency(amount, currency));
}

export default function VendorDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  useEffect(() => {
    vendorService.getDashboard()
      .then(setData)
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppLayout role="vendor">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={28} className="animate-spin text-emerald" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout role="vendor">
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-sm text-error">{error}</p>
        </div>
      </AppLayout>
    );
  }

  const dist = data.status_distribution ?? {};
  const pieData = [
    { name: 'Submitted',   value: dist.submitted         ?? 0, color: '#74777c' },
    { name: 'Reviewed',    value: dist.reviewed          ?? 0, color: '#6b7280' },
    { name: 'Funding',     value: dist.funding           ?? 0, color: '#3b82f6' },
    { name: 'Paid',        value: dist.paid              ?? 0, color: '#006c49' },
    { name: 'Confirmed',   value: dist.payment_confirmed ?? 0, color: '#059669' },
    { name: 'Disputed',    value: dist.payment_disputed  ?? 0, color: '#ef4444' },
    { name: 'Rejected',    value: dist.rejected          ?? 0, color: '#ba1a1a' },
    { name: 'Flagged',     value: dist.flagged           ?? 0, color: '#f59e0b' },
  ].filter((s) => s.value > 0);

  // "settled" = paid + confirmed — both represent fully settled invoices
  const settledPct = (dist.paid ?? 0) + (dist.payment_confirmed ?? 0);

  // Determine primary currency from first trend bucket
  const trendRaw = data.payment_trends ?? [];
  const allCurrencies = trendRaw.flatMap((pt) => Object.keys(pt.submitted_by_currency ?? {}));
  const primaryCurrency = allCurrencies[0] ?? 'USD';

  const trendData = trendRaw.map((pt) => ({
    month: pt.month?.split(' ')[0] ?? pt.month,
    submitted: pt.submitted_by_currency?.[primaryCurrency] ?? 0,
    settled:   pt.settled_by_currency?.[primaryCurrency]   ?? 0,
    rejected:  pt.rejected_by_currency?.[primaryCurrency]  ?? 0,
    currency:  primaryCurrency,
  }));

  const currSymbol = primaryCurrency === 'NGN' ? '₦' : primaryCurrency === 'USD' ? '$' : primaryCurrency === 'GBP' ? '£' : primaryCurrency === 'EUR' ? '€' : '';
  const axisFormatter = (v) => `${currSymbol}${(v / 1000).toFixed(0)}k`;

  return (
    <AppLayout role="vendor">
      <div className="space-y-6">
        <div>
          <p className="text-xs text-on-surface-variant">{today}</p>
          <h1 className="text-2xl font-semibold text-on-surface mt-0.5">
            Good morning{data.first_name ? `, ${data.first_name}` : ''}
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Here is what&apos;s happening with your accounts today.</p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Invoices" value={data.total_invoices ?? 0} />
          <StatCard
            label="Pending Approval"
            value={data.pending_approval_count ?? 0}
            badge={data.pending_approval_count > 0 ? 'Action Req.' : undefined}
            subColor="text-error"
          />
          <StatCard label="Paid This Month" values={currencyValues(data.paid_this_month)} sub={`${settledPct}% of invoices settled`} />
          <StatCard label="Total Amount Paid" values={currencyValues(data.total_amount_paid_ytd)} sub="YTD" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-on-surface">Payment Trends</h3>
              <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-1 rounded">Monthly</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={trendData} barGap={2} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#74777c' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#74777c' }} axisLine={false} tickLine={false} tickFormatter={axisFormatter} />
                <Tooltip
                  formatter={(v, name) => [formatCurrency(v, primaryCurrency), name]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #c4c6cc' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="submitted" name="Submitted" fill="#c4c6cc" radius={[3, 3, 0, 0]} />
                <Bar dataKey="settled"   name="Settled"   fill="#006c49" radius={[3, 3, 0, 0]} />
                <Bar dataKey="rejected"  name="Rejected"  fill="#ba1a1a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-on-surface mb-3">Status Distribution</h3>
            {pieData.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-8">No invoices yet.</p>
            ) : (
              <>
                <div className="flex justify-center mb-2">
                  <div className="relative">
                    <PieChart width={130} height={130}>
                      <Pie data={pieData} cx={60} cy={60} innerRadius={38} outerRadius={56} dataKey="value" startAngle={90} endAngle={-270}>
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-on-surface leading-none">{settledPct}%</span>
                      <span className="text-[10px] text-on-surface-variant mt-0.5">settled</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  {pieData.map(({ name, value, color }) => (
                    <div key={name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-on-surface-variant">{name}</span>
                      </div>
                      <span className="font-semibold text-on-surface">{value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      <button
        onClick={() => navigate('/vendorpay/vendor/invoices/new')}
        className="fixed bottom-8 right-8 w-12 h-12 bg-navy rounded-full flex items-center justify-center text-white shadow-dropdown hover:bg-navy/90 transition-colors z-20"
      >
        <Plus size={20} />
      </button>
    </AppLayout>
  );
}
