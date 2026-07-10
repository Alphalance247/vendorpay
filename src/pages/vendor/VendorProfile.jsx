import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, CheckCircle, User } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import TutorialCard from '../../components/ui/TutorialCard';
import { vendorService } from '../../lib/services/vendorService';
import { extractErrorMessage } from '../../lib/utils';

const BUSINESS_TYPES = ['LLC', 'Corporation', 'Sole Proprietorship', 'Partnership', 'Non-Profit', 'Other'];
const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Manufacturing',
  'Construction', 'Consulting', 'Media', 'Logistics', 'Agriculture', 'Other',
];

export default function VendorProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    contact_first_name: '',
    contact_last_name: '',
    contact_email: '',
    phone: '',
    job_title: '',
    department: '',
    company_name: '',
    business_type: '',
    business_address: '',
    website: '',
    industry: '',
    tax_id: '',
  });

  useEffect(() => {
    vendorService.getProfile()
      .then((data) => {
        setForm({
          contact_first_name: data.contact_first_name ?? '',
          contact_last_name:  data.contact_last_name  ?? '',
          contact_email:      data.contact_email      ?? '',
          phone:              data.phone              ?? '',
          job_title:          data.job_title          ?? '',
          department:         data.department         ?? '',
          company_name:       data.company_name       ?? '',
          business_type:      data.business_type      ?? '',
          business_address:   data.business_address   ?? '',
          website:            data.website            ?? '',
          industry:           data.industry           ?? '',
          tax_id:             data.tax_id             ?? '',
        });
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const { contact_email, phone, ...editable } = form;
      await vendorService.updateProfile(editable);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const initials = [form.contact_first_name, form.contact_last_name]
    .filter(Boolean).map((s) => s[0]).join('').toUpperCase() || '?';

  if (loading) {
    return (
      <AppLayout role="vendor">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={28} className="animate-spin text-emerald" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="vendor">
      <div className="space-y-6 max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft size={15} /> Back
        </button>

        <div>
          <h1 className="text-2xl font-semibold text-on-surface">My Profile</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Update your contact and company details.</p>
        </div>

        <TutorialCard
          id="vendor-profile"
          title="Keeping Your Profile Up to Date"
          description="Your profile details are used on invoice submissions and communications with the finance team."
          tips={[
            "Your name, job title, and company details appear on every invoice you submit — keep them accurate.",
            "Email and phone are locked for security. Contact support if you need to update them.",
            "Ensure your company name and Tax ID match your official business registration.",
          ]}
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">{error}</div>
        )}

        {saved && (
          <div className="p-3 bg-emerald/10 border border-emerald/30 rounded text-emerald text-sm flex items-center gap-2">
            <CheckCircle size={15} /> Profile updated successfully.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber flex items-center justify-center">
              <span className="text-white text-xl font-bold">{initials}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">
                {[form.contact_first_name, form.contact_last_name].filter(Boolean).join(' ') || 'Your Name'}
              </p>
              <p className="text-xs text-on-surface-variant">{form.contact_email || 'contact email'}</p>
            </div>
          </div>

          {/* Contact */}
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-4 flex items-center gap-1.5">
              <User size={12} /> Contact Information
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" name="contact_first_name" value={form.contact_first_name} onChange={handleChange} placeholder="Jane" />
              <Input label="Last Name"  name="contact_last_name"  value={form.contact_last_name}  onChange={handleChange} placeholder="Doe" />

              {/* Read-only fields */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">Contact Email</label>
                <div className="relative">
                  <input
                    readOnly
                    value={form.contact_email}
                    className="w-full rounded border border-outline-variant bg-surface-container px-3 py-2 text-sm text-on-surface-variant cursor-not-allowed select-none"
                  />
                </div>
                <p className="text-[11px] text-outline">To update, <button type="button" onClick={() => navigate('/vendor/support')} className="text-amber underline hover:no-underline">contact support</button>.</p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">Phone</label>
                <div className="relative">
                  <input
                    readOnly
                    value={form.phone}
                    className="w-full rounded border border-outline-variant bg-surface-container px-3 py-2 text-sm text-on-surface-variant cursor-not-allowed select-none"
                  />
                </div>
                <p className="text-[11px] text-outline">To update, <button type="button" onClick={() => navigate('/vendor/support')} className="text-amber underline hover:no-underline">contact support</button>.</p>
              </div>

              <Input label="Job Title"   name="job_title"   value={form.job_title}   onChange={handleChange} placeholder="Finance Manager" />
              <Input label="Department"  name="department"  value={form.department}  onChange={handleChange} placeholder="Finance" />
            </div>
          </Card>

          {/* Company */}
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-4">Company Details</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Legal Company Name" name="company_name" value={form.company_name} onChange={handleChange} placeholder="Acme Corp Ltd" className="col-span-2" />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">Business Type</label>
                <select
                  name="business_type"
                  value={form.business_type}
                  onChange={handleChange}
                  className="w-full rounded border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber transition-colors"
                >
                  <option value="">Select type</option>
                  {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">Industry</label>
                <select
                  name="industry"
                  value={form.industry}
                  onChange={handleChange}
                  className="w-full rounded border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber transition-colors"
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <Input label="Tax ID" name="tax_id" value={form.tax_id} onChange={handleChange} placeholder="12-3456789" />
              <Input label="Website" name="website" type="url" value={form.website} onChange={handleChange} placeholder="https://acme.com" />
              <Input label="Business Address" name="business_address" value={form.business_address} onChange={handleChange} placeholder="123 Main St, City, Country" className="col-span-2" />
            </div>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving} size="lg">
              {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><Save size={15} /> Save Changes</>}
            </Button>
            <Button type="button" variant="secondary" size="lg" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
