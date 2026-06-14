import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Download, Plus, AlertCircle, Clock, CheckCircle, Receipt, Loader2,
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { formatCurrency } from '../../lib/utils';
import { vendorService } from '../../lib/services/vendorService';

const processingData = [
  { date: 'Nov 1', processed: 12 },
  { date: 'Nov 8', processed: 18 },
  { date: 'Nov 15', processed: 14 },
  { date: 'Nov 22', processed: 22 },
  { date: 'Nov 29', processed: 19 },
];

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
          <div className="col-span-2 space-y-4">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-on-surface">Invoice Processing (Last 30 Days)</h3>
                <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-navy inline-block" />Processed</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={processingData} margin={{ left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#006c49" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#006c49" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#74777c' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#74777c' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #c4c6cc' }} />
                  <Area type="monotone" dataKey="processed" stroke="#006c49" strokeWidth={2} fill="url(#adminGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>

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
