import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Plus } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';

const trendData = [
  { month: 'May', amount: 28000 },
  { month: 'Jun', amount: 42000 },
  { month: 'Jul', amount: 31000 },
  { month: 'Aug', amount: 54000 },
  { month: 'Sep', amount: 39000 },
  { month: 'Oct', amount: 62000 },
];

const pieData = [
  { name: 'Paid', value: 75, color: '#006c49' },
  { name: 'Pending', value: 10, color: '#f59e0b' },
  { name: 'Flagged', value: 15, color: '#ba1a1a' },
];

function StatCard({ label, value, sub, subColor = 'text-emerald', badge }) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{label}</p>
      <p className="text-2xl font-bold text-on-surface tnum">{value}</p>
      {sub && <p className={`text-xs font-medium ${subColor}`}>{sub}</p>}
      {badge && (
        <span className="inline-flex items-center self-start px-2 py-0.5 bg-error/10 text-error text-xs font-semibold rounded-full mt-1">
          {badge}
        </span>
      )}
    </Card>
  );
}

export default function VendorDashboard() {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <AppLayout role="vendor">
      <div className="space-y-6">
        <div>
          <p className="text-xs text-on-surface-variant">{today}</p>
          <h1 className="text-2xl font-semibold text-on-surface mt-0.5">Good morning, Alex</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Here is what&apos;s happening with your accounts today.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Invoices" value="128" sub="+12% vs last month" />
          <StatCard label="Pending Approval" value="14" badge="Action Req." subColor="text-error" />
          <StatCard label="Paid This Month" value={formatCurrency(42850)} sub="84% Goal" />
          <StatCard label="Total Amount Paid" value="$1.2M" sub="YTD 2023" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-on-surface">Payment Trends</h3>
              <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-1 rounded">Last 6 Months</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="vendorGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#006c49" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#006c49" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#74777c' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#74777c' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #c4c6cc' }} />
                <Area type="monotone" dataKey="amount" stroke="#006c49" strokeWidth={2} fill="url(#vendorGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-on-surface mb-4">Status Distribution</h3>
            <div className="flex justify-center mb-3">
              <div className="relative">
                <PieChart width={140} height={140}>
                  <Pie data={pieData} cx={65} cy={65} innerRadius={42} outerRadius={62} dataKey="value" startAngle={90} endAngle={-270}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-on-surface">82%</span>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              {pieData.map(({ name, value, color }) => (
                <div key={name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-on-surface-variant">{name}</span>
                  </div>
                  <span className="font-semibold text-on-surface">{value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/vendor/invoices/new')}
        className="fixed bottom-8 right-8 w-12 h-12 bg-navy rounded-full flex items-center justify-center text-white shadow-dropdown hover:bg-navy/90 transition-colors z-20"
      >
        <Plus size={20} />
      </button>
    </AppLayout>
  );
}
