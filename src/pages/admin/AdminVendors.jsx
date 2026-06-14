import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, ArrowRight, Loader2 } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import StatusChip from '../../components/ui/StatusChip';
import { vendorService } from '../../lib/services/vendorService';

export default function AdminVendors() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    vendorService.getAllVendors()
      .then(setVendors)
      .catch(() => setError('Failed to load vendors.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = vendors.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.company_name?.toLowerCase().includes(q) ||
      v.contact_email?.toLowerCase().includes(q) ||
      v.industry?.toLowerCase().includes(q)
    );
  });

  return (
    <AppLayout role="admin" searchPlaceholder="Search vendors...">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">Vendors</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">Manage all registered vendor accounts.</p>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Users size={16} />
            <span className="text-sm font-medium">{vendors.length} total</span>
          </div>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or industry..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-surface-low rounded border border-outline-variant focus:outline-none focus:ring-2 focus:ring-emerald"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-emerald" />
              <span className="ml-2 text-sm text-on-surface-variant">Loading vendors...</span>
            </div>
          ) : error ? (
            <p className="px-4 py-8 text-center text-sm text-error">{error}</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-surface-low border-b border-outline-variant">
                  {['Company', 'Contact', 'Industry', 'Status', ''].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-on-surface-variant">
                      No vendors found.
                    </td>
                  </tr>
                )}
                {filtered.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-surface-low/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-on-surface">{vendor.company_name ?? '—'}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{vendor.business_type ?? ''}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-on-surface">{vendor.contact_first_name} {vendor.contact_last_name}</p>
                      <p className="text-xs text-on-surface-variant">{vendor.contact_email ?? '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{vendor.industry ?? '—'}</td>
                    <td className="px-6 py-4">
                      <StatusChip status={vendor.is_onboarded ? 'Active' : 'Pending'} />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/vendorpay/admin/vendors/${vendor.id}`)}
                        className="flex items-center gap-1 text-xs text-emerald hover:underline font-medium"
                      >
                        View <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
