import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, ArrowLeft, Save, HelpCircle, ShieldCheck } from 'lucide-react';
import { vendorService } from '../../lib/services/vendorService';
import { useAuth } from '../../lib/authContext';
import { extractErrorMessage } from '../../lib/utils';
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

      <div className="relative">
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
     { label: 'Company', value: data.companyName },
    { label: 'Tax ID', value: data.taxId },
    { label: 'Business Type', value: data.businessType },
    { label: 'Address', value: data.address },
    { label: 'Website', value: data.website },
    { label: 'Industry', value: data.industry },
    { label: 'Country', value: COUNTRY_PROFILES[data.country]?.label || data.country },
    { label: 'Bank Name', value: data.bankName },
    { label: 'Account Type', value: data.accountType },
    { label: 'Account Number', value: data.accountNumber },
    { label: 'Contact', value: `${data.firstName} ${data.lastName}` },
    { label: 'Email', value: data.email },
    { label: 'Phone', value: data.phone },
    { label: 'Title', value: data.title },
    { label: 'Department', value: data.department },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-on-surface tracking-tight">Review & Submit</h2>
        <p className="text-on-surface-variant text-sm mt-1">Please review your information before submitting.</p>
      </div>
      <div className="bg-surface-low rounded-lg border border-outline-variant overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((row, i) => (
              row.value ? (
                <tr key={i} className="border-b border-outline-variant last:border-0">
                  <td className="px-4 py-3 font-medium text-on-surface-variant w-1/3">{row.label}</td>
                  <td className="px-4 py-3 text-on-surface">{row.value}</td>
                </tr>
              ) : null
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-emerald/5 border border-emerald/20 rounded-lg p-3 flex items-start gap-2 text-sm text-emerald">
        <ShieldCheck size={16} className="mt-0.5 flex-shrink-0" />
        By submitting, you confirm all information is accurate and agree to our verification process.
      </div>
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    companyName: '',
    taxId: '',
    businessType: '',
    address: '',
    website: '',
    industry: '',
    country: '',
    bankName: '',
    accountType: '',
    accountNumber: '',
    confirmAccount: '',
    routingNumber: '',
    sortCode: '',
    swiftCode: '',
    branchCode: '',
    iban: '',
    transitNumber: '',
    institutionNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    department: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep = () => {
    switch (step) {
      case 0:
        return data.companyName && data.taxId;
      case 1:
        return data.country && data.bankName && data.accountType && data.accountNumber && data.accountNumber === data.confirmAccount;
      case 2:
        return data.firstName && data.lastName && data.email && data.phone;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setError('');
    setStep((prev) => Math.max(prev - 1, 0));
  };

 const handleSubmit = async () => {
  setLoading(true);
  setError('');

  try {
    await vendorService.onboard({
      company_name: data.companyName,
      tax_id: data.taxId,
      business_type: data.businessType,
      business_address: data.address,
      industry: data.industry,
      contact_first_name: data.firstName,
      contact_last_name: data.lastName,
      contact_email: data.email,
      phone: data.phone,
      job_title: data.title,
      department: data.department,
      ...(data.website && { website: data.website }),
    });

    const routingNumber =
      data.routingNumber ||
      data.sortCode ||
      data.branchCode ||
      data.transitNumber ||
      '';

    const COUNTRY_TYPE_MAP = { US: 'ACH', GB: 'FASTER_PAYMENTS', NG: 'NIP', KE: 'PESALINK' };
    const countryType = COUNTRY_TYPE_MAP[data.country] ?? 'SWIFT';

    await vendorService.setupBanking({
      bank_name: data.bankName,
      account_type: data.accountType,
      account_number: data.accountNumber,
      routing_number: routingNumber,
      country_type: countryType,
      ...(data.swiftCode && { swift_code: data.swiftCode }),
      ...(data.iban && { iban: data.iban }),
      authorized_test_deposit: true,
    });

    completeOnboarding();
    navigate('/vendor/dashboard');
  } catch (err) {
    console.error(err);
    setError(extractErrorMessage(err));
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        <StepIndicator current={step} />
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-6">
          {step === 0 && <CompanyStep data={data} onChange={handleChange} />}
          {step === 1 && <BankingStep data={data} onChange={handleChange} />}
          {step === 2 && <ContactStep data={data} onChange={handleChange} />}
          {step === 3 && <ReviewStep data={data} />}

          <div className="flex justify-between mt-8 pt-6 border-t border-outline-variant">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button onClick={handleNext} className="flex items-center gap-2">
                Next
                <ArrowRight size={16} />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Save size={16} />
                {loading ? 'Submitting...' : 'Submit'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}