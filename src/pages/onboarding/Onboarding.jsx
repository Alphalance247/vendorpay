import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, ArrowLeft, Save, HelpCircle, ShieldCheck } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { cn } from '../../lib/utils';

const STEPS = ['Company', 'Banking', 'Contact', 'Review'];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all',
                  done && 'bg-emerald border-emerald text-white',
                  active && 'bg-white border-emerald text-emerald',
                  !done && !active && 'bg-white border-outline-variant text-on-surface-variant'
                )}
              >
                {done ? <Check size={14} /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-xs font-medium uppercase tracking-wider',
                  active ? 'text-emerald' : done ? 'text-emerald' : 'text-outline'
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-24 mb-5 mx-1 transition-colors',
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

function CompanyStep({ data, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-on-surface tracking-tight">Company Information</h2>
        <p className="text-on-surface-variant text-sm mt-1">Tell us about your business to get started.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input label="Legal Company Name" name="companyName" value={data.companyName} onChange={onChange} placeholder="e.g. Acme Corporation LLC" required />
        </div>
        <Input label="Tax ID / EIN" name="taxId" value={data.taxId} onChange={onChange} placeholder="XX-XXXXXXX" required />
        <Input label="Business Type" name="businessType" value={data.businessType} onChange={onChange} placeholder="e.g. LLC, Corporation" />
        <div className="col-span-2">
          <Input label="Business Address" name="address" value={data.address} onChange={onChange} placeholder="123 Main Street, New York, NY 10001" />
        </div>
        <Input label="Website" name="website" value={data.website} onChange={onChange} placeholder="https://yourcompany.com" />
        <Select label="Industry" name="industry" value={data.industry} onChange={onChange}>
          <option value="">Select industry</option>
          <option>Technology</option>
          <option>Manufacturing</option>
          <option>Logistics</option>
          <option>Professional Services</option>
          <option>Healthcare</option>
          <option>Other</option>
        </Select>
      </div>
    </div>
  );
}

const COUNTRY_PROFILES = {
  US: {
    label: 'United States',
    rail: 'ACH',
    bankPlaceholder: 'e.g. Chase, Wells Fargo',
    fields: [
      { name: 'routingNumber', label: 'Routing Number', placeholder: '000000000', hint: '9-digit ABA routing number' },
      { name: 'accountNumber', label: 'Account Number', placeholder: 'Enter account number' },
    ],
    accountTypes: ['Checking', 'Savings'],
  },
  GB: {
    label: 'United Kingdom',
    rail: 'Faster Payments',
    bankPlaceholder: 'e.g. Barclays, HSBC',
    fields: [
      { name: 'sortCode', label: 'Sort Code', placeholder: '00-00-00', hint: '6-digit UK sort code' },
      { name: 'accountNumber', label: 'Account Number', placeholder: '8-digit account number' },
    ],
    accountTypes: ['Current', 'Savings'],
  },
  NG: {
    label: 'Nigeria',
    rail: 'NIP',
    bankPlaceholder: 'e.g. GTBank, Access Bank',
    fields: [
      { name: 'accountNumber', label: 'Account Number', placeholder: '10-digit NUBAN', hint: '10-digit NUBAN account number' },
      { name: 'swiftCode', label: 'SWIFT / BIC', placeholder: 'e.g. GTBINGLA', hint: 'Required for international wires' },
    ],
    accountTypes: ['Current', 'Savings', 'Domiciliary'],
  },
  KE: {
    label: 'Kenya',
    rail: 'EFT / RTGS',
    bankPlaceholder: 'e.g. Equity Bank, KCB',
    fields: [
      { name: 'accountNumber', label: 'Account Number', placeholder: 'Enter account number' },
      { name: 'branchCode', label: 'Branch Code', placeholder: 'e.g. 68000', hint: 'Bank branch identifier' },
      { name: 'swiftCode', label: 'SWIFT / BIC', placeholder: 'e.g. EQBLKENA' },
    ],
    accountTypes: ['Current', 'Savings'],
  },
  ZA: {
    label: 'South Africa',
    rail: 'EFT',
    bankPlaceholder: 'e.g. Standard Bank, FNB',
    fields: [
      { name: 'accountNumber', label: 'Account Number', placeholder: 'Enter account number' },
      { name: 'branchCode', label: 'Branch Code', placeholder: 'e.g. 250655', hint: 'Universal branch code' },
    ],
    accountTypes: ['Cheque', 'Savings', 'Transmission'],
  },
  AF_OTHER: {
    label: 'Other African Country',
    rail: 'SWIFT',
    bankPlaceholder: 'Local bank name',
    fields: [
      { name: 'accountNumber', label: 'Account Number', placeholder: 'Enter account number' },
      { name: 'swiftCode', label: 'SWIFT / BIC', placeholder: 'e.g. XXXXXXXX', hint: 'Required for international wires' },
    ],
    accountTypes: ['Current', 'Savings'],
  },
  EU: {
    label: 'Eurozone (SEPA)',
    rail: 'SEPA',
    bankPlaceholder: 'e.g. Deutsche Bank, BNP Paribas',
    fields: [
      { name: 'iban', label: 'IBAN', placeholder: 'DE89 3704 0044 0532 0130 00', hint: 'International Bank Account Number' },
      { name: 'swiftCode', label: 'SWIFT / BIC', placeholder: 'e.g. DEUTDEFF' },
    ],
    accountTypes: ['Current', 'Savings'],
  },
  CA: {
    label: 'Canada',
    rail: 'EFT',
    bankPlaceholder: 'e.g. RBC, TD',
    fields: [
      { name: 'transitNumber', label: 'Transit Number', placeholder: '00000', hint: '5-digit branch transit' },
      { name: 'institutionNumber', label: 'Institution Number', placeholder: '000', hint: '3-digit bank ID' },
      { name: 'accountNumber', label: 'Account Number', placeholder: 'Enter account number' },
    ],
    accountTypes: ['Chequing', 'Savings'],
  },
  OTHER: {
    label: 'Other / International Wire',
    rail: 'SWIFT',
    bankPlaceholder: 'Local bank name',
    fields: [
      { name: 'iban', label: 'IBAN / Account Number', placeholder: 'Enter IBAN or account number' },
      { name: 'swiftCode', label: 'SWIFT / BIC', placeholder: 'e.g. XXXXXXXX', hint: 'Required for international wires' },
    ],
    accountTypes: ['Current', 'Savings'],
  },
};

function BankingStep({ data, onChange }) {
  const country = data.country;
  const profile = COUNTRY_PROFILES[country] || { rail: '', bankPlaceholder: '', fields: [], accountTypes: [] };
  const countrySelected = !!country;
  const mismatch = data.accountNumber && data.confirmAccount && data.accountNumber !== data.confirmAccount;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-on-surface tracking-tight">Banking Information</h2>
        <p className="text-on-surface-variant text-sm mt-1">
          Select your country so we can collect the right payment details for your region.
        </p>
      </div>

      <div className="bg-emerald/5 border border-emerald/20 rounded-lg p-3 flex items-start gap-2 text-sm text-emerald">
        <ShieldCheck size={16} className="mt-0.5 flex-shrink-0" />
        All bank accounts must be verified through our secure automated system before first disbursement can be processed.
      </div>

      {/* Country + Payment Rail — ALWAYS ENABLED */}
      <div className="grid grid-cols-2 gap-4">
        <Select label="Country" name="country" value={country} onChange={onChange}>
          <option value="">Select Country First</option>
          {Object.entries(COUNTRY_PROFILES).map(([code, { label }]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </Select>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">Payment Rail</label>
          <div className="w-full rounded border border-outline-variant bg-surface-low px-3 py-2 text-sm text-on-surface-variant">
            {countrySelected ? profile.rail : 'Select a country first'}
          </div>
        </div>
      </div>

      {/* ALL BANKING FIELDS — BLOCKED UNTIL COUNTRY SELECTED */}
      <div className="relative">
        {/* Overlay: blocks all interaction when no country selected */}
        {!countrySelected && (
          <div className="absolute inset-0 z-10 bg-surface/60 backdrop-blur-[1px] rounded-lg cursor-not-allowed flex items-center justify-center">
            <div className="bg-white border border-outline-variant rounded-lg px-4 py-3 shadow-sm text-center">
              <p className="text-sm font-medium text-on-surface">Select a country first</p>
              <p className="text-xs text-on-surface-variant mt-1">Banking fields will appear here</p>
            </div>
          </div>
        )}

        <div className={cn(
          "grid grid-cols-2 gap-4 transition-opacity duration-200",
          !countrySelected && "opacity-40 pointer-events-none select-none"
        )}>
          {profile.fields.map((field) => (
            <div key={field.name} className={profile.fields.length % 2 === 1 && field === profile.fields[profile.fields.length - 1] ? 'col-span-2' : ''}>
              <Input
                label={field.label}
                name={field.name}
                value={data[field.name] || ''}
                onChange={onChange}
                placeholder={field.placeholder}
                hint={field.hint}
                disabled={!countrySelected}
              />
            </div>
          ))}

          <Input
            label="Bank Name"
            name="bankName"
            value={data.bankName}
            onChange={onChange}
            placeholder={profile.bankPlaceholder}
            disabled={!countrySelected}
          />
          <Select
            label="Account Type"
            name="accountType"
            value={data.accountType}
            onChange={onChange}
            disabled={!countrySelected}
          >
            <option value="">Select account type</option>
            {profile?.accountTypes?.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>

          <div className="col-span-2">
            <Input
              label="Confirm Account Number"
              name="confirmAccount"
              value={data.confirmAccount}
              onChange={onChange}
              placeholder="Re-enter account number"
              error={mismatch ? 'Account numbers do not match' : undefined}
              disabled={!countrySelected}
            />
          </div>
        </div>
      </div>

      {/* Authorization checkbox — also blocked */}
      <label className={cn(
        "flex items-start gap-2 select-none text-sm",
        !countrySelected ? "text-on-surface-variant/40 cursor-not-allowed" : "text-on-surface-variant cursor-pointer"
      )}>
        <input 
          type="checkbox" 
          className="mt-0.5 accent-emerald" 
          disabled={!countrySelected} 
        />
        I authorize VendorPay to perform a small test deposit to verify this account. I understand that failure to verify may delay payment cycles.
      </label>
    </div>
  );
}
function ContactStep({ data, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-on-surface tracking-tight">Contact Information</h2>
        <p className="text-on-surface-variant text-sm mt-1">Who should we reach for payment and compliance matters?</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="First Name" name="firstName" value={data.firstName} onChange={onChange} placeholder="Jane" />
        <Input label="Last Name" name="lastName" value={data.lastName} onChange={onChange} placeholder="Smith" />
        <Input label="Email Address" type="email" name="email" value={data.email} onChange={onChange} placeholder="jane@company.com" />
        <Input label="Phone Number" type="tel" name="phone" value={data.phone} onChange={onChange} placeholder="+1 (555) 000-0000" />
        <Input label="Job Title" name="title" value={data.title} onChange={onChange} placeholder="Accounts Payable Manager" />
        <Select label="Department" name="department" value={data.department} onChange={onChange}>
          <option value="">Select department</option>
          <option value="Finance">Finance</option>
          <option value="Accounting">Accounting</option>
          <option value="Operations">Operations</option>
          <option value="Legal">Legal</option>
          <option value="Other">Other</option>
        </Select>

      </div>
    </div>
  );
}

function ReviewStep({ data }) {
  const rows = [
    { label: 'Company', value: data.company.companyName || '—' },
    { label: 'Tax ID', value: data.company.taxId || '—' },
    { label: 'Industry', value: data.company.industry || '—' },
    { label: 'Country', value: COUNTRY_PROFILES[data.banking.country]?.label || '—' },
    { label: 'Bank', value: data.banking.bankName || '—' },
    { label: 'Account Type', value: data.banking.accountType || '—' },
    { label: 'Contact', value: `${data.contact.firstName} ${data.contact.lastName}`.trim() || '—' },
    { label: 'Email', value: data.contact.email || '—' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-on-surface tracking-tight">Review & Submit</h2>
        <p className="text-on-surface-variant text-sm mt-1">Please verify all information before submitting your vendor profile.</p>
      </div>
      <div className="bg-white rounded-lg border border-outline-variant divide-y divide-outline-variant">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{label}</span>
            <span className="text-sm text-on-surface font-medium">{value}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-on-surface-variant text-center">
        By submitting, you agree to VendorPay&apos;s{' '}
        <a href="#" className="text-emerald hover:underline">Terms of Service</a>{' '}
        and{' '}
        <a href="#" className="text-emerald hover:underline">Privacy Policy</a>.
      </p>
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    company: { companyName: '', taxId: '', businessType: '', address: '', website: '', industry: '' },
    banking: { country: '', routingNumber: '', accountNumber: '', confirmAccount: '', bankName: '', accountType: 'Checking', sortCode: '', iban: '', swiftCode: '', branchCode: '', transitNumber: '', institutionNumber: '' },
    contact: { firstName: '', lastName: '', email: '', phone: '', title: '', department: '' },
  });

  function handleChange(section) {
    return (e) => {
      const { name, value } = e.target;
      setData((d) => ({ ...d, [section]: { ...d[section], [name]: value } }));
    };
  }

  function handleNext() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else navigate('/vendor/dashboard');
  }

  const stepComponents = [
    <CompanyStep data={data.company} onChange={handleChange('company')} />,
    <BankingStep data={data.banking} onChange={handleChange('banking')} />,
    <ContactStep data={data.contact} onChange={handleChange('contact')} />,
    <ReviewStep data={data} />,
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Nav */}
      <header className="bg-white border-b border-outline-variant">
        <div className="max-w-content mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-navy rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">VP</span>
            </div>
            <span className="text-navy font-semibold">VendorPay</span>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium">
            {['Dashboard', 'Onboarding', 'Invoices'].map((item) => (
              <span
                key={item}
                className={cn(
                  'pb-0.5 cursor-pointer',
                  item === 'Onboarding'
                    ? 'text-emerald border-b-2 border-emerald'
                    : 'text-on-surface-variant hover:text-on-surface'
                )}
              >
                {item}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button className="p-2 text-on-surface-variant hover:text-on-surface"><span className="sr-only">Notifications</span>🔔</button>
            <button className="p-2 text-on-surface-variant hover:text-on-surface"><span className="sr-only">Settings</span>⚙️</button>
            <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white text-xs font-semibold">V</div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-start justify-center py-12 px-6">
        <div className="w-full max-w-2xl">
          <StepIndicator current={step} />

          <div className="bg-white rounded-xl border border-outline-variant p-8 shadow-card">
            {stepComponents[step]}
          </div>

          {/* Help + Security sidecards */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white rounded-lg border border-outline-variant p-4">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle size={16} className="text-emerald" />
                <span className="text-sm font-semibold text-on-surface">Need Help?</span>
              </div>
              <p className="text-xs text-on-surface-variant mb-2">
                Our enterprise finance team is available 24/7 to assist with banking setup and compliance.
              </p>
              <a href="mailto:support@alluvium.net" className="text-xs text-emerald font-medium hover:underline flex items-center gap-1">
                Contact Support <ArrowRight size={12} />
              </a>
            </div>
            <div className="bg-navy rounded-lg p-4 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(135deg, #006c49 0%, transparent 60%)' }} />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-light mb-1">Security Guaranteed</p>
                <p className="text-xs text-slate-300">Your data is encrypted with bank-grade 256-bit protocols.</p>
              </div>
            </div>
          </div>

          {/* Nav buttons */}
          <div className="flex items-center justify-between mt-6">
            <Button variant="secondary" onClick={() => navigate('/onboarding')} size="md" className="gap-2">
              <Save size={15} /> Save as Draft
            </Button>
            <div className="flex gap-3">
              {step > 0 && (
                <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
                  <ArrowLeft size={15} /> Previous
                </Button>
              )}
              <Button onClick={handleNext}>
                {step === STEPS.length - 1 ? 'Submit' : 'Next Step'}
                <ArrowRight size={15} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-white border-t border-outline-variant py-3 text-center text-xs text-on-surface-variant">
        &copy; 2024 VendorPay Enterprise Finance Inc. All rights reserved. PCI-DSS Level 1 Compliant.
      </footer>
    </div>
  );
}
