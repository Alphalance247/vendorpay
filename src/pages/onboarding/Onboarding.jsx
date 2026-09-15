import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ArrowRight, ArrowLeft, Save, ShieldCheck } from "lucide-react";
import { vendorService } from "../../lib/services/vendorService";
import { useAuth } from "../../lib/authContext";
import { extractErrorMessage } from "../../lib/utils";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
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
                  done && "bg-emerald border-emerald text-white",
                  active && "bg-white border-emerald text-emerald",
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
                    ? "text-emerald"
                    : done
                      ? "text-emerald"
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
                  done ? "bg-emerald" : "bg-outline-variant",
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
        <h2 className="text-2xl font-semibold text-on-surface tracking-tight">
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
            error={errors?.companyName}
          />
        </div>
        <Input
          label="Tax ID / EIN"
          name="taxId"
          value={data.taxId}
          onChange={onChange}
          placeholder="XX-XXXXXXX"
          required
          error={errors?.taxId}
        />
        <Input
          label="Business Type"
          name="businessType"
          value={data.businessType}
          onChange={onChange}
          placeholder="e.g. LLC, Corporation"
          required
          error={errors?.businessType}
        />
        <div className="col-span-2">
          <Input
            label="Business Address"
            name="address"
            value={data.address}
            onChange={onChange}
            placeholder="123 Main Street, New York, NY 10001"
            required
            error={errors?.address}
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
          error={errors.industry}
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
const COUNTRY_PROFILES = {
  US: {
    label: "United States",
    currency: "USD",
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
    label: "United Kingdom",
    currency: "GBP",
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
    label: "Nigeria",
    currency: "NGN",
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
    label: "Kenya",
    currency: "KES",
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
    label: "South Africa",
    currency: "ZAR",
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
    label: "Canada",
    currency: "CAD",
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

  AF_OTHER: {
    label: "Other African Country",
    currency: "USD",
    rail: "SWIFT",
    bankPlaceholder: "Local bank name",
    fields: [
      {
        name: "accountNumber",
        label: "Account Number",
        placeholder: "Enter account number",
      },
      {
        name: "swiftCode",
        label: "SWIFT / BIC",
        placeholder: "e.g. XXXXXXXX",
        hint: "Required for international wires",
      },
    ],
    accountTypes: ["Current", "Savings"],
  },

  EU: {
    label: "Eurozone (SEPA)",
    currency: "EUR",
    rail: "SEPA",
    bankPlaceholder: "e.g. Deutsche Bank, BNP Paribas",
    fields: [
      {
        name: "iban",
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
  },

  OTHER: {
    label: "Other / International Wire",
    currency: "USD",
    rail: "SWIFT",
    bankPlaceholder: "Local bank name",
    fields: [
      {
        name: "iban",
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
  },
};
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
  const mismatch =
    data.accountNumber &&
    data.confirmAccount &&
    data.accountNumber !== data.confirmAccount;
  const handleCountryChange = (e) => {
    const countryCode = e.target.value;

    const profile = COUNTRY_PROFILES[countryCode];

    onChange({
      target: {
        name: "country",
        value: countryCode,
      },
    });

    onChange({
      target: {
        name: "currency",
        value: profile?.currency || "",
      },
    });

    onChange({
      target: {
        name: "paymentRail",
        value: profile?.rail || "",
      },
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-on-surface tracking-tight">
          Banking Information
        </h2>
        <p className="text-on-surface-variant text-sm mt-1">
          Select your country so we can collect the right payment details for
          your region.
        </p>
      </div>

      <div className="bg-emerald/5 border border-emerald/20 rounded-lg p-3 flex items-start gap-2 text-sm text-emerald">
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
          <div className="w-full rounded border border-outline-variant bg-surface-low px-3 py-2 text-sm text-on-surface-variant">
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
            error={errors.accountName}
          />

          {profile.fields.map((field) => (
            <div
              key={field.name}
              className={
                profile.fields.length % 2 === 1 &&
                field === profile.fields[profile.fields.length - 1]
                  ? "col-span-2"
                  : ""
              }
            >
              <Input
                label={field.label}
                name={field.name}
                value={data[field.name] || ""}
                onChange={onChange}
                placeholder={field.placeholder}
                hint={field.hint}
                disabled={!countrySelected}
                required={field.name === "accountNumber"}
                error={
                  field.name === "accountNumber" ? errors.accountNumber : ""
                }
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
            required
            error={errors?.bankName}
          />

          <Select
            label="Account Type"
            name="accountType"
            value={data.accountType}
            onChange={onChange}
            disabled={!countrySelected}
            required
            error={errors?.accountType}
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
            error={errors?.currency}
          />
          <div className="col-span-2">
            <Input
              label="Confirm Account Number"
              name="confirmAccount"
              value={data.confirmAccount}
              onChange={onChange}
              placeholder="Re-enter account number"
              error={mismatch ? "Account numbers do not match" : undefined}
              disabled={!countrySelected}
              required
              error={errors.confirmAccount}
            />
          </div>
        </div>
      </div>

      <label
        className={cn(
          "flex items-start gap-2 select-none text-sm",
          !countrySelected
            ? "text-on-surface-variant/40 cursor-not-allowed"
            : "text-on-surface-variant cursor-pointer",
        )}
      >
        <input
          type="checkbox"
          className="mt-0.5 accent-emerald"
          disabled={!countrySelected}
        />
        I authorize VendorPay to perform a small test deposit to verify this
        account. I understand that failure to verify may delay payment cycles.
      </label>
    </div>
  );
}
function ContactStep({ data, onChange, errors }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-on-surface tracking-tight">
          Contact Information
        </h2>
        <p className="text-on-surface-variant text-sm mt-1">
          Who should we reach for payment and compliance matters?
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
          error={errors.firstName}
        />
        <Input
          label="Last Name"
          name="lastName"
          value={data.lastName}
          onChange={onChange}
          placeholder="Smith"
          required
          error={errors.lastName}
        />
        <Input
          label="Email Address"
          type="email"
          name="email"
          value={data.email}
          onChange={onChange}
          placeholder="jane@company.com"
          required
          error={errors.email}
        />
        <Input
          label="Phone Number"
          type="tel"
          name="phone"
          value={data.phone}
          onChange={onChange}
          placeholder="+1 (555) 000-0000"
          required
          error={errors.phone}
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

// function ReviewStep({ data }) {
//   const rows = [
//     { label: "Company", value: data.companyName },
//     { label: "Tax ID", value: data.taxId },
//     { label: "Business Type", value: data.businessType },
//     { label: "Address", value: data.address },
//     { label: "Website", value: data.website },
//     { label: "Industry", value: data.industry },
//     { label: "Preferred Currency", value: data.currency },
//     {
//       label: "Country",
//       value: COUNTRY_PROFILES[data.country]?.label || data.country,
//     },
//     { label: "Bank Name", value: data.bankName },
//     { label: "Account Name", value: data.accountName },
//     { label: "Account Type", value: data.accountType },
//     { label: "Account Number", value: data.accountNumber },
//     { label: "Contact", value: `${data.firstName} ${data.lastName}` },
//     { label: "Email", value: data.email },
//     { label: "Phone", value: data.phone },
//     { label: "Title", value: data.title },
//     { label: "Department", value: data.department },
//   ];

//   return (
//     <div className="space-y-4">
//       <div>
//         <h2 className="text-2xl font-semibold text-on-surface tracking-tight">
//           Review & Submit
//         </h2>
//         <p className="text-on-surface-variant text-sm mt-1">
//           Please review your information before submitting.
//         </p>
//       </div>
//       <div className="bg-surface-low rounded-lg border border-outline-variant overflow-hidden">
//         <table className="w-full text-sm">
//           <tbody>
//             {rows.map((row, i) =>
//               row.value ? (
//                 <tr
//                   key={i}
//                   className="border-b border-outline-variant last:border-0"
//                 >
//                   <td className="px-4 py-3 font-medium text-on-surface-variant w-1/3">
//                     {row.label}
//                   </td>
//                   <td className="px-4 py-3 text-on-surface">{row.value}</td>
//                 </tr>
//               ) : null,
//             )}
//           </tbody>
//         </table>
//       </div>
//       <div className="bg-emerald/5 border border-emerald/20 rounded-lg p-3 flex items-start gap-2 text-sm text-emerald">
//         <ShieldCheck size={16} className="mt-0.5 flex-shrink-0" />
//         By submitting, you confirm all information is accurate and agree to our
//         verification process.
//       </div>
//     </div>
//   );
// }

// const SECTIONS = [
//   {
//     key: "company",
//     title: "Company",
//     fields: [
//       { key: "companyName", label: "Company name", type: "text" },
//       { key: "taxId", label: "Tax ID", type: "text" },
//       {
//         key: "bizType",
//         label: "Business type",
//         type: "select",
//         options: ["LLC", "Sole proprietorship", "Corporation", "Partnership"],
//       },
//       {
//         key: "industry",
//         label: "Industry",
//         type: "select",
//         options: [
//           "Technology",
//           "Manufacturing",
//           "Logistics",
//           "Professional Services",
//           "Healthcare",
//           "Other",
//         ],
//       },
//       { key: "address", label: "Address", type: "text" },
//       { key: "website", label: "Website", type: "text" },
//     ],
//   },
//   {
//     key: "banking",
//     title: "Banking",

//     fields: [
//       {
//         key: "country",
//         label: "Country",
//         type: "country",
//       },
//       {
//         key: "currency",
//         label: "Preferred currency",
//         type: "readonly",
//       },
//       {
//         key: "bankName",
//         label: "Bank name",
//         type: "text",
//       },
//       {
//         key: "accounttName",
//         label: "Account name",
//         type: "text",
//       },

//       {
//         key: "accountType",
//         label: "Account type",
//         type: "select",
//         options: ["Savings", "Current", "Business"],
//       },
//       {
//         key: "paymentRail",
//         label: "Payment rail",
//         type: "readonly",
//         hint: "Set automatically based on country",
//       },
//     ],
//   },
//   {
//     key: "contact",
//     title: "Contact",
//     fields: [
//       { key: "contactName", label: "Contact name", type: "text" },
//       { key: "title", label: "Title", type: "text" },
//       { key: "email", label: "Email", type: "email" },
//       { key: "phone", label: "Phone", type: "text" },
//     ],
//   },
// ];
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
        type: "select",
        options: ["Savings", "Current", "Business"],
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
        key: "contactName",
        label: "Contact name",
        type: "text",
      },
      {
        key: "title",
        label: "Title",
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
    ],
  },
];
function Toast({ message, show }) {
  if (!show) return null;

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-50">
      <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg">
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
    <div className="mx-6 mb-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
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
//     <div className="flex items-baseline justify-between gap-5 border-b border-stone-100 py-2.5 last:border-b-0">
//       <span className="w-40 shrink-0 text-sm text-stone-500">
//         {field.label}
//       </span>

//       <span className="text-right text-sm font-medium text-stone-900">
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
    <div className="flex items-baseline justify-between gap-5 border-b border-stone-100 py-2.5 last:border-b-0">
      <span className="w-40 shrink-0 text-sm text-stone-500">
        {field.label}
      </span>

      <span className="text-right text-sm font-medium text-stone-900">
        {display || "—"}
      </span>
    </div>
  );
}
function EditField({ field, value, onChange }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-medium text-stone-700">
        {field.label}
      </label>

      {field.type === "select" ? (
        <select
          value={value || ""}
          onChange={(e) => onChange(field.key, e.target.value)}
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-emerald-500"
        >
          <option value="">Select {field.label}</option>

          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : field.type === "readonly" ? (
        <div className="w-full rounded-md border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-600">
          {value || "—"}
        </div>
      ) : field.type === "country" ? (
        <select
          value={value || ""}
          onChange={(e) => onChange(field.key, e.target.value)}
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-emerald-500"
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
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-emerald-500"
        />
      )}

      {field.hint && (
        <p className="mt-1 text-xs text-stone-400">{field.hint}</p>
      )}
    </div>
  );
}
// function SectionCard({
//   section,
//   index,
//   values,
//   isEditing,
//   draft,
//   onEdit,
//   onCancel,
//   onSave,
//   onDraftChange,
//   justSaved,
// }) {
//   return (
//     <div className="mb-4 overflow-hidden rounded-xl border border-stone-200 bg-white">
//       <div
//         className={
//           "flex items-center justify-between border-b border-stone-200 px-6 py-4 " +
//           (isEditing ? "bg-emerald-50/40" : "bg-stone-50")
//         }
//       >
//         <h2 className="flex items-center gap-2.5 text-lg font-semibold text-stone-900">
//           <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-amber-700">
//             {index + 1}
//           </span>
//           {section.title}
//         </h2>
//         {isEditing ? (
//           <button
//             onClick={() => onCancel(section.key)}
//             className="rounded-md px-2 py-1 text-sm font-semibold text-stone-500 hover:bg-stone-100"
//           >
//             Cancel
//           </button>
//         ) : (
//           <button
//             onClick={() => onEdit(section.key)}
//             className="rounded-md px-2 py-1 text-sm font-semibold text-amber-700 hover:bg-emerald-50"
//           >
//             Edit
//           </button>
//         )}
//       </div>
//       <Toast show={!!justSaved} message={justSaved} />
//       {!isEditing ? (
//         <>
//           <div className="px-6 py-1">
//             {section.fields.map((field) => (
//               <ViewField
//                 key={field.key}
//                 field={field}
//                 value={values[field.key]}
//               />
//             ))}
//           </div>
//           {section.key === "company" && <MismatchFlag />}
//         </>
//       ) : (
//         <>
//           <div className="grid grid-cols-2 gap-x-4 px-6 pt-4">
//             {section.key === "banking" ? (
//               <>
//                 {section.fields.map((field) => (
//                   <EditField
//                     key={field.key}
//                     field={field}
//                     value={draft[field.key]}
//                     onChange={onDraftChange}
//                   />
//                 ))}

//                 {COUNTRY_PROFILES[draft.country]?.fields?.map((field) => (
//                   <EditField
//                     key={field.name}
//                     field={{
//                       key: field.name,
//                       label: field.label,
//                       type: "text",
//                       placeholder: field.placeholder,
//                       hint: field.hint,
//                       sensitive: field.name === "accountNumber",
//                     }}
//                     value={draft[field.name] || ""}
//                     onChange={onDraftChange}
//                   />
//                 ))}
//               </>
//             ) : (
//               section.fields.map((field) => (
//                 <EditField
//                   key={field.key}
//                   field={field}
//                   value={draft[field.key]}
//                   onChange={onDraftChange}
//                 />
//               ))
//             )}
//           </div>
//           <div className="flex justify-end gap-2.5 px-6 pb-5">
//             <button
//               onClick={() => onCancel(section.key)}
//               className="rounded-md border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-500"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={() => onSave(section.key)}
//               className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white"
//             >
//               Save changes
//             </button>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }
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
    <div className="mb-4 overflow-hidden rounded-xl border border-stone-200 bg-white">
      {/* Header */}
      <div
        className={
          "flex items-center justify-between border-b border-stone-200 px-6 py-4 " +
          (isEditing ? "bg-emerald-50/40" : "bg-stone-50")
        }
      >
        <h2 className="flex items-center gap-2.5 text-lg font-semibold text-stone-900">
          <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-amber-700">
            {index + 1}
          </span>

          {section.title}
        </h2>

        {isEditing ? (
          <button
            onClick={() => onCancel(section.key)}
            className="rounded-md px-2 py-1 text-sm font-semibold text-stone-500 hover:bg-stone-100"
          >
            Cancel
          </button>
        ) : (
          <button
            onClick={() => onEdit(section.key)}
            className="rounded-md px-2 py-1 text-sm font-semibold text-amber-700 hover:bg-emerald-50"
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
                    <EditField
                      key={field.key}
                      field={field}
                      value={draft[field.key]}
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
                    value={draft[field.name] || ""}
                    onChange={onDraftChange}
                  />
                ))}
              </>
            ) : (
              section.fields.map((field) => (
                <EditField
                  key={field.key}
                  field={field}
                  value={draft[field.key]}
                  onChange={onDraftChange}
                />
              ))
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2.5 px-6 pb-5">
            <button
              onClick={() => onCancel(section.key)}
              className="rounded-md border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-500"
            >
              Cancel
            </button>

            <button
              onClick={() => onSave(section.key)}
              className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white"
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
  // const INITIAL_VALUES = {
  //   companyName: data.companyName,
  //   taxId: data.taxId,
  //   bizType: data.businessType,
  //   industry: data.industry,
  //   address: data.address,
  //   website: data.website,
  //   currency: data.currency,
  //   country: data.country,
  //   paymentRail: data.paymentRail,
  //   bankName: data.bankName,
  //   acctName: data.accountName,
  //   acctType: data.accountType,
  //   accountNumber: data.accountNumber,
  //   routingNumber: data.routingNumber,
  //   sortCode: data.sortCode,
  //   swiftCode: data.swiftCode,
  //   branchCode: data.branchCode,
  //   iban: data.iban,
  //   transitNumber: data.transitNumber,
  //   contactName: `${data.firstName} ${data.lastName}`,
  //   title: data.title,
  //   email: data.email,
  //   phone: data.phone,
  //   department: data.department,
  // };
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
    iban: data.iban,
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
      const next = {
        ...prev,
        [fieldKey]: value,
      };

      if (fieldKey === "country") {
        const profile = COUNTRY_PROFILES[value];

        if (profile) {
          next.currency = profile.currency;
          next.paymentRail = profile.rail;
        } else {
          next.currency = "";
          next.paymentRail = "";
        }
      }

      return next;
    });
  }
  function handleSave(sectionKey) {
    console.log(sectionKey);
    setValues((prev) => ({ ...prev, ...draft }));
    onDataChange((prev) => ({
      ...prev,
      ...draft,
    }));

    setEditingSection(null);
    // setJustSaved(sectionKey);
    const messages = {
      banking: "Banking details updated",
      company: "Company details updated",
      contact: "Contact details updated",
    };

    setJustSaved(messages[sectionKey] || "Details updated");

    setTimeout(() => setJustSaved(null), 3000);
  }

  return (
    <div className="min-h-screen bg-stone-50 px-5 pb-5 pt-5 text-stone-900">
      <Toast show={!!justSaved} message={justSaved} />
      <div className="mx-auto max-w-2xl">
        {/* <Stepper /> */}

        <div className="mb-7">
          <h1 className="mb-1.5 text-3xl font-semibold tracking-tight">
            Review your details
          </h1>
          <p className="text-sm text-stone-500">
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
        <label className="flex items-center gap-2.5 text-sm text-stone-500">
          <input
            type="checkbox"
            className="h-4 w-4 accent-amber-600"
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
            className="rounded-md border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-500"
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
                ? "bg-amber-600 hover:bg-amber-500"
                : "cursor-not-allowed bg-stone-300",
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
    iban: "",
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
        if (!data.currency) {
          newErrors.currency = "Currency is required";
        }
        if (!data.confirmAccount) {
          newErrors.confirmAccount = "Please confirm your account number";
        } else if (data.accountNumber !== data.confirmAccount) {
          newErrors.confirmAccount = "Account numbers do not match";
        }

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
        }

        if (!data.phone) {
          newErrors.phone = "Phone number is required";
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

        ...(data.website && {
          website: data.website,
        }),
      });

      // 2. Setup banking using the FINAL edited data
      const routingNumber =
        data.routingNumber ||
        data.sortCode ||
        data.branchCode ||
        data.transitNumber ||
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

        ...(data.swiftCode && {
          swift_code: data.swiftCode,
        }),

        ...(data.iban && {
          iban: data.iban,
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
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-6">
          {step === 0 && (
            <CompanyStep data={data} onChange={handleChange} errors={errors} />
          )}
          {step === 1 && (
            <BankingStep data={data} onChange={handleChange} errors={errors} />
          )}
          {step === 2 && (
            <ContactStep data={data} onChange={handleChange} errors={errors} />
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
