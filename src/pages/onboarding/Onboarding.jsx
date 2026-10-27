import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getData as getCountryData } from "country-list";
import CURRENCY_BY_COUNTRY from "currency-code-map";
import { Check, ArrowRight, ArrowLeft, Save, ShieldCheck } from "lucide-react";
import { vendorService } from "../../lib/services/vendorService";
import { useAuth } from "../../lib/authContext";
import { extractErrorMessage, isValidEmail } from "../../lib/utils";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import PhoneInput from "../../components/ui/PhoneInput";
import Select from "../../components/ui/Select";
import { cn } from "../../lib/utils";
// import { ToastContainer, toast } from "react-toastify";
const STEPS = ["Company", "Banking", "Contact", "Review"];

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
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all",
                  done && "bg-secondary border-secondary text-white",
                  active && "bg-white border-secondary text-secondary",
                  !done &&
                    !active &&
                    "bg-white border-outline-variant text-on-surface-variant",
                )}
              >
                {done ? <Check size={14} /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium uppercase tracking-wider",
                  active
                    ? "text-secondary"
                    : done
                      ? "text-secondary"
                      : "text-outline",
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-24 mb-5 mx-1 transition-colors",
                  done ? "bg-secondary" : "bg-outline-variant",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CompanyStep({ data, onChange, errors }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-headline-lg text-2xl font-semibold text-on-surface tracking-tight">
          Company Information
        </h2>
        <p className="text-on-surface-variant text-sm mt-1">
          Tell us about your business to get started.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 ">
          <Input
            label="Legal Company Name"
            name="companyName"
            value={data.companyName}
            onChange={onChange}
            placeholder="e.g. Acme Corporation LLC"
            required
            error={!data.companyName && errors?.companyName}
          />
        </div>
        <Input
          label="Tax ID / EIN"
          name="taxId"
          value={data.taxId}
          onChange={onChange}
          placeholder="Enter your Tax ID"
          required
          error={!data.taxId && errors?.taxId}
        />
        {/* <Input
          label="Business Type"
          name="businessType"
          value={data.businessType}
          onChange={onChange}
          placeholder="e.g. LLC, Corporation"
          required
          error={errors?.businessType}
        /> */}
        <Select
          label="Business Type"
          name="businessType"
          value={data.businessType}
          onChange={onChange}
          placeholder="e.g. LLC, Corporation"
          required
          error={!data.businessType && errors?.businessType}
        >
          <option value="">Select business type</option>
          <option>LLC</option>
          <option>Corporation</option>
          <option>Partnership</option>
          <option>Sole Proprietorship</option>
        </Select>
        <div className="col-span-2">
          <Input
            label="Business Address"
            name="address"
            value={data.address}
            onChange={onChange}
            placeholder="123 Main Street, New York, NY 10001"
            required
            error={!data.address && errors?.address}
          />
        </div>
        <Input
          label="Website"
          name="website"
          value={data.website}
          onChange={onChange}
          placeholder="https://yourcompany.com"
          error={errors?.website}
        />
        <Select
          label="Industry"
          name="industry"
          value={data.industry}
          onChange={onChange}
          required
          error={!data.industry && errors.industry}
        >
          <option value="">Select industry</option>
          <option>Technology</option>
          <option>Manufacturing</option>
          <option>Logistics</option>
          <option>Professional Services</option>
          <option>Healthcare</option>
          <option>Other</option>
        </Select>
        {/* <Select
          label="Preferred Currency"
          name="currency"
          value={data.currency}
          onChange={onChange}
          required
        >
          <option value="">Select currency</option>
          <option value="USD">USD – US Dollar ($)</option>
          <option value="EUR">EUR – Euro (€)</option>
          <option value="GBP">GBP – British Pound (£)</option>
          <option value="CAD">CAD – Canadian Dollar (C$)</option>
          <option value="KES">KES – Kenyan Shilling (KSh)</option>
          <option value="NGN">NGN – Nigerian Naira (₦)</option>
          <option value="ZAR">ZAR – South African Rand (R)</option>
          <option value="GHS">GHS – Ghanaian Cedi (GH₵)</option>
          <option value="UGX">UGX – Ugandan Shilling (USh)</option>
          <option value="TZS">TZS – Tanzanian Shilling (TSh)</option>
          <option value="RWF">RWF – Rwandan Franc (FRw)</option>
          <option value="ETB">ETB – Ethiopian Birr (Br)</option>
          <option value="XOF">XOF – West African CFA (CFA)</option>
          <option value="XAF">XAF – Central African CFA (FCFA)</option>
          <option value="EGP">EGP – Egyptian Pound (E£)</option>
          <option value="MAD">MAD – Moroccan Dirham (DH)</option>
        </Select> */}
      </div>
    </div>
  );
}
// country-list ships official ISO 3166-1 short names (e.g. "United States
// of America (the)", "Korea (the Republic of)"), which read oddly in a
// banking form — clean those up for display while keeping the ISO code as
// the stored value. (Same cleanup used for the company-country pickers in
// CompanySignup.jsx / company.jsx.)
const COUNTRY_NAME_OVERRIDES = {
  US: "United States",
  GB: "United Kingdom",
  KR: "South Korea",
  KP: "North Korea",
  TW: "Taiwan",
  RU: "Russia",
  VE: "Venezuela",
  BO: "Bolivia",
  IR: "Iran",
  LA: "Laos",
  SY: "Syria",
  NL: "Netherlands",
  MD: "Moldova",
  VA: "Vatican City",
  CD: "DR Congo",
  CG: "Republic of the Congo",
  FK: "Falkland Islands",
  VG: "British Virgin Islands",
  VI: "U.S. Virgin Islands",
  FM: "Micronesia",
};

const COUNTRIES = getCountryData()
  .map(({ code, name }) => ({
    code,
    name:
      COUNTRY_NAME_OVERRIDES[code] ?? name.replace(/\s*\(the\)$/i, "").trim(),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

// Countries with well-known, distinct local payment rails and bank-detail
// fields — researched and curated by hand, since no public API maps
// country -> local clearing network (see conversation with Abdul, Oct 2026).
const SPECIFIC_COUNTRY_FIELDS = {
  US: {
    rail: "ACH",
    bankPlaceholder: "e.g. Chase, Wells Fargo",
    fields: [
      {
        name: "routingNumber",
        label: "Routing Number",
        placeholder: "000000000",
        hint: "9-digit ABA routing number",
      },
      {
        name: "accountNumber",
        label: "Account Number",
        placeholder: "Enter account number",
      },
    ],
    accountTypes: ["Checking", "Savings"],
  },

  GB: {
    rail: "Faster Payments",
    bankPlaceholder: "e.g. Barclays, HSBC",
    fields: [
      {
        name: "sortCode",
        label: "Sort Code",
        placeholder: "00-00-00",
        hint: "6-digit UK sort code",
      },
      {
        name: "accountNumber",
        label: "Account Number",
        placeholder: "8-digit account number",
      },
    ],
    accountTypes: ["Current", "Savings"],
  },

  NG: {
    rail: "NIP",
    bankPlaceholder: "e.g. GTBank, Access Bank",
    fields: [
      {
        name: "accountNumber",
        label: "Account Number",
        placeholder: "10-digit NUBAN",
        hint: "10-digit NUBAN account number",
      },
      {
        name: "swiftCode",
        label: "SWIFT / BIC",
        placeholder: "e.g. GTBINGLA",
        hint: "Required for international wires",
      },
    ],
    accountTypes: ["Current", "Savings", "Domiciliary"],
  },

  KE: {
    rail: "EFT / RTGS",
    bankPlaceholder: "e.g. Equity Bank, KCB",
    fields: [
      {
        name: "accountNumber",
        label: "Account Number",
        placeholder: "Enter account number",
      },
      {
        name: "branchCode",
        label: "Branch Code",
        placeholder: "e.g. 68000",
        hint: "Bank branch identifier",
      },
      {
        name: "swiftCode",
        label: "SWIFT / BIC",
        placeholder: "e.g. EQBLKENA",
      },
    ],
    accountTypes: ["Current", "Savings"],
  },

  ZA: {
    rail: "EFT",
    bankPlaceholder: "e.g. Standard Bank, FNB",
    fields: [
      {
        name: "accountNumber",
        label: "Account Number",
        placeholder: "Enter account number",
      },
      {
        name: "branchCode",
        label: "Branch Code",
        placeholder: "e.g. 250655",
        hint: "Universal branch code",
      },
    ],
    accountTypes: ["Cheque", "Savings", "Transmission"],
  },

  CA: {
    rail: "EFT",
    bankPlaceholder: "e.g. RBC, TD",
    fields: [
      {
        name: "transitNumber",
        label: "Transit Number",
        placeholder: "00000",
        hint: "5-digit branch transit",
      },
      {
        name: "institutionNumber",
        label: "Institution Number",
        placeholder: "000",
        hint: "3-digit bank ID",
      },
      {
        name: "accountNumber",
        label: "Account Number",
        placeholder: "Enter account number",
      },
    ],
    accountTypes: ["Chequing", "Savings"],
  },
};

// The 20 countries that settle over SEPA using EUR.
const EUROZONE_CODES = [
  "AT",
  "BE",
  "HR",
  "CY",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PT",
  "SK",
  "SI",
  "ES",
];

const EUROZONE_FIELDS = {
  rail: "SEPA",
  bankPlaceholder: "e.g. Deutsche Bank, BNP Paribas",
  fields: [
    {
      // Named accountNumber (not "iban") so it lines up with the
      // required-field check and submit payload key every other
      // country's primary field already uses.
      name: "accountNumber",
      label: "IBAN",
      placeholder: "DE89 3704 0044 0532 0130 00",
      hint: "International Bank Account Number",
    },
    {
      name: "swiftCode",
      label: "SWIFT / BIC",
      placeholder: "e.g. DEUTDEFF",
    },
  ],
  accountTypes: ["Current", "Savings"],
};

// Every other country: a generic international-wire profile. Still gets the
// right payment rail label and the country's real currency, just without
// hand-researched local bank fields.
const DEFAULT_FIELDS = {
  rail: "SWIFT",
  bankPlaceholder: "Local bank name",
  fields: [
    {
      // Named accountNumber (not "iban") — see EUROZONE_FIELDS above.
      name: "accountNumber",
      label: "IBAN / Account Number",
      placeholder: "Enter IBAN or account number",
    },
    {
      name: "swiftCode",
      label: "SWIFT / BIC",
      placeholder: "e.g. XXXXXXXX",
      hint: "Required for international wires",
    },
  ],
  accountTypes: ["Current", "Savings"],
};

const COUNTRY_PROFILES = Object.fromEntries(
  COUNTRIES.map(({ code, name }) => {
    const base =
      SPECIFIC_COUNTRY_FIELDS[code] ??
      (EUROZONE_CODES.includes(code) ? EUROZONE_FIELDS : DEFAULT_FIELDS);

    return [
      code,
      {
        ...base,
        label: name,
        currency: CURRENCY_BY_COUNTRY[code] || "",
      },
    ];
  }),
);
// Country-specific banking inputs. When the country changes these must be
// cleared, otherwise a value typed for the old country (e.g. a US routing
// number) gets sent with the new one and the banking setup is rejected.
const COUNTRY_SPECIFIC_FIELDS = [
  "country",
  "bankName",
  "accountName",
  "accountNumber",
  "confirmAccount",
  "accountType",
  "routingNumber",
  "sortCode",
  "swiftCode",
  "branchCode",
  "transitNumber",
  "institutionNumber",
  "currency",
  "paymentRail",
  "routingNumber",
  "sortCode",
  "swiftCode",
  "branchCode",
  "transitNumber",
  "institutionNumber",
];

// function resetForCountry(prev, countryCode) {
//   const profile = COUNTRY_PROFILES[countryCode];
//   const next = { ...prev, country: countryCode };
//   next.currency = profile?.currency || "";
//   next.paymentRail = profile?.rail || "";

//   for (const key of COUNTRY_SPECIFIC_FIELDS) next[key] = "";
//   if (!profile?.accountTypes?.includes(prev.accountType)) next.accountType = "";
//   return next;
// }
function resetForCountry(prev, countryCode) {
  const profile = COUNTRY_PROFILES[countryCode];

  return {
    ...prev,

    // Set the newly selected country
    country: countryCode,

    // Clear the banking input fields
    bankName: "",
    accountName: "",
    accountNumber: "",
    confirmAccount: "",
    accountType: "",

    // Clear all country-specific fields
    routingNumber: "",
    sortCode: "",
    swiftCode: "",
    branchCode: "",
    transitNumber: "",
    institutionNumber: "",

    // Update based on the newly selected country
    currency: profile?.currency || "",
    paymentRail: profile?.rail || "",
  };
}
function BankingStep({ data, onChange, errors }) {
  const country = data.country;
  const profile = COUNTRY_PROFILES[country] || {
    rail: "",
    bankPlaceholder: "",
    fields: [],
    accountTypes: [],
    currency: "",
  };
  const countrySelected = !!country;
  // With an odd number of country fields (besides the account number), the
  // last one would sit alone on a row — it's moved to the end of the form.
  const otherFields = profile.fields.filter((f) => f.name !== "accountNumber");
  const fullRowField =
    otherFields.length % 2 === 1 ? otherFields[otherFields.length - 1] : null;
  const mismatch =
    data.accountNumber &&
    data.confirmAccount &&
    data.accountNumber !== data.confirmAccount;
  const handleCountryChange = (e) => {
    const countryCode = e.target.value;
    const next = resetForCountry(data, countryCode);

    for (const key of [
      "country",
      "currency",
      "paymentRail",
      "accountType",
      ...COUNTRY_SPECIFIC_FIELDS,
    ]) {
      onChange({ target: { name: key, value: next[key] } });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-headline-lg text-2xl font-semibold text-on-surface tracking-tight">
          Banking Information
        </h2>
        <p className="text-on-surface-variant text-sm mt-1">
          Select your country so we can collect the right payment details for
          your region.
        </p>
      </div>

      <div className="bg-success/5 border border-success/20 rounded-lg p-3 flex items-start gap-2 text-sm text-success">
        <ShieldCheck size={16} className="mt-0.5 flex-shrink-0" />
        All bank accounts must be verified through our secure automated system
        before first disbursement can be processed.
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Country"
          name="country"
          value={country}
          onChange={handleCountryChange}
          required
        >
          <option value="">Select Country First</option>
          {Object.entries(COUNTRY_PROFILES).map(([code, { label }]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </Select>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
            Payment Rail
          </label>
          <div className="w-full rounded border border-outline-variant bg-surface-container px-3 py-2 text-sm text-on-surface-variant">
            {countrySelected ? profile.rail : "Select a country first"}
          </div>
        </div>
      </div>

      <div className="relative">
        {!countrySelected && (
          <div className="absolute inset-0 z-10 bg-surface/60 backdrop-blur-[1px] rounded-lg cursor-not-allowed flex items-center justify-center">
            <div className="bg-white border border-outline-variant rounded-lg px-4 py-3 shadow-sm text-center">
              <p className="text-sm font-medium text-on-surface">
                Select a country first
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                Banking fields will appear here
              </p>
            </div>
          </div>
        )}

        <div
          className={cn(
            "grid grid-cols-2 gap-4 transition-opacity duration-200",
            !countrySelected && "opacity-40 pointer-events-none select-none",
          )}
        >
          <Input
            label="Account Name"
            name="accountName"
            value={data.accountName}
            onChange={onChange}
            placeholder="Name on the bank account"
            hint="Must match the name on file with your bank"
            disabled={!countrySelected}
            required
            error={!data.accountName && errors.accountName}
          />
          <Input
            label="Bank Name"
            name="bankName"
            value={data.bankName}
            onChange={onChange}
            placeholder={profile.bankPlaceholder}
            disabled={!countrySelected}
            required
            error={!data.bankName && errors?.bankName}
          />
          {profile.fields.map((field) => {
            const required =
              field.name === "accountNumber" || field.name === "swiftCode";
            const input = (
              <Input
                label={field.label}
                name={field.name}
                value={data[field.name] || ""}
                onChange={onChange}
                placeholder={field.placeholder}
                hint={field.hint}
                disabled={!countrySelected}
                required={required}
                error={required ? errors[field.name] : ""}
              />
            );

            // Account number and its confirmation share a row
            if (field.name === "accountNumber") {
              return (
                <div
                  key={field.name}
                  className="col-span-2 grid grid-cols-2 gap-4"
                >
                  {input}
                  <Input
                    label="Confirm Account Number"
                    name="confirmAccount"
                    value={data.confirmAccount}
                    onChange={onChange}
                    placeholder="Re-enter account number"
                    error={
                      mismatch
                        ? "Account numbers do not match"
                        : !data.confirmAccount && errors?.confirmAccount
                    }
                    disabled={!countrySelected}
                    required
                  />
                </div>
              );
            }

            // A lone field that would take a whole row is rendered last instead
            if (field === fullRowField) return null;

            return <div key={field.name}>{input}</div>;
          })}
          {/* Profiles without an account number field (e.g. EU) still show the confirm input */}
          {!profile.fields.some((f) => f.name === "accountNumber") && (
            <div className="col-span-2">
              <Input
                label="Confirm Account Number"
                name="confirmAccount"
                value={data.confirmAccount}
                onChange={onChange}
                placeholder="Re-enter account number"
                error={
                  mismatch
                    ? "Account numbers do not match"
                    : !data.confirmAccount && errors?.confirmAccount
                }
                disabled={!countrySelected}
                required
              />
            </div>
          )}

          <Select
            label="Account Type"
            name="accountType"
            value={data.accountType}
            onChange={onChange}
            disabled={!countrySelected}
            required
            error={!data.accountType && errors?.accountType}
          >
            <option value="">Select account type</option>
            {profile?.accountTypes?.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Input
            label="Currency"
            name="currency"
            value={data.currency}
            placeholder="Currency will be selected automatically"
            disabled
            required
            error={!data.currency && errors?.currency}
          />
          {fullRowField && (
            <div className="col-span-2">
              <Input
                label={fullRowField.label}
                name={fullRowField.name}
                value={data[fullRowField.name] || ""}
                onChange={onChange}
                placeholder={fullRowField.placeholder}
                hint={fullRowField.hint}
                disabled={!countrySelected}
                required={fullRowField.name === "swiftCode"}
                error={
                  fullRowField.name === "swiftCode"
                    ? errors[fullRowField.name]
                    : ""
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* <label
        className={cn(
          "flex items-start gap-2 select-none text-sm",
          !countrySelected
            ? "text-on-surface-variant/40 cursor-not-allowed"
            : "text-on-surface-variant cursor-pointer",
        )}
      >
        <input
          type="checkbox"
          className="mt-0.5 accent-secondary"
          disabled={!countrySelected}
        />
        I authorize VendorsPay to perform a small test deposit to verify this
        account. I understand that failure to verify may delay payment cycles.
      </label> */}
    </div>
  );
}
// Banking countries that map to a single phone dial code (EU, AF_OTHER and
// OTHER don't, so the phone field starts without a country for them).
const PHONE_COUNTRIES = ["US", "GB", "NG", "KE", "ZA", "CA"];

// Picking a country fills in just the dial code (e.g. "+234"), so a number
// needs more digits than that to count as entered.
const isValidPhone = (phone) => (phone || "").replace(/\D/g, "").length >= 8;

function ContactStep({ data, onChange, errors }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-headline-lg text-2xl font-semibold text-on-surface tracking-tight">
          Contact Information
        </h2>
        <p className="text-on-surface-variant text-sm mt-1">
          Who should we reach for to if you are not available?
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          name="firstName"
          value={data.firstName}
          onChange={onChange}
          placeholder="Jane"
          required
          error={!data.firstName && errors.firstName}
        />
        <Input
          label="Last Name"
          name="lastName"
          value={data.lastName}
          onChange={onChange}
          placeholder="Smith"
          required
          error={!data.lastName && errors.lastName}
        />
        <Input
          label="Email Address"
          type="email"
          name="email"
          value={data.email}
          onChange={onChange}
          placeholder="jane@company.com"
          required
          error={!data.email && errors.email}
        />
        <PhoneInput
          label="Phone Number"
          name="phone"
          value={data.phone}
          onChange={onChange}
          // Start on the banking country's dial code when it's a real country
          country={
            PHONE_COUNTRIES.includes(data.country)
              ? data.country.toLowerCase()
              : undefined
          }
          placeholder="Enter phone number"
          required
          error={!isValidPhone(data.phone) && errors.phone}
        />
        <Input
          label="Job Title"
          name="title"
          value={data.title}
          onChange={onChange}
          placeholder="Accounts Payable Manager"
        />
        <Select
          label="Department"
          name="department"
          value={data.department}
          onChange={onChange}
        >
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

const SECTIONS = [
  {
    key: "company",
    title: "Company",
    fields: [
      { key: "companyName", label: "Company name", type: "text" },
      { key: "taxId", label: "Tax ID", type: "text" },
      {
        key: "businessType",
        label: "Business type",
        type: "select",
        options: ["LLC", "Sole proprietorship", "Corporation", "Partnership"],
      },
      {
        key: "industry",
        label: "Industry",
        type: "select",
        options: [
          "Technology",
          "Manufacturing",
          "Logistics",
          "Professional Services",
          "Healthcare",
          "Other",
        ],
      },
      { key: "address", label: "Address", type: "text" },
      { key: "website", label: "Website", type: "text" },
    ],
  },

  {
    key: "banking",
    title: "Banking",
    fields: [
      {
        key: "country",
        label: "Country",
        type: "country",
      },
      {
        key: "currency",
        label: "Preferred currency",
        type: "readonly",
      },
      {
        key: "paymentRail",
        label: "Payment rail",
        type: "readonly",
        hint: "Set automatically based on country",
      },
      {
        key: "bankName",
        label: "Bank name",
        type: "text",
      },
      {
        key: "accountName",
        label: "Account name",
        type: "text",
      },
      {
        key: "accountType",
        label: "Account type",
        type: "accountType",
        // options: ["Savings", "Current", "Business"],
      },
      {
        key: "accountNumber",
        label: "Account number",
        type: "text",
        sensitive: true,
      },
    ],
  },

  {
    key: "contact",
    title: "Contact",
    fields: [
      {
        key: "firstName",
        label: "Firstname",
        type: "text",
      },
      {
        key: "lastName",
        label: "Lastname",
        type: "text",
      },
      {
        key: "title",
        label: "Job Title",
        type: "text",
      },
      {
        key: "email",
        label: "Email",
        type: "email",
      },
      {
        key: "phone",
        label: "Phone",
        type: "text",
      },
      {
        key: "department",
        label: "Department",
        type: "select",
        options: ["Finance", "Accounting", "Operations", "Legal", "Other"],
      },
    ],
  },
];
export function Toast({ message, show }) {
  if (!show) return null;

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-50">
      <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success-container px-4 py-3 text-sm font-medium text-on-surface shadow-lg">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>

        {message}
      </div>
    </div>
  );
}

function MismatchFlag({ countryCode, address }) {
  const countryLabel = COUNTRY_PROFILES[countryCode]?.label || countryCode;
  if (
    !address ||
    !address.toLowerCase().includes("nigeria") ||
    countryCode === "NG"
  )
    return null;
  return (
    <div className="mx-6 mb-4 flex items-start gap-2 rounded-md border border-warning/30 bg-warning-container px-3 py-2.5 text-sm text-on-surface">
      <svg
        className="mt-0.5 shrink-0"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="13" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>
        Your company address is in Nigeria, but your country is set to{" "}
        {countryLabel}. If that's not intentional, edit this section before
        submitting.
      </span>
    </div>
  );
}

// function ViewField({ field, value }) {
//   let display = value;

//   if (field.key === "country") {
//     display = COUNTRY_PROFILES[value]?.label || value;
//   }

//   if (field.sensitive && value) {
//     display = "•••• " + value.slice(-4);
//   }

//   return (
//     <div className="flex items-baseline justify-between gap-5 border-b border-outline-variant py-2.5 last:border-b-0">
//       <span className="w-40 shrink-0 text-sm text-on-surface-variant">
//         {field.label}
//       </span>

//       <span className="text-right text-sm font-medium text-on-surface">
//         {display || "—"}
//       </span>
//     </div>
//   );
// }
function ViewField({ field, value }) {
  let display = value;

  if (field.key === "country") {
    display = COUNTRY_PROFILES[value]?.label || value;
  }

  if (field.sensitive && value) {
    display = "•••• " + value.slice(-4);
  }

  return (
    <div className="flex items-baseline justify-between gap-5 border-b border-outline-variant py-2.5 last:border-b-0">
      <span className="w-40 shrink-0 text-sm text-on-surface-variant">
        {field.label}
      </span>

      <span className="text-right text-sm font-medium text-on-surface">
        {display || "—"}
      </span>
    </div>
  );
}
function EditField({ field, value, onChange, draft }) {
  const accountTypeOptions =
    field.type === "accountType"
      ? COUNTRY_PROFILES[draft?.country]?.accountTypes || []
      : [];

  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-medium text-on-surface">
        {field.label}
      </label>

      {field.type === "select" || field.type === "accountType" ? (
        <select
          value={value || ""}
          onChange={(e) => onChange(field.key, e.target.value)}
          className="w-full rounded-md border border-outline bg-white px-3 py-2.5 text-sm text-on-surface outline-none focus:border-secondary"
        >
          <option value="">Select {field.label}</option>

          {(field.type === "accountType"
            ? accountTypeOptions
            : field.options || []
          ).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : field.type === "readonly" ? (
        <div className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2.5 text-sm text-on-surface-variant">
          {value || "—"}
        </div>
      ) : field.type === "country" ? (
        <select
          value={value || ""}
          onChange={(e) => onChange(field.key, e.target.value)}
          className="w-full rounded-md border border-outline bg-white px-3 py-2.5 text-sm text-on-surface outline-none focus:border-secondary"
        >
          <option value="">Select country</option>

          {Object.entries(COUNTRY_PROFILES).map(([code, profile]) => (
            <option key={code} value={code}>
              {profile.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type || "text"}
          value={value || ""}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder || ""}
          className="w-full rounded-md border border-outline bg-white px-3 py-2.5 text-sm text-on-surface outline-none focus:border-secondary"
        />
      )}

      {field.hint && <p className="mt-1 text-xs text-outline">{field.hint}</p>}
    </div>
  );
}

function SectionCard({
  section,
  index,
  values,
  isEditing,
  draft,
  onEdit,
  onCancel,
  onSave,
  onDraftChange,
}) {
  const bankingProfile =
    section.key === "banking" ? COUNTRY_PROFILES[values.country] : null;

  const editBankingProfile =
    section.key === "banking" ? COUNTRY_PROFILES[draft.country] : null;

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-outline-variant bg-white">
      {/* Header */}
      <div
        className={
          "flex items-center justify-between border-b border-outline-variant px-6 py-4 " +
          (isEditing ? "bg-secondary-container" : "bg-surface-container-low")
        }
      >
        <h2 className="flex items-center gap-2.5 text-lg font-semibold text-on-surface">
          <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-success-container text-xs font-bold text-warning">
            {index + 1}
          </span>

          {section.title}
        </h2>

        {isEditing ? (
          <button
            onClick={() => onCancel(section.key)}
            className="rounded-md px-2 py-1 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
          >
            Cancel
          </button>
        ) : (
          <button
            onClick={() => onEdit(section.key)}
            className="rounded-md px-2 py-1 text-sm font-semibold text-warning hover:bg-success-container"
          >
            Edit
          </button>
        )}
      </div>

      {/* VIEW MODE */}
      {!isEditing ? (
        <>
          <div className="px-6 py-1">
            {section.fields.map((field) => {
              // Don't render accountNumber here.
              // We render it below with the country-specific banking fields.
              if (section.key === "banking" && field.key === "accountNumber") {
                return null;
              }

              return (
                <ViewField
                  key={field.key}
                  field={field}
                  value={values[field.key]}
                />
              );
            })}

            {/* Country-specific banking fields */}
            {section.key === "banking" &&
              bankingProfile?.fields?.map((field) => (
                <ViewField
                  key={field.name}
                  field={{
                    key: field.name,
                    label: field.label,
                    sensitive: field.name === "accountNumber",
                  }}
                  value={values[field.name]}
                />
              ))}
          </div>

          {section.key === "banking" && (
            <MismatchFlag
              countryCode={values.country}
              address={values.address}
            />
          )}
        </>
      ) : (
        <>
          {/* EDIT MODE */}
          <div className="grid grid-cols-2 gap-x-4 px-6 pt-4">
            {section.key === "banking" ? (
              <>
                {section.fields.map((field) => {
                  // accountNumber is rendered by COUNTRY_PROFILES
                  // so we don't render it twice.
                  if (field.key === "accountNumber") {
                    return null;
                  }

                  return (
                    // <EditField
                    //   key={field.key}
                    //   field={field}
                    //   value={draft[field.key]}
                    //   draft={draft}
                    //   onChange={onDraftChange}
                    // />
                    <EditField
                      key={field.key}
                      field={field}
                      value={draft[field.key]}
                      draft={draft}
                      onChange={onDraftChange}
                    />
                  );
                })}

                {/* Country-specific fields */}
                {editBankingProfile?.fields?.map((field) => (
                  <EditField
                    key={field.name}
                    field={{
                      key: field.name,
                      label: field.label,
                      type: "text",
                      placeholder: field.placeholder,
                      hint: field.hint,
                      sensitive: field.name === "accountNumber",
                    }}
                    // value={draft[field.name] || ""}
                    value={draft[field.name] || ""}
                    draft={draft}
                    onChange={onDraftChange}
                  />
                ))}
                {editBankingProfile?.fields?.some(
                  (field) => field.name === "accountNumber",
                ) && (
                  <div className="col-span-2">
                    <EditField
                      field={{
                        key: "confirmAccount",
                        label: "Confirm Account Number",
                        type: "text",
                        placeholder: "Re-enter account number",
                      }}
                      value={draft.confirmAccount || ""}
                      draft={draft}
                      onChange={onDraftChange}
                    />

                    {draft.accountNumber &&
                      draft.confirmAccount &&
                      draft.accountNumber !== draft.confirmAccount && (
                        <p className="mt-1 -translate-y-3 text-xs text-error">
                          Account numbers do not match
                        </p>
                      )}
                  </div>
                )}
              </>
            ) : (
              section.fields.map((field) => (
                <EditField
                  key={field.key}
                  field={field}
                  value={draft[field.key]}
                  draft={draft}
                  onChange={onDraftChange}
                />
              ))
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2.5 px-6 pb-5">
            <button
              onClick={() => onCancel(section.key)}
              className="rounded-md border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface-variant"
            >
              Cancel
            </button>

            <button
              onClick={() => onSave(section.key)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Save changes
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ReviewStep({ data, onBack, onSubmit, loading, onDataChange }) {
  const INITIAL_VALUES = {
    companyName: data.companyName,
    taxId: data.taxId,
    businessType: data.businessType,
    industry: data.industry,
    address: data.address,
    website: data.website,

    // Banking
    currency: data.currency,
    country: data.country,
    paymentRail: data.paymentRail,
    bankName: data.bankName,
    accountName: data.accountName,
    accountType: data.accountType,
    accountNumber: data.accountNumber,
    confirmAccount: data.confirmAccount,
    routingNumber: data.routingNumber,
    sortCode: data.sortCode,
    swiftCode: data.swiftCode,
    branchCode: data.branchCode,
    transitNumber: data.transitNumber,
    institutionNumber: data.institutionNumber,

    // Contact
    contactName: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
    firstName: data.firstName,
    lastName: data.lastName,
    title: data.title,
    email: data.email,
    phone: data.phone,
    department: data.department,
  };
  const [values, setValues] = useState(INITIAL_VALUES);
  const [editingSection, setEditingSection] = useState(null);
  const [draft, setDraft] = useState({});
  const [justSaved, setJustSaved] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  function handleEdit(sectionKey) {
    setDraft({ ...values });
    setEditingSection(sectionKey);
    setJustSaved(null);
  }

  function handleCancel() {
    setEditingSection(null);
  }

  function handleDraftChange(fieldKey, value) {
    setDraft((prev) => {
      if (fieldKey === "country") {
        return resetForCountry(prev, value);
      }

      return {
        ...prev,
        [fieldKey]: value,
      };
    });
  }
  // function handleSave(sectionKey) {
  //   console.log(sectionKey);
  //   setValues((prev) => ({ ...prev, ...draft }));
  //   onDataChange((prev) => ({
  //     ...prev,
  //     ...draft,
  //   }));

  //   setEditingSection(null);
  //   const messages = {
  //     banking: "Banking details updated",
  //     company: "Company details updated",
  //     contact: "Contact details updated",
  //   };

  //   setJustSaved(messages[sectionKey] || "Details updated");

  //   setTimeout(() => setJustSaved(null), 3000);
  // }
  function handleSave(sectionKey) {
    if (sectionKey === "contact" && !isValidEmail(draft.email)) {
      setJustSaved("Enter a valid email address");
      return;
    }

    if (sectionKey === "banking") {
      if (!draft.confirmAccount) {
        setJustSaved("Please confirm your account number");
        return;
      }

      if (draft.accountNumber !== draft.confirmAccount) {
        setJustSaved("Account numbers do not match");
        return;
      }
    }

    setValues((prev) => ({ ...prev, ...draft }));

    onDataChange((prev) => ({
      ...prev,
      ...draft,
    }));

    setEditingSection(null);

    const messages = {
      banking: "Banking details updated",
      company: "Company details updated",
      contact: "Contact details updated",
    };

    setJustSaved(messages[sectionKey] || "Details updated");

    setTimeout(() => setJustSaved(null), 3000);
  }
  return (
    <div className="min-h-screen bg-surface-container-low px-5 pb-5 pt-5 text-on-surface">
      <Toast show={!!justSaved} message={justSaved} />
      <div className="mx-auto max-w-2xl">
        {/* <Stepper /> */}

        <div className="mb-7">
          <h1 className="font-headline-lg mb-1.5 text-3xl font-semibold tracking-tight">
            Review your details
          </h1>
          <p className="text-sm text-on-surface-variant">
            Check everything below before you submit. You can edit any section
            without losing your progress.
          </p>
        </div>

        {SECTIONS.map((section, index) => (
          <SectionCard
            key={section.key}
            section={section}
            index={index}
            values={values}
            isEditing={editingSection === section.key}
            draft={draft}
            onEdit={handleEdit}
            onCancel={handleCancel}
            onSave={handleSave}
            onDraftChange={handleDraftChange}
            justSaved={justSaved === section.key}
          />
        ))}
      </div>

      <div className="mx-auto flex max-w-2xl items-center justify-between gap-5">
        <label className="flex items-center gap-2.5 text-sm text-on-surface-variant">
          <input
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          I confirm the information above is accurate.
        </label>
        <div className="flex shrink-0 gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={loading}
            className="rounded-md border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface-variant"
          >
            Back
          </Button>
          <button
            onClick={onSubmit}
            disabled={!confirmed || loading}
            className={[
              "inline-flex items-center gap-2 rounded-lg px-5 py-2.5",
              "text-sm font-semibold text-white transition-all",
              confirmed && !loading
                ? "bg-primary hover:bg-primary/90"
                : "cursor-not-allowed bg-outline",
            ].join(" ")}
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Submitting...
              </>
            ) : (
              <>
                <Save size={16} />
                Submit application
              </>
            )}
          </button>
        </div>
      </div>
      {/* </div> */}
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  // The vendor record is created by the first call; if banking then fails,
  // a resubmit must not try to onboard the same vendor again.
  const onboardedRef = useRef(false);
  const [data, setData] = useState({
    companyName: "",
    taxId: "",
    businessType: "",
    address: "",
    website: "",
    industry: "",
    currency: "",
    country: "",
    bankName: "",
    accountName: "",
    accountType: "",
    accountNumber: "",
    confirmAccount: "",
    routingNumber: "",
    sortCode: "",
    swiftCode: "",
    branchCode: "",
    transitNumber: "",
    institutionNumber: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    title: "",
    department: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep = () => {
    const newErrors = {};
    const isValidUrl = (v) => {
      if (!v) return false;
      try {
        const withProtocol = /^https?:\/\//i.test(v) ? v : `https://${v}`;
        const url = new URL(withProtocol);
        return url.hostname.includes(".");
      } catch {
        return false;
      }
    };
    switch (step) {
      case 0:
        if (!data.companyName) {
          newErrors.companyName = "Company name is required";
        }

        if (!data.taxId) {
          newErrors.taxId = "Tax ID is required";
        }
        if (data.website && !isValidUrl(data.website)) {
          newErrors.website = "Enter a valid URL, e.g. yourcompany.com";
        }

        if (!data.address) {
          newErrors.address = "Business address is required";
        }
        if (!data.industry) {
          newErrors.industry = "Industry is required";
        }
        if (!data.businessType) {
          newErrors.businessType = "Business type is required";
        }
        break;

      case 1:
        if (!data.country) {
          newErrors.country = "Country is required";
        }

        if (!data.bankName) {
          newErrors.bankName = "Bank name is required";
        }

        if (!data.accountName) {
          newErrors.accountName = "Account name is required";
        }

        if (!data.accountType) {
          newErrors.accountType = "Account type is required";
        }

        if (!data.accountNumber) {
          newErrors.accountNumber = "Account number is required";
        }

        // Only countries whose profile actually has a swiftCode field
        // (Nigeria, Kenya, Eurozone, and the generic international-wire
        // fallback) need it — the backend rejects these at final submit
        // with "SWIFT code is required for international transfers" if
        // it's missing, so require it here too instead of only catching
        // it after Review.
        if (
          COUNTRY_PROFILES[data.country]?.fields?.some(
            (f) => f.name === "swiftCode",
          ) &&
          !data.swiftCode
        ) {
          newErrors.swiftCode =
            "SWIFT code is required for international transfers";
        }

        if (!data.currency) {
          newErrors.currency = "Currency is required";
        }
        // if (!data.confirmAccount) {
        //   newErrors.confirmAccount = "Please confirm your account number";
        // } else if (data.accountNumber !== data.confirmAccount) {
        //   newErrors.confirmAccount = "Account numbers do not match";
        // }

        break;

      case 2:
        if (!data.firstName) {
          newErrors.firstName = "First name is required";
        }

        if (!data.lastName) {
          newErrors.lastName = "Last name is required";
        }

        if (!data.email) {
          newErrors.email = "Email is required";
        } else if (!isValidEmail(data.email)) {
          newErrors.email = "Enter a valid email address";
        }

        if (!data.phone) {
          newErrors.phone = "Phone number is required";
        } else if (!isValidPhone(data.phone)) {
          newErrors.phone = "Enter a valid phone number";
        }

        break;

      default:
        break;
    }
    console.log("NEW ERRORS:", newErrors);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    setError("");

    const isValid = validateStep();

    if (!isValid) {
      setError("Please fill in all required fields.");
      return;
    }

    setErrors({});
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setError("");
    setErrors({});
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Create/onboard vendor using the FINAL data
      if (!onboardedRef.current) {
        await vendorService.onboard({
          company_name: data.companyName,
          tax_id: data.taxId,
          business_type: data.businessType,
          business_address: data.address,
          industry: data.industry,
          currency: data.currency,
          contact_first_name: data.firstName,
          contact_last_name: data.lastName,
          contact_email: data.email,
          phone: data.phone,
          job_title: data.title,
          department: data.department,
          // bankName: data.bankName,
          // accountName: data.accountName,
          // accountType: data.accountType,
          // accountNumber: data.accountNumber,
          // confirmAccount: data.confirmAccount,
          // routingNumber: data.routingNumber,
          // sortCode: data.sortCode,
          // swiftCode: data.swiftCode,
          // branchCode: data.branchCode,
          // iban: data.iban,
          // transitNumber: data.transitNumber,
          // institutionNumber: data.institutionNumber,
          ...(data.website && {
            website: data.website,
          }),
        });
        onboardedRef.current = true;
      }

      // 2. Setup banking using the FINAL edited data
      // Only read the fields the selected country actually asks for, so
      // leftovers from a previously selected country are never sent.
      const countryFields = new Set(
        COUNTRY_PROFILES[data.country]?.fields?.map((f) => f.name) ?? [],
      );
      const pick = (key) => (countryFields.has(key) ? data[key] : "");

      const routingNumber =
        pick("routingNumber") ||
        pick("sortCode") ||
        pick("branchCode") ||
        pick("transitNumber") ||
        "";

      const COUNTRY_TYPE_MAP = {
        US: "ACH",
        GB: "FASTER_PAYMENTS",
        NG: "NIP",
        KE: "PESALINK",
      };

      const countryType = COUNTRY_TYPE_MAP[data.country] ?? "SWIFT";

      await vendorService.setupBanking({
        bank_name: data.bankName,
        account_name: data.accountName,
        account_type: data.accountType,
        account_number: data.accountNumber,
        routing_number: routingNumber,
        country_type: countryType,

        ...(pick("swiftCode") && {
          swift_code: pick("swiftCode"),
        }),

        // Eurozone/generic-international countries both resolve to
        // countryType "SWIFT" and use accountNumber to hold an IBAN.
        // Send it under both keys since it's untested which one the
        // backend actually reads for this country_type.
        ...(countryType === "SWIFT" &&
          data.accountNumber && {
            iban: data.accountNumber,
          }),

        authorized_test_deposit: true,
      });

      // 3. Complete onboarding
      completeOnboarding();

      // 4. Go to dashboard
      navigate("/vendor/dashboard");
    } catch (err) {
      console.error("SUBMIT ERROR:", err);
      console.error("RESPONSE:", err.response?.data);
      console.error("STATUS:", err.response?.status);

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
          <div className="mb-4 bg-error/5 border border-error/30 rounded-lg p-3 text-sm text-error">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-6">
          {step === 0 && (
            <CompanyStep
              data={data}
              onChange={handleChange}
              errors={error && errors}
            />
          )}
          {step === 1 && (
            <BankingStep
              data={data}
              onChange={handleChange}
              errors={error && errors}
            />
          )}
          {step === 2 && (
            <ContactStep
              data={data}
              onChange={handleChange}
              errors={error && errors}
            />
          )}
          {step === 3 && (
            <ReviewStep
              data={data}
              onBack={handleBack}
              onSubmit={handleSubmit}
              loading={loading}
              onDataChange={setData}
            />
          )}

          {step < STEPS.length - 1 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-outline-variant">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={step === 0}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Back
              </Button>

              <Button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
