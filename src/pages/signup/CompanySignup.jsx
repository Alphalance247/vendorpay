import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, ArrowRight, ArrowLeft, Rocket, Eye, EyeOff, Loader2,
  Upload, X, Plus, ShieldCheck, PartyPopper, Users, FileText, CreditCard,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import { cn } from '../../lib/utils';
import { PLANS } from '../../lib/plans';

const STEPS = ['Account', 'Company', 'Subdomain', 'Branding', 'Plan', 'Team', 'Review'];

const ROOT_DOMAIN = 'vendorpay.alluvium.net';

const RESERVED_SUBDOMAINS = [
  'app', 'admin', 'api', 'www', 'mail', 'support', 'test', 'staging', 'dashboard', 'vendorpay', 'alluvium',
];

const INDUSTRIES = ['Technology', 'Manufacturing', 'Logistics', 'Professional Services', 'Healthcare', 'Retail', 'Other'];

const COMPANY_SIZES = ['1-10 employees', '11-50 employees', '51-200 employees', '201-500 employees', '500+ employees'];

const ACCENT_COLORS = [
  { name: 'Emerald', value: '#006c49' },
  { name: 'Navy', value: '#0f1d29' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Teal', value: '#0d9488' },
];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center w-full mb-10">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all',
                  done && 'bg-emerald border-emerald text-white',
                  active && 'bg-white border-emerald text-emerald',
                  !done && !active && 'bg-white border-outline-variant text-on-surface-variant'
                )}
              >
                {done ? <Check size={13} /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium uppercase tracking-wider hidden sm:block',
                  active ? 'text-emerald' : done ? 'text-emerald' : 'text-outline'
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 mb-4 sm:mb-4 mx-1 transition-colors',
                  done ? 'bg-emerald' : 'bg-outline-variant'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function AccountStep({ data, onChange, showPassword, setShowPassword, showConfirm, setShowConfirm }) {
  const mismatch = data.password && data.confirmPassword && data.password !== data.confirmPassword;
  const tooShort = data.password && data.password.length < 8;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-on-surface tracking-tight">Create your admin account</h2>
        <p className="text-on-surface-variant text-sm mt-1">This will be the first administrator for your new workspace.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input label="Full Name" name="fullName" value={data.fullName} onChange={onChange} placeholder="Jane Smith" required />
        </div>
        <div className="col-span-2">
          <Input label="Work Email" type="email" name="workEmail" value={data.workEmail} onChange={onChange} placeholder="jane@yourcompany.com" required />
        </div>
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          name="password"
          value={data.password}
          onChange={onChange}
          placeholder="••••••••"
          hint="At least 8 characters"
          error={tooShort ? 'Password must be at least 8 characters' : undefined}
          suffix={
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="text-outline hover:text-on-surface-variant" tabIndex={-1}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
        <Input
          label="Confirm Password"
          type={showConfirm ? 'text' : 'password'}
          name="confirmPassword"
          value={data.confirmPassword}
          onChange={onChange}
          placeholder="••••••••"
          error={mismatch ? 'Passwords do not match' : undefined}
          suffix={
            <button type="button" onClick={() => setShowConfirm((s) => !s)} className="text-outline hover:text-on-surface-variant" tabIndex={-1}>
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
      </div>
    </div>
  );
}

function CompanyStep({ data, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-on-surface tracking-tight">Tell us about your company</h2>
        <p className="text-on-surface-variant text-sm mt-1">This shows up across your workspace and on invoices you send.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input label="Company Name" name="companyName" value={data.companyName} onChange={onChange} placeholder="e.g. Acme Corporation" required />
        </div>
        <Select label="Industry" name="industry" value={data.industry} onChange={onChange} required>
          <option value="">Select industry</option>
          {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
        </Select>
        <Select label="Company Size" name="companySize" value={data.companySize} onChange={onChange} required>
          <option value="">Select company size</option>
          {COMPANY_SIZES.map((s) => <option key={s}>{s}</option>)}
        </Select>
      </div>
    </div>
  );
}

function SubdomainStep({ data, onChange, checkStatus }) {
  const preview = data.subdomain || 'yourcompany';
  const tooShort = data.subdomain && data.subdomain.length < 3;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-on-surface tracking-tight">Choose your subdomain</h2>
        <p className="text-on-surface-variant text-sm mt-1">This is the web address your team and vendors will use to sign in.</p>
      </div>

      <Input
        label="Subdomain"
        name="subdomain"
        value={data.subdomain}
        onChange={(e) => onChange({ target: { name: 'subdomain', value: slugify(e.target.value) } })}
        placeholder="yourcompany"
        error={tooShort ? 'Must be at least 3 characters' : undefined}
        suffix={
          checkStatus === 'checking' ? <Loader2 size={16} className="animate-spin text-outline" /> :
          checkStatus === 'available' ? <Check size={16} className="text-emerald" /> :
          checkStatus === 'taken' ? <X size={16} className="text-error" /> : null
        }
      />

      <div className="bg-surface-low border border-outline-variant rounded-lg px-4 py-3 flex items-center gap-2">
        <span className="text-on-surface-variant text-sm">Your workspace URL:</span>
        <span className="text-sm font-semibold text-on-surface">
          {preview}.{ROOT_DOMAIN}
        </span>
      </div>

      {checkStatus === 'taken' && (
        <p className="text-sm text-error flex items-center gap-1.5">
          <X size={14} /> That subdomain is already taken. Try another.
        </p>
      )}
      {checkStatus === 'available' && (
        <p className="text-sm text-emerald flex items-center gap-1.5">
          <Check size={14} /> That subdomain is available.
        </p>
      )}
      <p className="text-xs text-outline">
        Lowercase letters, numbers, and hyphens only. (Availability check simulated — no backend yet.)
      </p>
    </div>
  );
}

function BrandingStep({ data, onChange, onLogoChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-on-surface tracking-tight">Make it yours</h2>
        <p className="text-on-surface-variant text-sm mt-1">Add a logo and accent color — you'll see it applied on the final screen.</p>
      </div>

      <div>
        <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase mb-2 block">Logo</label>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-lg border-2 border-dashed border-outline-variant flex items-center justify-center overflow-hidden bg-surface-low flex-shrink-0"
            style={data.logoPreviewUrl ? { borderStyle: 'solid' } : undefined}
          >
            {data.logoPreviewUrl ? (
              <img src={data.logoPreviewUrl} alt="Logo preview" className="w-full h-full object-cover" />
            ) : (
              <Upload size={20} className="text-outline" />
            )}
          </div>
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded border border-outline-variant text-on-surface hover:bg-surface-low transition-colors">
              <Upload size={14} />
              {data.logoPreviewUrl ? 'Replace logo' : 'Upload logo'}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={onLogoChange} />
          </label>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase mb-2 block">Accent Color</label>
        <div className="flex items-center gap-3">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onChange({ target: { name: 'accentColor', value: c.value } })}
              title={c.name}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-105',
                data.accentColor === c.value && 'ring-2 ring-offset-2 ring-on-surface'
              )}
              style={{ backgroundColor: c.value }}
            >
              {data.accentColor === c.value && <Check size={15} className="text-white" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlanStep({ data, onChange }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-on-surface tracking-tight">Choose a plan</h2>
        <p className="text-on-surface-variant text-sm mt-1">You can change this anytime. No payment required for this preview.</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const selected = data.plan === plan.id;
          return (
            <button
              type="button"
              key={plan.id}
              onClick={() => onChange({ target: { name: 'plan', value: plan.id } })}
              className={cn(
                'relative text-left rounded-xl border-2 p-4 transition-all flex flex-col',
                selected ? 'border-emerald bg-emerald/5' : 'border-outline-variant bg-white hover:border-outline'
              )}
            >
              {plan.highlight && (
                <span className="absolute -top-2.5 left-4 bg-amber text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                  Most Popular
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
                selected ? 'bg-emerald border-emerald' : 'border-outline-variant'
              )}>
                {selected && <Check size={12} className="text-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TeamStep({ teammates, onAdd, onRemove }) {
  const [email, setEmail] = useState('');
  const isValid = /\S+@\S+\.\S+/.test(email);

  function handleAdd() {
    if (!isValid || teammates.includes(email)) return;
    onAdd(email);
    setEmail('');
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-on-surface tracking-tight">Invite your team</h2>
        <p className="text-on-surface-variant text-sm mt-1">Optional — you can skip this and invite teammates later.</p>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            label="Teammate Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@yourcompany.com"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
          />
        </div>
        <Button type="button" variant="secondary" onClick={handleAdd} disabled={!isValid} className="flex items-center gap-1.5 mb-[1px]">
          <Plus size={15} /> Add
        </Button>
      </div>

      {teammates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {teammates.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 bg-surface-low border border-outline-variant rounded-full pl-3 pr-1.5 py-1 text-sm text-on-surface">
              {t}
              <button type="button" onClick={() => onRemove(t)} className="text-outline hover:text-error rounded-full p-0.5">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewStep({ data }) {
  const plan = PLANS.find((p) => p.id === data.plan);
  const rows = [
    { label: 'Admin', value: `${data.fullName} (${data.workEmail})` },
    { label: 'Company', value: data.companyName },
    { label: 'Industry', value: data.industry },
    { label: 'Company Size', value: data.companySize },
    { label: 'Workspace URL', value: `${data.subdomain}.${ROOT_DOMAIN}` },
    { label: 'Plan', value: plan ? `${plan.name} (${plan.price}${plan.period})` : '' },
    { label: 'Teammates Invited', value: data.teammates.length ? data.teammates.join(', ') : 'None yet' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-on-surface tracking-tight">Review & confirm</h2>
        <p className="text-on-surface-variant text-sm mt-1">Everything look right? Let's create your workspace.</p>
      </div>
      <div className="bg-surface-low rounded-lg border border-outline-variant overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((row) => (
              row.value ? (
                <tr key={row.label} className="border-b border-outline-variant last:border-0">
                  <td className="px-4 py-3 font-medium text-on-surface-variant w-1/3 align-top">{row.label}</td>
                  <td className="px-4 py-3 text-on-surface">{row.value}</td>
                </tr>
              ) : null
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-emerald/5 border border-emerald/20 rounded-lg p-3 flex items-start gap-2 text-sm text-emerald">
        <ShieldCheck size={16} className="mt-0.5 flex-shrink-0" />
        This is a preview environment — no account is created and nothing is sent anywhere.
      </div>
    </div>
  );
}

function SuccessScreen({ data, onDone }) {
  const initials = data.companyName ? data.companyName.charAt(0).toUpperCase() : 'C';

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-emerald/10 flex items-center justify-center mx-auto mb-4">
            <PartyPopper size={26} className="text-emerald" />
          </div>
          <h1 className="text-2xl font-semibold text-on-surface tracking-tight">Your workspace is ready!</h1>
          <p className="text-on-surface-variant text-sm mt-1.5">
            <span className="font-medium text-on-surface">{data.subdomain}.{ROOT_DOMAIN}</span> is set up and waiting for you.
          </p>
        </div>

        {/* Branded preview */}
        <Card className="overflow-hidden p-0">
          <div
            className="px-5 py-4 flex items-center gap-3"
            style={{ backgroundColor: data.accentColor }}
          >
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center overflow-hidden flex-shrink-0">
              {data.logoPreviewUrl ? (
                <img src={data.logoPreviewUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-sm">{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{data.companyName}</p>
              <p className="text-white/70 text-xs truncate">{data.subdomain}.{ROOT_DOMAIN}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-outline-variant">
            {[
              { icon: Users, label: 'Vendors', value: '0' },
              { icon: FileText, label: 'Invoices', value: '0' },
              { icon: CreditCard, label: 'Paid Out', value: '$0' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="px-4 py-5 text-center">
                <Icon size={16} className="mx-auto text-on-surface-variant mb-1.5" />
                <p className="text-lg font-semibold text-on-surface">{value}</p>
                <p className="text-xs text-on-surface-variant">{label}</p>
              </div>
            ))}
          </div>
        </Card>

        <p className="text-center text-xs text-outline mt-4">
          This is a branding preview only — sign-in for this workspace isn't wired up yet.
        </p>

        <Button size="lg" className="w-full mt-6" onClick={onDone}>
          Back to Login
        </Button>
      </div>
    </div>
  );
}

export default function CompanySignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [debouncedSubdomain, setDebouncedSubdomain] = useState('');

  const [data, setData] = useState({
    fullName: '',
    workEmail: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    industry: '',
    companySize: '',
    subdomain: '',
    logoFile: null,
    logoPreviewUrl: '',
    accentColor: ACCENT_COLORS[0].value,
    plan: 'growth',
    teammates: [],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setData((prev) => ({ ...prev, logoFile: file, logoPreviewUrl: URL.createObjectURL(file) }));
  };

  const addTeammate = (email) => setData((prev) => ({ ...prev, teammates: [...prev.teammates, email] }));
  const removeTeammate = (email) => setData((prev) => ({ ...prev, teammates: prev.teammates.filter((t) => t !== email) }));

  // Simulated debounced subdomain availability check: the effect only ever
  // writes the settled value; "checking" is derived by comparing the live
  // input to that settled value, so no setState runs synchronously in the effect body.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSubdomain(data.subdomain), 500);
    return () => clearTimeout(timer);
  }, [data.subdomain]);

  const checkStatus =
    data.subdomain.length < 3 ? 'idle' :
    data.subdomain !== debouncedSubdomain ? 'checking' :
    RESERVED_SUBDOMAINS.includes(data.subdomain) ? 'taken' : 'available';

  const validateStep = () => {
    switch (step) {
      case 0:
        return (
          data.fullName && data.workEmail &&
          data.password.length >= 8 && data.password === data.confirmPassword
        );
      case 1:
        return data.companyName && data.industry && data.companySize;
      case 2:
        return data.subdomain.length >= 3 && checkStatus === 'available';
      case 3:
        return !!data.accentColor;
      case 4:
        return !!data.plan;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) {
      setError('Please fill in all required fields before continuing.');
      return;
    }
    setError('');
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleCreate = () => {
    setCreating(true);
    setTimeout(() => {
      setCreating(false);
      setCreated(true);
    }, 900);
  };

  if (created) {
    return <SuccessScreen data={data} onDone={() => navigate('/login')} />;
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <StepIndicator current={step} />

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-6">
          {step === 0 && (
            <AccountStep
              data={data} onChange={handleChange}
              showPassword={showPassword} setShowPassword={setShowPassword}
              showConfirm={showConfirm} setShowConfirm={setShowConfirm}
            />
          )}
          {step === 1 && <CompanyStep data={data} onChange={handleChange} />}
          {step === 2 && <SubdomainStep data={data} onChange={handleChange} checkStatus={checkStatus} />}
          {step === 3 && <BrandingStep data={data} onChange={handleChange} onLogoChange={handleLogoChange} />}
          {step === 4 && <PlanStep data={data} onChange={handleChange} />}
          {step === 5 && <TeamStep teammates={data.teammates} onAdd={addTeammate} onRemove={removeTeammate} />}
          {step === 6 && <ReviewStep data={data} />}

          <div className="flex justify-between mt-8 pt-6 border-t border-outline-variant">
            <Button variant="secondary" onClick={handleBack} disabled={step === 0} className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button onClick={handleNext} className="flex items-center gap-2">
                {step === STEPS.length - 2 ? 'Review' : 'Next'}
                <ArrowRight size={16} />
              </Button>
            ) : (
              <Button onClick={handleCreate} disabled={creating} className="flex items-center gap-2">
                {creating ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
                {creating ? 'Creating workspace...' : 'Create Workspace'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
