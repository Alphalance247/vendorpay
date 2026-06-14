import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Download, Plus, AlertCircle, Clock, CheckCircle, Receipt,
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusChip from '../../components/ui/StatusChip';
import { formatCurrency } from '../../lib/utils';

const processingData = [
  { date: 'Nov 1', processed: 12, volume: 48000 },
  { date: 'Nov 8', processed: 18, volume: 72000 },
  { date: 'Nov 15', processed: 14, volume: 56000 },
  { date: 'Nov 22', processed: 22, volume: 91000 },
  { date: 'Nov 29', processed: 19, volume: 76000 },
];

const attentionItems = [
  {
    id: 1,
    type: 'Vendor Approval',
    title: 'New Vendor: CloudScale AI Solutions',
    desc: 'Tax compliance documents pending verification.',
    badge: 'Vendor Approval',
    action: 'Review',
    icon: AlertCircle,
    iconBg: 'bg-blue-100 text-blue-600',
  },
  {
    id: 2,
    type: 'High Value',
    title: 'Invoice #INV-2023-00451',
    desc: 'High-value payment request ($24,500.00) from Global Logistics',
    badge: 'High Value',
    action: 'Approve',
    icon: Receipt,
    iconBg: 'bg-purple-100 text-purple-600',
  },
  {
    id: 3,
    type: 'Compliance',
    title: 'Expiring Contract: Nexus Digital',
    desc: 'Service agreement expires in 14 days.',
    badge: 'Compliance',
    action: 'Review',
    icon: Clock,
    iconBg: 'bg-yellow-100 text-yellow-600',
  },
];

const recentPayouts = [
  { vendor: 'Acme Corp', id: 'TXN-0082', amount: 12450, status: 'Confirmed' },
  { vendor: 'Stark Industries', id: 'TXN-0081', amount: 8200, status: 'Confirmed' },
  { vendor: 'Wayne Ent.', id: 'TXN-0080', amount: 45000, status: 'Confirmed' },
  { vendor: 'Cyberdyne Sys.', id: 'TXN-0079', amount: 1940, status: 'Confirmed' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <AppLayout role="admin" searchPlaceholder="Search vendors, invoices, or transactions...">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">Finance Dashboard</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">Manage your organization&apos;s outgoing capital and vendor relations.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              <Download size={14} /> Export Report
            </Button>
            <Button size="sm">
              <Plus size={14} /> New Payment
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Vendors', value: '1,248', sub: '+13% this month', subColor: 'text-emerald' },
            { label: 'Pending Approvals', value: '42', sub: '* Requires action today', subColor: 'text-error', highlight: true },
            { label: 'Pending Payments', value: '156', sub: 'Avg. 7 days aging', subColor: 'text-on-surface-variant' },
            { label: 'Monthly Volume', value: '$4.2M', sub: 'Budget utilization: 86%', subColor: 'text-on-surface-variant' },
          ].map(({ label, value, sub, subColor, highlight }) => (
            <Card key={label} className={highlight ? 'border-error/30 bg-error/5' : ''}>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{label}</p>
              <p className={`text-2xl font-bold mt-1 tnum ${highlight ? 'text-error' : 'text-on-surface'}`}>{value}</p>
              <p className={`text-xs mt-0.5 ${subColor}`}>{sub}</p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Needs attention */}
          <div className="col-span-2 space-y-4">
            <Card className="p-0 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="text-error" />
                  <span className="text-sm font-semibold text-on-surface">Needs Your Attention</span>
                </div>
                <button className="text-xs text-emerald hover:underline font-medium">View All Tasks</button>
              </div>
              <div className="divide-y divide-outline-variant">
                {attentionItems.map(({ id, title, desc, badge, action, icon: Icon, iconBg }) => (
                  <div key={id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-low/50 transition-colors">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-on-surface">{title}</p>
                        <StatusChip status={badge} />
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">{desc}</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => navigate('/vendorpay/admin/invoices')}>
                      {action}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Invoice processing chart */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-on-surface">Invoice Processing (Last 30 Days)</h3>
                <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-navy inline-block" />Processed</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-light inline-block" />Volume</span>
                  <select className="text-xs border border-outline-variant rounded px-2 py-1 bg-white">
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
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

          {/* Recent payouts */}
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant">
              <span className="text-sm font-semibold text-on-surface">Recent Payouts</span>
              <button className="text-on-surface-variant hover:text-on-surface">
                <CheckCircle size={15} />
              </button>
            </div>
            <div className="divide-y divide-outline-variant">
              {recentPayouts.map(({ vendor, id, amount, status }) => (
                <div key={id} className="px-5 py-4 hover:bg-surface-low/50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-semibold text-on-surface">{vendor}</p>
                    <p className="text-sm font-bold tnum text-on-surface">{formatCurrency(amount)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-outline">TRANSACTION #{id}</p>
                    <div className="flex items-center gap-1 text-xs text-emerald font-medium">
                      <CheckCircle size={11} />
                      {status}
                    </div>
                  </div>
                  <button className="text-xs text-on-surface-variant hover:text-emerald mt-1 flex items-center gap-1 transition-colors">
                    <Receipt size={11} /> Receipt
                  </button>
                </div>
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
